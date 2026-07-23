// Food-preference catalog + pure validators owned by profile. No React, no
// storage here — the persisted store lives in usePrefs.ts; this file stays a
// pure, test-safe core (imports would drag AsyncStorage into node --test).

// Food preferences (ported from v1 lib/prefs). Only diets TheMealDB can
// honestly tag are offered — a toggle the data can't honor would be a lie.
export const DIETS = [
  { key: 'none', label: 'None — I eat everything' },
  { key: 'vegetarian', label: 'Vegetarian' },
  { key: 'vegan', label: 'Vegan' },
] as const;

// TheMealDB's area vocabulary — the cuisine chip set.
export const CUISINES = [
  'American', 'British', 'Chinese', 'French', 'Greek', 'Indian', 'Italian',
  'Jamaican', 'Japanese', 'Mexican', 'Moroccan', 'Polish', 'Portuguese',
  'Spanish', 'Thai', 'Turkish', 'Vietnamese',
] as const;

export type DietKey = (typeof DIETS)[number]['key'];

export interface Prefs {
  diet: string; // a DietKey; kept loose so the screen speaks plain strings
  cuisines: string[]; // a subset of CUISINES
}

export const DEFAULT_PREFS: Prefs = { diet: 'none', cuisines: [] };

const DIET_KEYS = new Set<string>(DIETS.map((d) => d.key));
const CUISINE_SET = new Set<string>(CUISINES);

export function normalizeDiet(diet: unknown): string {
  return typeof diet === 'string' && DIET_KEYS.has(diet) ? diet : 'none';
}

export function pruneCuisines(cuisines: unknown): string[] {
  if (!Array.isArray(cuisines)) return [];
  // Keep only known areas, de-duped, order preserved.
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of cuisines) {
    if (typeof c === 'string' && CUISINE_SET.has(c) && !seen.has(c)) {
      seen.add(c);
      out.push(c);
    }
  }
  return out;
}

// validate-before-trust: a corrupt/legacy blob from kv is pruned to a known
// shape, never trusted raw. This is the "zod-validate on read" seam, done in
// plain JS so it stays testable without pulling React/AsyncStorage.
export function normalizePrefs(raw: unknown): Prefs {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return { diet: normalizeDiet(o.diet), cuisines: pruneCuisines(o.cuisines) };
}
