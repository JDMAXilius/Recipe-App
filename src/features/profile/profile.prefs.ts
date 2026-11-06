// Food-preference catalog + pure validators owned by profile. No React, no
// storage here — the persisted store lives in usePrefs.ts; this file stays a
// pure, test-safe core (imports would drag AsyncStorage into node --test).
import { ALLERGENS, type Allergen } from '../../shared/allergens';

// Food preferences (ported from v1 lib/prefs). Only diets TheMealDB can
// honestly tag are offered — a toggle the data can't honor would be a lie.
export const DIETS = [
  { key: 'none', label: 'None, I eat everything' },
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

// The three first-run questions (R0.5, R1.3): who's eating, how they eat
// (diet + allergies), anything to skip. Cuisines stay as a taste nudge.
export interface Household {
  adults: number; // 1–8
  kids: number; // 0–8
}

export interface Prefs {
  household: Household;
  diet: string; // a DietKey; kept loose so the screen speaks plain strings
  allergies: Allergen[]; // hard filter (always with LEAVE_OUT_NOTE)
  skips: string[]; // foods to leave out, the person's own words ("mushrooms")
  cuisines: string[]; // a subset of CUISINES
}

export const DEFAULT_PREFS: Prefs = { household: { adults: 2, kids: 0 }, diet: 'none', allergies: [], skips: [], cuisines: [] };
const ALLERGEN_KEYS = new Set<string>(ALLERGENS.map((a) => a.key));
const MAX_SKIPS = 12;

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
// shape, never trusted raw. Old rows ({diet, cuisines} only) gain the
// defaults for the new fields. Plain JS so it stays testable.
export function normalizePrefs(raw: unknown): Prefs {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    household: normalizeHousehold(o.household),
    diet: normalizeDiet(o.diet),
    allergies: normalizeAllergies(o.allergies),
    skips: normalizeSkips(o.skips),
    cuisines: pruneCuisines(o.cuisines),
  };
}

const count = (v: unknown, min: number, max: number, fallback: number) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.max(min, Math.min(max, Math.round(v))) : fallback;

export function normalizeHousehold(raw: unknown): Household {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return { adults: count(o.adults, 1, 8, DEFAULT_PREFS.household.adults), kids: count(o.kids, 0, 8, 0) };
}

export function normalizeAllergies(raw: unknown): Allergen[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((a): a is Allergen => typeof a === 'string' && ALLERGEN_KEYS.has(a)))];
}

export function normalizeSkips(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const v of raw) {
    const t = typeof v === 'string' ? v.trim().toLowerCase().slice(0, 40) : '';
    if (t && !out.includes(t)) out.push(t);
  }
  return out.slice(0, MAX_SKIPS);
}

/** How many a recipe should feed: a kid counts as half. */
export function servingsFor(h: Household): number {
  return Math.max(1, Math.ceil(h.adults + h.kids / 2));
}
