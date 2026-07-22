// Pure resolvers for the planner's pick / swap / leftovers gestures. The only
// load-bearing correctness here is the recipe_id encoding — seed/saved recipes
// carry a bare numeric id ("52772"), the user's own recipes carry a "u-<id>"
// prefix — because the shopping-list resolver (getListRecipes) keys off exactly
// that prefix. Get this wrong and a planned dish silently drops from the list.
import type { SavedRecipe } from '@/features/cookbook';
import type { WeekDay } from './week';
import type { PlanEntry, AddPlanInput } from './plan.types';

// A recipe the user chose in the picker, normalized across both cookbook
// sources into the shape usePlan().add wants (minus the day).
export interface PickItem {
  recipeId: string; // already prefix-encoded (seed: "52772", user: "u-12")
  title: string;
  image: string | null;
  category: string | null;
}

export function savedToPick(s: SavedRecipe): PickItem {
  return { recipeId: String(s.recipeId), title: s.title, image: s.image, category: s.category };
}

// Structural param (a cookbook MyRecipe satisfies it) — MyRecipe isn't on the
// cookbook public surface, and the picker only needs these four fields.
export function mineToPick(m: {
  id: number;
  title: string;
  image: string | null;
  category: string | null;
}): PickItem {
  return { recipeId: `u-${m.id}`, title: m.title, image: m.image, category: m.category };
}

// A pick dropped onto a day → the add payload. note stays null: a fresh pick
// (or a swap's replacement) is a first-class meal, not leftovers.
export function pickToAddInput(pick: PickItem, day: string): AddPlanInput {
  return {
    day,
    recipeId: pick.recipeId,
    title: pick.title,
    image: pick.image,
    category: pick.category,
    note: null,
  };
}

// "Cook once, eat twice": carry an existing entry to another day, tagged as
// leftovers via the note column (no schema flag — PlanScreen renders
// note === 'leftovers'). Returns null if the entry has no recipe to carry.
export function leftoversCarry(entry: PlanEntry, day: string): AddPlanInput | null {
  if (!entry.recipe_id) return null;
  return {
    day,
    recipeId: entry.recipe_id,
    title: entry.title,
    image: entry.image,
    category: entry.category,
    note: 'leftovers',
  };
}

// The day after `dayKey` within the fetched week, or null if it's the last day
// (leftovers can't spill past the 7-day window the query loads).
export function nextInWeek(dayKey: string, days: WeekDay[]): string | null {
  const i = days.findIndex((d) => d.key === dayKey);
  return i >= 0 && i < days.length - 1 ? days[i + 1].key : null;
}
