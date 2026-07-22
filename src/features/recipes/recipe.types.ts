// Domain types for the recipes feature. DB row shapes come from
// @/types/database (feature-module.md §5); these are the normalized shapes the
// screens, card and cross-feature cards (NutritionCard, ShareCard) speak in.
import type { SeedId, UserRecipeId } from '@/types/ids';

export type RecipeId = SeedId | UserRecipeId;

// v1's { measure, name } pair, verbatim — the shape the engine parse and
// NutritionCard already take. Ingredient text is never pre-joined here so the
// scaling seam (recipe.scale.ts) can re-quantify each line live.
export interface IngredientPair {
  measure: string;
  name: string;
}

// The full recipe the detail screen renders. `source` mirrors the DB column
// vocabulary ('themealdb' | 'manual' | 'imported'); attribution never edits away.
export interface Recipe {
  id: RecipeId;
  title: string;
  image: string | null;
  category: string | null;
  area: string | null;
  ingredients: IngredientPair[];
  steps: string[];
  youtubeUrl: string | null;
  servings: number | null;
  source: string;
  sourceName: string | null;
  sourceUrl: string | null;
}

// The lean shape Discover / search / related grids render — TheMealDB's
// filter.php returns id+name+thumb only, so a summary carries nothing it can't
// honestly fill. category is stamped back on by the caller (filter.php omits it).
export interface RecipeSummary {
  id: SeedId;
  title: string;
  image: string | null;
  category: string | null;
}

// A meal category tile (categories.php → painted browse row).
export interface RecipeCategory {
  name: string;
  description: string;
  thumb: string | null;
}
