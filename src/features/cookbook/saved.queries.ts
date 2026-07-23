// ALL Supabase calls for favorites (the saved shelf). Typed via Database.
// Screens never import supabase-js — they go through useSaved(), which calls these.

import { supabase } from '@/shared/supabase/client';
import type { Database } from '@/types/database';
import type { SavedRecipe } from './cookbook.types';

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
  // recipe_id is unique per user under RLS; a re-save is a no-op we tolerate.
  const { error } = await supabase.from('favorites').insert(row);
  if (error) throw error;
}

export async function deleteFavorite(userId: string, recipeId: number): Promise<void> {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('recipe_id', recipeId);
  if (error) throw error;
}
