// ALL Supabase/TanStack Query code for the share domain.
//
// READS go through the SECURITY DEFINER RPCs get_recipe_share(slug) /
// get_list_share(token) — NEVER a table select on recipe_shares/list_shares
// (they have no anon SELECT by design; a table policy can't express "must
// know the slug", so anon SELECT would make capability URLs enumerable —
// database.md §RLS stance). CREATES insert with a client-minted CSPRNG token.
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/supabase/client';
import type { Json } from '@/types/database';
import { mintToken } from './token';
import type { ListShareResult, RecipeShareResult } from './share.types';

// ---- reads (capability URL → row via DEFINER function) ----------------------

async function fetchRecipeShare(slug: string): Promise<RecipeShareResult> {
  const { data, error } = await supabase.rpc('get_recipe_share', { p_slug: slug });
  if (error) throw error;
  const row = data?.[0];
  if (!row) return { status: 'missing' }; // zero rows → 404
  if (row.status === 'revoked') return { status: 'revoked' }; // → 410
  if (row.status === 'ok') return { status: 'ok', recipe: row.recipe };
  return { status: 'missing' };
}

async function fetchListShare(token: string): Promise<ListShareResult> {
  const { data, error } = await supabase.rpc('get_list_share', { p_token: token });
  if (error) throw error;
  const row = data?.[0];
  if (!row) return { status: 'missing' };
  if (row.status === 'revoked') return { status: 'revoked' };
  if (row.status === 'ok') return { status: 'ok', payload: row.payload };
  return { status: 'missing' };
}

export function useRecipeShare(slug: string) {
  return useQuery({
    queryKey: ['recipeShare', slug],
    queryFn: () => fetchRecipeShare(slug),
    enabled: Boolean(slug),
  });
}

export function useListShare(token: string) {
  return useQuery({
    queryKey: ['listShare', token],
    queryFn: () => fetchListShare(token),
    enabled: Boolean(token),
  });
}

// ---- creates (owner-only INSERT; RLS with-check pins user_id = auth.uid()) --

async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('Not signed in — cannot create a share');
  return data.user.id;
}

// Mint a public link for a recipe. Returns the slug (the capability URL is
// built by the caller). user_id is supplied to satisfy NOT NULL; RLS forces
// it to equal auth.uid(), so a forged owner column is rejected server-side.
export function useCreateRecipeShare() {
  return useMutation({
    mutationFn: async (recipeId: number): Promise<string> => {
      const slug = mintToken();
      const user_id = await currentUserId();
      const { error } = await supabase
        .from('recipe_shares')
        .insert({ slug, recipe_id: recipeId, user_id });
      if (error) throw error;
      return slug;
    },
  });
}

// Snapshot a shopping list behind a public token. payload is the list JSON.
export function useCreateListShare() {
  return useMutation({
    mutationFn: async (payload: Json): Promise<string> => {
      const token = mintToken();
      const user_id = await currentUserId();
      const { error } = await supabase
        .from('list_shares')
        .insert({ token, payload, user_id });
      if (error) throw error;
      return token;
    },
  });
}
