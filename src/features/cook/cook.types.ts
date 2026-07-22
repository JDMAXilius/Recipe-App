// Cook domain types. DB row shapes come from @/types/database; this is the
// normalized shape the CookScreen speaks in.
import type { IngredientPair } from './session';

// The recipe as cook mode needs it — title, servings, ingredient pairs, and the
// raw (un-split) instruction strings splitSteps() then chunks.
export interface CookRecipe {
  id: string; // raw recipe id (recipes.id as string)
  title: string;
  servings: number | null;
  category: string | null;
  ingredientPairs: IngredientPair[];
  steps: string[];
}

// A running kitchen timer. `total` and `remaining` are seconds.
export interface CookTimer {
  id: string;
  label: string;
  total: number;
  remaining: number;
  running: boolean;
  done: boolean;
}
