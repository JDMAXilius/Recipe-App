// ALL Supabase calls for the planner domain (feature-module.md §3). Screens
// never import supabase-js; they go through usePlan()/these functions.
import { supabase } from '@/shared/supabase/client';
import { parseIngredientLine, type IngredientPair } from '@/features/nutrition/engine/parse';
import type { PlanEntry, AddPlanInput } from './plan.types';
import type { RecipeForList, ParsedIngredient } from './shoppingList';

// --- plan_entries ---------------------------------------------------------

// The rolling week is a day-key range [from, to] (weekDays()[0].key ..[6].key).
export async function listPlan(
  userId: string,
  fromDay: string,
  toDay: string,
): Promise<PlanEntry[]> {
  const { data, error } = await supabase
    .from('plan_entries')
    .select('*')
    .eq('user_id', userId)
    .gte('day', fromDay)
    .lte('day', toDay)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addPlanEntry(userId: string, input: AddPlanInput): Promise<PlanEntry> {
  const { data, error } = await supabase
    .from('plan_entries')
    .insert({
      user_id: userId,
      day: input.day,
      recipe_id: input.recipeId,
      title: input.title,
      image: input.image ?? null,
      category: input.category ?? null,
      note: input.note ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removePlanEntry(id: number): Promise<void> {
  const { error } = await supabase.from('plan_entries').delete().eq('id', id);
  if (error) throw error;
}

export async function setPlanEntryCooked(id: number, cooked: boolean): Promise<void> {
  const { error } = await supabase.from('plan_entries').update({ cooked }).eq('id', id);
  if (error) throw error;
}

// --- shopping list source data -------------------------------------------

// Raw ingredients Json shape as stored on the recipes table (matches the
// engine's IngredientPair — {measure, name}).
type StoredPair = { measure?: string | null; name?: string | null };

function toParsed(pair: StoredPair): ParsedIngredient {
  // Grams come from the nutrition engine — never re-derived here.
  const parsed = parseIngredientLine(pair as IngredientPair);
  return {
    name: (pair.name ?? '').trim(),
    qty: parsed.qty,
    unit: parsed.unit,
    grams: parsed.grams,
    raw: (pair.measure ?? '').trim(),
  };
}

// Fetch the recipes behind a set of plan entries and parse their ingredients
// for buildShoppingList(). Only recipes that live in the `recipes` table
// resolve here; seed/TheMealDB recipes are fetched by the recipes feature and
// are out of the planner's reach (see the packet gaps).
export async function getListRecipes(recipeIds: string[]): Promise<RecipeForList[]> {
  const numericIds = recipeIds
    .map((id) => Number(id))
    .filter((n) => Number.isInteger(n));
  if (numericIds.length === 0) return [];

  const { data, error } = await supabase
    .from('recipes')
    .select('id, title, ingredients')
    .in('id', numericIds);
  if (error) throw error;

  return (data ?? []).map((row) => {
    const pairs: StoredPair[] = Array.isArray(row.ingredients)
      ? (row.ingredients as StoredPair[])
      : [];
    return { title: row.title, ingredients: pairs.map(toParsed) };
  });
}
