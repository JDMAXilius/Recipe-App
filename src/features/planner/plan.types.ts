import type { Tables } from '@/types/database';

// plan_entries row, straight from the generated DB types (feature-module.md §5:
// DB shapes come from @/types/database, never redeclared here).
export type PlanEntry = Tables<'plan_entries'>;

// What a caller (recipes' add-to-week) hands usePlan().add. recipeId is a
// string — plan_entries.recipe_id is nullable text holding either a SeedId
// ("52772") or a UserRecipeId ("u-12").
export interface AddPlanInput {
  day: string; // YYYY-MM-DD (a weekDays().key)
  recipeId: string;
  title: string;
  image?: string | null;
  category?: string | null;
  note?: string | null;
}
