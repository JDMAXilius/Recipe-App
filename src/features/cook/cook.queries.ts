// ALL Supabase calls for the cook domain (feature-module.md §3). The screen
// goes through fetchCookRecipe(); it never imports supabase-js directly.
import { supabase } from '@/shared/supabase/client';
// Seed recipes never land in the `recipes` table (user-owned rows only), so a
// seed id is loaded through the same `content` passthrough + transform the
// detail screen uses — keeps cook's steps/ingredients identical to what the
// user just read. contract_gap: mealdb.transform is recipes-feature-private;
// a public seed loader on @/features/recipes would be the clean seam.
import { mealToRecipe, parseMeals } from '@/features/recipes/mealdb.transform';
import type { Json } from '@/types/database';
import type { IngredientPair } from './session';
import type { CookRecipe } from './cook.types';

type StoredPair = { measure?: string | null; name?: string | null };

function toPairs(ingredients: Json): IngredientPair[] {
  if (!Array.isArray(ingredients)) return [];
  return (ingredients as StoredPair[]).map((p) => ({
    measure: (p?.measure ?? '').trim(),
    name: (p?.name ?? '').trim(),
  }));
}

function toSteps(steps: Json): string[] {
  if (!Array.isArray(steps)) return [];
  return (steps as unknown[]).map((s) => String(s ?? '').trim()).filter(Boolean);
}

// Load a recipe for cook mode. Only recipes that live in the `recipes` table
// resolve (user-created + stored seeds). A TheMealDB-only seed not persisted
// there returns null — same reach limit the planner packet documents.
export async function fetchCookRecipe(id: string): Promise<CookRecipe | null> {
  // A "u-<id>" ref is a user recipe (recipes table); anything else is a seed id
  // reached through the content edge function (TheMealDB — never in `recipes`).
  if (!/^u-/.test(id)) return fetchSeedCookRecipe(id);

  const numericId = Number(id.slice(2));
  if (!Number.isInteger(numericId)) return null;

  const { data, error } = await supabase
    .from('recipes')
    .select('id, title, servings, category, ingredients, steps')
    .eq('id', numericId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    id: String(data.id),
    title: data.title,
    servings: data.servings,
    category: data.category,
    ingredientPairs: toPairs(data.ingredients),
    steps: toSteps(data.steps),
  };
}

// A seed id → the TheMealDB meal via the `content` passthrough (GET only; the
// function 405s POST — same seam recipe.queries uses). mealToRecipe already
// zod-parses the untrusted meal and does the ingredient-pair + step-label scrub,
// so cook cooks exactly the steps the detail screen showed.
async function fetchSeedCookRecipe(id: string): Promise<CookRecipe | null> {
  if (!/^\d+$/.test(id)) return null;
  const { data, error } = await supabase.functions.invoke(
    `content/lookup.php?i=${encodeURIComponent(id)}`,
    { method: 'GET' },
  );
  if (error) throw error;
  const meal = parseMeals(data)[0];
  if (!meal) return null;
  const r = mealToRecipe(meal);
  return {
    id: String(r.id),
    title: r.title,
    servings: r.servings,
    category: r.category,
    ingredientPairs: r.ingredients,
    steps: r.steps,
  };
}
