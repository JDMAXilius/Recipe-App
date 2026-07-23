// Cookbook domain types. DB row shapes come from @/types/database; these are
// the normalized, camelCase shapes the screen + cross-feature hook speak in.

export type Segment = 'all' | 'saved' | 'mine';

// A saved (favorited) seed recipe — the payload useSaved().toggle() takes and
// the shape recipes/profile pass in. recipeId is favorites.recipe_id (numeric).
export interface SavedRecipe {
  recipeId: number;
  title: string;
  image: string | null;
  category: string | null;
  cookTime: string | null;
  servings: string | null;
}

// A user's own recipe (written or imported), from the recipes table.
export interface MyRecipe {
  id: number;
  title: string;
  image: string | null;
  category: string | null;
  source: string; // 'manual' | 'imported' | seed sources
  sourceName: string | null;
}

// Unified card shape the cookbook grid renders. `save` is present only for
// saved items (drives the paw toggle); null for owned recipes (no paw).
export interface CookbookItem {
  key: string;
  recipeId: number;
  title: string;
  image: string | null;
  category: string | null;
  variant: 'saved' | 'mine' | 'imported';
  sourceName: string | null;
  cooked: boolean;
  save: SavedRecipe | null;
}
