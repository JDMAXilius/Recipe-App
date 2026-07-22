// Pref-aware Otto's-pick source selection — a lean, not a rule (same honesty
// the generate-recipe context uses). Pure so it's testable without the network.
//
// TheMealDB's filter.php takes ONE axis (area OR category), so we can't
// intersect cuisine × diet in a single call. The honest floor: diet is a hard
// constraint whose category pool (Vegetarian/Vegan) is meat-free by
// construction, so it WINS; otherwise a liked cuisine biases the area pool;
// otherwise pure surprise. One filter call + one lookup, no per-meal scans.
//
// ponytail: diet fully overrides cuisine when both are set (can't AND two axes
// server-side). Upgrade path if it matters: pull the area pool and lookup each
// meal's category to intersect — N extra calls, not worth the parity floor.

export type PickSource =
  | { kind: 'random' }
  | { kind: 'area'; value: string }
  | { kind: 'category'; value: string };

const DIET_CATEGORY: Record<string, string> = {
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
};

export function choosePickSource(
  prefs: { diet: string; cuisines: readonly string[] },
  rand: () => number = Math.random,
): PickSource {
  const category = DIET_CATEGORY[prefs.diet];
  if (category) return { kind: 'category', value: category };
  if (prefs.cuisines.length > 0) {
    const i = Math.min(prefs.cuisines.length - 1, Math.floor(rand() * prefs.cuisines.length));
    return { kind: 'area', value: prefs.cuisines[i] };
  }
  return { kind: 'random' };
}
