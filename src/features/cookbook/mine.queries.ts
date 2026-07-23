// The "My recipes" segment source: the user's own rows in the recipes table.
// This is a direct read (feature → Supabase, typed via Database) — NOT a
// feature → feature call. If a recipes-feature hook for "my recipes" is later
// added to the cross-feature allowlist, swap this for it.

import { supabase } from '@/shared/supabase/client';
import type { Database } from '@/types/database';
import type { MyRecipe } from './cookbook.types';

type RecipeRow = Database['public']['Tables']['recipes']['Row'];

export function toMyRecipe(row: RecipeRow): MyRecipe {
  return {
    id: row.id,
    title: row.title,
    image: row.image,
    category: row.category,
    source: row.source,
    sourceName: row.source_name,
  };
}

export async function fetchMyRecipes(userId: string): Promise<MyRecipe[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toMyRecipe);
}
