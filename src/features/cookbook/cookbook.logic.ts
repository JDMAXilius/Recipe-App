// Pure cookbook logic — no React, no Supabase. Unit-tested in cookbook.logic.test.mjs.
// Segment filtering, cooked filtering, saved-set derivation, and the optimistic
// toggle reducer all live here so the same rules the screen renders are the
// rules the tests pin.

import type { CookbookItem, MyRecipe, SavedRecipe, Segment } from './cookbook.types';

export function deriveSavedIds(rows: SavedRecipe[]): Set<number> {
  return new Set(rows.map((r) => r.recipeId));
}

// Replaces v1's hand-rolled add/remove sets. Optimistic: prepend on save,
// drop on unsave. Idempotent by recipeId.
export function applyOptimisticToggle(
  rows: SavedRecipe[],
  recipe: SavedRecipe,
): SavedRecipe[] {
  const has = rows.some((r) => r.recipeId === recipe.recipeId);
  return has ? rows.filter((r) => r.recipeId !== recipe.recipeId) : [recipe, ...rows];
}

export function savedToItem(r: SavedRecipe): CookbookItem {
  return {
    key: `s-${r.recipeId}`,
    recipeId: r.recipeId,
    title: r.title,
    image: r.image,
    category: r.category,
    variant: 'saved',
    sourceName: null,
    cooked: false,
    save: r,
  };
}

export function mineToItem(r: MyRecipe): CookbookItem {
  return {
    key: `m-${r.id}`,
    recipeId: r.id,
    title: r.title,
    image: r.image,
    category: r.category,
    variant: r.source === 'imported' ? 'imported' : 'mine',
    sourceName: r.sourceName,
    cooked: false,
    save: null,
  };
}

// Saved is the verb; the tab is the shelf. All = mine + saved (v1 order).
export function selectSegment(
  segment: Segment,
  saved: CookbookItem[],
  mine: CookbookItem[],
): CookbookItem[] {
  if (segment === 'saved') return saved;
  if (segment === 'mine') return mine;
  return [...mine, ...saved];
}

export function applyCookedFilter(items: CookbookItem[], cookedOnly: boolean): CookbookItem[] {
  return cookedOnly ? items.filter((i) => i.cooked) : items;
}
