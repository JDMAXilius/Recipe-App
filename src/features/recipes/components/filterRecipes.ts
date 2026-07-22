// The grid filter predicate — pure, no React, so the test runner (strip-types,
// no JSX) can import it directly. FilterSheet.tsx re-exports it for callers.
//
// ponytail: RecipeSummary carries no cuisine/area — TheMealDB's filter.php
// returns id+name+thumb only (see recipe.types.ts), so `category` is the ONLY
// dimension the already-loaded grid can honestly filter on. In browse mode the
// grid is already one category, so Discover only surfaces the sheet when the
// grid spans categories (i.e. search results). Upgrade path: when a summary
// carries area, add an area predicate here and a second chip group in the sheet.
import type { RecipeSummary } from '../recipe.types';

export function filterByCategories(
  items: RecipeSummary[],
  selected: Set<string>,
): RecipeSummary[] {
  if (selected.size === 0) return items;
  return items.filter((r) => r.category != null && selected.has(r.category));
}
