// ALL Supabase calls for favorites (the saved shelf). Typed via Database.
// Screens never import supabase-js — they go through useSaved(), which calls these.

import { supabase } from '@/shared/supabase/client';
import { changed } from '@/shared/supabase/rows';
import type { Database } from '@/types/database';
import type { SavedRecipe } from './cookbook.types';
import type { Runners } from '@/shared/actions/action';
import type { savedActions } from './saved.actions';

type FavoriteRow = Database['public']['Tables']['favorites']['Row'];
type FavoriteInsert = Database['public']['Tables']['favorites']['Insert'];

export function toSavedRecipe(row: FavoriteRow): SavedRecipe {
  return {
    recipeId: row.recipe_id,
    title: row.title,
    image: row.image,
    category: row.category,
    cookTime: row.cook_time,
    servings: row.servings,
  };
}

export async function fetchFavorites(userId: string): Promise<SavedRecipe[]> {
  const { data, error } = await supabase
    .from('favorites')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toSavedRecipe);
}

export async function insertFavorite(userId: string, recipe: SavedRecipe): Promise<void> {
  const row: FavoriteInsert = {
    user_id: userId,
    recipe_id: recipe.recipeId,
    title: recipe.title,
    image: recipe.image,
    category: recipe.category, // drives the Saved-tab calorie estimate downstream
    cook_time: recipe.cookTime,
    servings: recipe.servings,
  };
  // Idempotent: (user_id, recipe_id) is unique, so a re-save is a genuine no-op
  // (ignoreDuplicates) rather than a duplicate row or a thrown conflict.
  const { error } = await supabase
    .from('favorites')
    .upsert(row, { onConflict: 'user_id,recipe_id', ignoreDuplicates: true });
  if (error) throw error;
}

export async function deleteFavorite(userId: string, recipeId: number): Promise<void> {
  changed(
    await supabase.from('favorites').delete().eq('user_id', userId).eq('recipe_id', recipeId).select('recipe_id'),
    'That saved recipe',
  );
}

export async function getFavorite(userId: string, recipeId: number): Promise<SavedRecipe | null> {
  const { data, error } = await supabase
    .from('favorites')
    .select('*')
    .eq('user_id', userId)
    .eq('recipe_id', recipeId)
    .maybeSingle();
  if (error) throw error;
  return data ? toSavedRecipe(data) : null;
}

// --- actions (R0.9) --------------------------------------------------------
export const savedRun = {
  // Saving one already saved is a no-op, so there's nothing to undo.
  save: async (recipe, ctx) => {
    const was = ctx.wantUndo ? await getFavorite(ctx.userId, recipe.recipeId) : null;
    await insertFavorite(ctx.userId, recipe);
    return { result: null, undo: was ? null : { action: 'unsave_recipe', input: { recipeId: recipe.recipeId } } };
  },
  unsave: async ({ recipeId }, ctx) => {
    const before = ctx.wantUndo ? await getFavorite(ctx.userId, recipeId) : null;
    await deleteFavorite(ctx.userId, recipeId);
    return { result: null, undo: before ? { action: 'save_recipe', input: before } : null };
  },
} satisfies Runners<typeof savedActions>;
