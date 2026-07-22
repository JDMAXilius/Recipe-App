// ALL Supabase calls for the planner domain (feature-module.md §3). Screens
// never import supabase-js; they go through usePlan()/these functions.
import { supabase } from '@/shared/supabase/client';
import { parseIngredientLine, type IngredientPair } from '@/features/nutrition/engine/parse';
import { parseMeals, mealToRecipe } from '@/features/recipes/mealdb.transform';
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
// for buildShoppingList(). Only USER recipes (plan_entries.recipe_id = "u-<id>")
// live in the `recipes` table and resolve here; seed/TheMealDB entries carry a
// bare numeric id and are out of the planner's reach (packet gaps).
// Review fix: the old code kept the numeric SEED ids and dropped the "u-" user
// recipes — exactly backwards, so the shopping list lost the only rows it could
// resolve. It also lacked a user_id filter (a kept seed id could collide with a
// stranger's recipes.id). Now: keep u- ids, strip the prefix, scope to userId.
// One seed (TheMealDB) recipe's ingredients, via the content passthrough — the
// same lookup the detail screen uses. Returns null on any failure so one bad
// dish never sinks the whole list.
async function getSeedRecipeForList(id: string): Promise<RecipeForList | null> {
  try {
    const { data, error } = await supabase.functions.invoke(
      `content/lookup.php?i=${encodeURIComponent(id)}`,
      { method: 'GET' },
    );
    if (error || !data) return null;
    const meal = parseMeals(data)[0];
    if (!meal) return null;
    const recipe = mealToRecipe(meal);
    return { title: recipe.title, ingredients: recipe.ingredients.map(toParsed) };
  } catch {
    return null;
  }
}

// The week is mostly SEED recipes (TheMealDB) with a few user recipes, so the
// shopping list must resolve BOTH — the old version only queried the user's
// `recipes` table and returned nothing for a normal week of seed dishes (the
// "shopping list stays empty" bug). User recipes need the signed-in user (RLS);
// seed recipes resolve for anyone via the content function.
export async function getListRecipes(
  recipeIds: string[],
  userId: string | null,
): Promise<RecipeForList[]> {
  const userRecipeIds = recipeIds
    .filter((id) => /^u-/.test(id))
    .map((id) => Number(id.slice(2)))
    .filter((n) => Number.isInteger(n));
  const seedIds = recipeIds.filter((id) => !/^u-/.test(id));

  const [userRecipes, seedRecipes] = await Promise.all([
    (async (): Promise<RecipeForList[]> => {
      if (!userId || userRecipeIds.length === 0) return [];
      const { data, error } = await supabase
        .from('recipes')
        .select('id, title, ingredients')
        .eq('user_id', userId)
        .in('id', userRecipeIds);
      if (error) throw error;
      return (data ?? []).map((row) => {
        const pairs: StoredPair[] = Array.isArray(row.ingredients)
          ? (row.ingredients as StoredPair[])
          : [];
        return { title: row.title, ingredients: pairs.map(toParsed) };
      });
    })(),
    Promise.all(seedIds.map(getSeedRecipeForList)).then(
      (rs) => rs.filter((r): r is RecipeForList => r !== null),
    ),
  ]);

  return [...userRecipes, ...seedRecipes];
}
