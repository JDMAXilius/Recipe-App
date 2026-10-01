// ALL Supabase calls for the cook domain (feature-module.md §3). The screen
// goes through fetchCookRecipe(); it never imports supabase-js directly.
import { supabase } from '@/shared/supabase/client';
// Seed recipes never land in the `recipes` table (user-owned rows only), so a
// seed id is loaded through the SAME loader the detail screen uses — cook's
// steps and ingredients are the record the user just read, from whichever
// catalogue the app serves (Otto originals included).
import { fetchSeedRecipe } from '@/features/recipes/seed.loader';
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
  // A "u-<id>" ref is a user recipe (recipes table); anything else is a seed id,
  // loaded through the shared seed loader (never in `recipes`).
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

// A seed id → the recipe the detail screen showed, via the shared seed loader.
async function fetchSeedCookRecipe(id: string): Promise<CookRecipe | null> {
  if (!/^\d+$/.test(id)) return null;
  const r = await fetchSeedRecipe(id);
  if (!r) return null;
  return {
    id: String(r.id),
    title: r.title,
    servings: r.servings,
    category: r.category,
    ingredientPairs: r.ingredients,
    steps: r.steps,
  };
}
