// The ONE place a seed id becomes a Recipe — recipe detail, cook mode and the
// shopping list all read through here, so the steps you cook and the list you
// shop are the recipe you just read. Closes the contract_gap cook.queries and
// plan.queries carried ("a public seed loader on @/features/recipes would be the
// clean seam").
//
// Why it mattered (found 2026-10-01): with EXPO_PUBLIC_USE_OTTO_RECIPES on in
// production, detail read Otto's own `otto_recipes` table while cook and the
// list still looked the id up in TheMealDB. Otto originals (900001+) don't exist
// there, so "Start cooking" on them failed and the list silently dropped them;
// for the rest, cook showed TheMealDB's raw text, not the curated record.
//
// A LEAF on purpose: only the transforms and the Supabase client. Planner and
// cook import this file directly, because the recipes index re-exports screens
// that import planner (a cycle), and recipe.queries pulls in profile.
import { supabase } from '@/shared/supabase/client';
import { USE_OTTO_RECIPES, canonicalToRecipe, parseCanonical } from './canonical.transform';
import { mealToRecipe, parseMeals } from './mealdb.transform';
import type { Recipe } from './recipe.types';

// One call into the content passthrough (TheMealDB via our server, supporter
// key server-side). supabase.functions.invoke attaches the anon apikey/JWT the
// function's verify_jwt needs, so this works before signup. GET only — the
// function 405s POST.
export async function content(endpoint: string, params: Record<string, string> = {}): Promise<unknown> {
  const qs = new URLSearchParams(params).toString();
  const name = `content/${endpoint}${qs ? `?${qs}` : ''}`;
  const { data, error } = await supabase.functions.invoke(name, { method: 'GET' });
  if (error) throw error;
  return data;
}

export async function ottoRecipeById(id: string): Promise<Recipe | null> {
  const { data, error } = await supabase
    .from('otto_recipes')
    .select('canonical')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? canonicalToRecipe(parseCanonical(data.canonical)) : null;
}

/** A seed recipe by id, from whichever catalogue the app serves. Throws on a
 *  network/database error; null when the id simply isn't there. */
export async function fetchSeedRecipe(id: string): Promise<Recipe | null> {
  if (USE_OTTO_RECIPES) return ottoRecipeById(id);
  const meals = parseMeals(await content('lookup.php', { i: id }));
  return meals[0] ? mealToRecipe(meals[0]) : null;
}
