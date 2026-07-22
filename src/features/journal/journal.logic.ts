// Pure journal ops (add / sort / prune). No React / RN / storage imports so the
// colocated node --test runs under type-stripping alone. The journal is a
// newest-first list of plate photos, capped so a long cook streak can't grow
// the device blob without bound.

export interface JournalEntry {
  id: string;
  recipeId: string; // the same id cook mode opens: `/recipe/${recipeId}`
  title: string;
  uri: string; // device file uri — the image bytes stay on-device
  cookedAt: number; // epoch ms (sort key)
}

// ponytail: flat cap + full re-sort on every add — O(n log n) on a list capped
// at 200 is nothing. Revisit only if the cap ever grows orders of magnitude.
export const MAX_JOURNAL = 200;

export function sortNewestFirst(entries: JournalEntry[]): JournalEntry[] {
  return [...entries].sort((a, b) => b.cookedAt - a.cookedAt);
}

export function addEntry(
  entries: JournalEntry[],
  entry: JournalEntry,
  cap = MAX_JOURNAL,
): JournalEntry[] {
  return sortNewestFirst([entry, ...entries]).slice(0, cap);
}
