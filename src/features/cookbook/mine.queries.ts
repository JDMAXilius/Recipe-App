// The "My recipes" segment source: the user's own rows in the recipes table.
// This is a direct read (feature → Supabase, typed via Database) — NOT a
// feature → feature call. If a recipes-feature hook for "my recipes" is later
// added to the cross-feature allowlist, swap this for it.

import { supabase } from '@/shared/supabase/client';
import type { Database } from '@/types/database';
import type { MyRecipe } from './cookbook.types';

type RecipeRow = Database['public']['Tables']['recipes']['Row'];

// The per-serving kcal persisted at save (recipes.nutrition), extracted the
// same way useSeedCalories reads seed_nutrition.kcal — a null/malformed figure
// stays null so the card shows the labelled category estimate.
function nutritionKcalOf(nutrition: RecipeRow['nutrition']): number | null {
  const kcal = (nutrition as { kcal?: unknown } | null)?.kcal;
  return typeof kcal === 'number' && Number.isFinite(kcal) ? Math.round(kcal) : null;
}

// Nutrition comes from the set ingredients only (founder rule 2026-07-24): a
// recipe with NO ingredient lines is exactly 0 kcal — never the category
// estimate. Covers rows saved before resolveNutrition learned the same rule.
function hasIngredientLines(ingredients: RecipeRow['ingredients']): boolean {
  return (
    Array.isArray(ingredients) &&
    ingredients.some((p) => {
      const pair = p as { name?: unknown; measure?: unknown } | null;
      return Boolean(
        (typeof pair?.name === 'string' && pair.name.trim()) ||
          (typeof pair?.measure === 'string' && pair.measure.trim()),
      );
    })
  );
}

export function toMyRecipe(row: RecipeRow): MyRecipe {
  return {
    id: row.id,
    title: row.title,
    image: row.image,
    category: row.category,
    source: row.source,
    sourceName: row.source_name,
    nutritionKcal: hasIngredientLines(row.ingredients) ? nutritionKcalOf(row.nutrition) : 0,
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
