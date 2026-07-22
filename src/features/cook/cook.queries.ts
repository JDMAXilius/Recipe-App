// ALL Supabase calls for the cook domain (feature-module.md §3). The screen
// goes through fetchCookRecipe(); it never imports supabase-js directly.
import { supabase } from '@/shared/supabase/client';
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
  const numericId = Number(id);
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
