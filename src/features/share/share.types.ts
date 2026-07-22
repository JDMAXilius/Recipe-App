// Domain types for the share feature. DB row shapes come from
// @/types/database; these are the DISPLAY shapes the card + copy render and
// the discriminated results the capability-URL reads resolve to.
import type { Json } from '@/types/database';

// The already-transformed recipe recipes' detail hands to ShareCard /
// buildRecipeShareText. Ingredient + step lines arrive pre-formatted (unit
// scaling is the recipes/nutrition job, not share's) so the picture and the
// text share always agree with what was on screen.
export interface ShareRecipe {
  title: string;
  image?: string | null;
  ingredients: string[];
  steps: string[];
  servings?: number | string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
}

// Shopping-list share shapes (mirror v1 buildShoppingList rows).
export interface ShoppingItem {
  key: string;
  name: string;
  aisle: string;
  amount?: string | null;
  sources?: string[];
}

export interface ShoppingListState {
  items?: ShoppingItem[];
  custom?: { key: string; name: string }[];
  checked?: Record<string, boolean>;
}

// The status vocabulary the DEFINER read functions return. 'ok' → row;
// 'revoked' → the 410 case (link existed, owner killed it); 'missing' → the
// 404 case (unknown/zero-rows). Consumers map these to HTTP-ish states.
export type ShareStatus = 'ok' | 'revoked' | 'missing';

export type RecipeShareResult =
  | { status: 'ok'; recipe: Json }
  | { status: 'revoked' }
  | { status: 'missing' };

export type ListShareResult =
  | { status: 'ok'; payload: Json }
  | { status: 'revoked' }
  | { status: 'missing' };
