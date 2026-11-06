// ALL Supabase calls for the planner domain (feature-module.md §3). Screens
// never import supabase-js; they go through usePlan()/these functions.
import { supabase } from '@/shared/supabase/client';
import { changed } from '@/shared/supabase/rows';
import { parseIngredientLine, type IngredientPair } from '@/features/nutrition/engine/parse';
import { fetchSeedRecipe } from '@/features/recipes/seed.loader';
import type { PlanEntry, AddPlanInput, PlanDish } from './plan.types';
import type { ActionContext, Outcome, Runners } from '@/shared/actions/action';
import type { PlanKind } from './plan.list';
import type { planActions } from './plan.actions';
import { flags } from '@/shared/flags';
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
      ...listColumns(input),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// The free-list columns come from 20261106042714_plan_list (applied 2026-11-06);
// a build with the flag off never sends them.
function listColumns(input: AddPlanInput) {
  if (!flags.flowV2) return {};
  return { label: input.label ?? null, kind: input.kind ?? 'recipe', ...(input.position != null ? { position: input.position } : {}) };
}

// Swap in ONE write: the slot keeps its id, day and position and takes the new
// dish. (It used to be delete + insert, which an interrupted call could leave
// half done.) Works on today's schema; the label is kept as the user set it.
const ITEM = 'That plan item';

export async function replacePlanEntry(id: number, input: PlanDish): Promise<void> {
  const { data, error } = await supabase
    .from('plan_entries')
    .update({
      recipe_id: input.recipeId,
      title: input.title,
      image: input.image ?? null,
      category: input.category ?? null,
      note: input.note ?? null,
      cooked: input.cooked ?? false,
      ...(flags.flowV2 ? { kind: input.kind ?? 'recipe' } : {}),
    })
    .eq('id', id)
    .select('id');
  changed({ data, error }, ITEM);
}

export async function setPlanEntryLabel(id: number, label: string | null): Promise<void> {
  changed(await supabase.from('plan_entries').update({ label }).eq('id', id).select('id'), ITEM);
}

export async function movePlanEntry(id: number, day: string, position: number): Promise<void> {
  changed(await supabase.from('plan_entries').update({ day, position }).eq('id', id).select('id'), ITEM);
}

export async function removePlanEntry(id: number): Promise<void> {
  changed(await supabase.from('plan_entries').delete().eq('id', id).select('id'), ITEM);
}

export async function getPlanEntry(id: number): Promise<PlanEntry | null> {
  const { data, error } = await supabase.from('plan_entries').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function setPlanEntryCooked(id: number, cooked: boolean): Promise<void> {
  changed(await supabase.from('plan_entries').update({ cooked }).eq('id', id).select('id'), ITEM);
}

// --- actions (R0.9) --------------------------------------------------------
// The runners behind planActions. Undo is worked out only when the caller asks
// (ctx.wantUndo): the screen keeps its own optimistic cache and skips the read.

const dishOf = (e: PlanEntry) =>
  e.recipe_id
    ? { recipeId: e.recipe_id, title: e.title, image: e.image, category: e.category, note: e.note, kind: e.kind as PlanKind, cooked: e.cooked }
    : null;

// Undo reads only the caller's own row: a partner's row is readable (shared
// household) but the write below would have refused it anyway.
const ownRow = async (id: number, ctx: ActionContext) => {
  if (!ctx.wantUndo) return null;
  const row = await getPlanEntry(id);
  return row && row.user_id === ctx.userId ? row : null;
};

export const planRun = {
  add: async (input, ctx): Promise<Outcome<PlanEntry>> => {
    const row = await addPlanEntry(ctx.userId, input);
    return { result: row, undo: { action: 'remove_from_plan', input: { id: row.id } } };
  },
  // The undo re-adds the item: a new id, not cooked (put_in_plan never is).
  remove: async ({ id }, ctx) => {
    const before = await ownRow(id, ctx);
    await removePlanEntry(id);
    const dish = before && dishOf(before);
    const undo = before && dish
      ? { action: 'put_in_plan', input: { day: before.day, recipeId: dish.recipeId, title: dish.title, image: dish.image, category: dish.category, note: dish.note, label: before.label, kind: dish.kind, ...(before.position != null ? { position: before.position } : {}) } }
      : null;
    return { result: null, undo };
  },
  swap: async ({ id, ...input }, ctx) => {
    const before = await ownRow(id, ctx);
    await replacePlanEntry(id, input);
    const dish = before && dishOf(before);
    return { result: null, undo: dish ? { action: 'swap_in_plan', input: { id, ...dish } } : null };
  },
  // Undo only when something changed: re-marking a cooked item cooked has
  // nothing to undo.
  setCooked: async ({ id, cooked }, ctx) => {
    const before = await ownRow(id, ctx);
    await setPlanEntryCooked(id, cooked);
    return { result: null, undo: before && before.cooked !== cooked ? { action: 'mark_cooked', input: { id, cooked: before.cooked } } : null };
  },
  setLabel: async ({ id, label }, ctx) => {
    const before = await ownRow(id, ctx);
    await setPlanEntryLabel(id, label);
    return { result: null, undo: before && before.label !== label ? { action: 'label_plan_item', input: { id, label: before.label } } : null };
  },
  move: async ({ id, day, position }, ctx) => {
    const before = await ownRow(id, ctx);
    await movePlanEntry(id, day, position);
    const undo = before?.position != null ? { action: 'move_plan_item', input: { id, day: before.day, position: before.position } } : null;
    return { result: null, undo };
  },
} satisfies Runners<typeof planActions>;

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
// One seed recipe's ingredients, via the shared seed loader — the
// same lookup the detail screen uses. Returns null on any failure so one bad
// dish never sinks the whole list.
async function getSeedRecipeForList(id: string): Promise<RecipeForList | null> {
  try {
    // Same loader as the detail screen, so the list shops the recipe the cook
    // read — Otto originals included (they were silently dropped before).
    const recipe = await fetchSeedRecipe(id);
    if (!recipe) return null;
    return { id, title: recipe.title, ingredients: recipe.ingredients.map(toParsed) };
  } catch {
    return null;
  }
}

// The week is mostly SEED recipes (TheMealDB) with a few user recipes, so the
// shopping list must resolve BOTH — the old version only queried the user's
// `recipes` table and returned nothing for a normal week of seed dishes (the
// "shopping list stays empty" bug). User recipes need the signed-in user (RLS);
// seed recipes resolve for anyone via the shared seed loader.
export async function getListRecipes(recipeIds: string[]): Promise<RecipeForList[]> {
  const userRecipeIds = recipeIds
    .filter((id) => /^u-/.test(id))
    .map((id) => Number(id.slice(2)))
    .filter((n) => Number.isInteger(n));
  const seedIds = recipeIds.filter((id) => !/^u-/.test(id));

  const [userRecipes, seedRecipes] = await Promise.all([
    (async (): Promise<RecipeForList[]> => {
      if (userRecipeIds.length === 0) return [];
      // Fetch by id only — RLS decides access (own recipes, plus a co-member's
      // when in a shared household). Filtering by the caller's user_id would
      // drop another member's user recipe from the shared list (review finding).
      const { data, error } = await supabase
        .from('recipes')
        .select('id, title, ingredients')
        .in('id', userRecipeIds);
      if (error) throw error;
      return (data ?? []).map((row) => {
        const pairs: StoredPair[] = Array.isArray(row.ingredients)
          ? (row.ingredients as StoredPair[])
          : [];
        // id restores the plan-entry form ("u-<n>") — the identity removals key on.
        return { id: `u-${row.id}`, title: row.title, ingredients: pairs.map(toParsed) };
      });
    })(),
    Promise.all(seedIds.map(getSeedRecipeForList)).then(
      (rs) => rs.filter((r): r is RecipeForList => r !== null),
    ),
  ]);

  return [...userRecipes, ...seedRecipes];
}
