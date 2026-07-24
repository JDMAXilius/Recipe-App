// The otto_recipes serving-copy seam — the Phase-4 cutover adapter (flag-OFF).
// When EXPO_PUBLIC_USE_OTTO_RECIPES is 'true', the recipe read path serves from
// Otto's own `otto_recipes` table (silver `canonical` records) instead of
// TheMealDB via the `content` edge function. This module turns a `canonical`
// record into the SAME Recipe / RecipeSummary shapes the OFF path produces, so
// nothing downstream (UI, nutrition engine) changes. The flag DEFAULTS OFF —
// absent or anything but 'true' leaves the app on the unchanged TheMealDB path.
//
// The `canonical` column is jsonb (typed Json), so it is loosely-typed at the
// read boundary — zod-parsed here once (feature-module.md rule 6), same as the
// TheMealDB envelope in mealdb.transform. Behaviour pinned by
// canonical.transform.test.mjs.
import { z } from 'zod';
// Relative import so the module loads under `npm test` (the type-strip loader
// doesn't resolve the `@/` alias for value imports) — same precedent as
// mealdb.transform → ../../types/ids.
import { toSeedId } from '../../types/ids';
import type { Recipe, RecipeSummary } from './recipe.types';

// Cutover flag — DEFAULTS OFF. Only the exact string 'true' flips it on; absent
// (the normal case) or any other value keeps the TheMealDB-via-content path.
// Flip on ONLY after the ingredient-split contract_gap is resolved (see below).
export const USE_OTTO_RECIPES = process.env.EXPO_PUBLIC_USE_OTTO_RECIPES === 'true';

// The silver record shape (OWN_RECIPE_DB.md "the silver record shape"). Only the
// fields the app reads are declared; catchall keeps forward-compat with new keys.
const CanonicalIngredient = z
  .object({
    original: z.string(),
    measure: z.string().nullish(),
    name: z.string().nullish(),
    key: z.string().nullish(),
    grams: z.number().nullish(),
    cooked: z.boolean().nullish(),
    frying_medium: z.boolean().nullish(),
    note: z.string().nullish(),
  })
  .catchall(z.unknown());

const CanonicalMedia = z
  .object({
    image: z.string().nullish(),
    youtube: z.string().nullish(),
    source: z.string().nullish(),
  })
  .nullish();

export const CanonicalRecipe = z
  .object({
    id: z.string(),
    title: z.string(),
    category: z.string().nullish(),
    area: z.string().nullish(),
    servings: z.number().nullish(),
    instructions: z.array(z.string()).nullish(),
    ingredients: z.array(CanonicalIngredient).nullish(),
    media: CanonicalMedia,
    provenance: z.object({ source: z.string().nullish() }).catchall(z.unknown()).nullish(),
  })
  .catchall(z.unknown());

export type CanonicalRecord = z.infer<typeof CanonicalRecipe>;

// otto_recipes.canonical is jsonb (Json) — untrusted at the read boundary.
export function parseCanonical(json: unknown): CanonicalRecord {
  return CanonicalRecipe.parse(json);
}

// canonical → Recipe (detail). Maps to the identical shape mealToRecipe produces
// for a TheMealDB seed, so the detail screen + nutrition engine are unchanged.
export function canonicalToRecipe(rec: CanonicalRecord): Recipe {
  return {
    id: toSeedId(rec.id),
    title: rec.title,
    image: rec.media?.image ?? null,
    category: rec.category ?? null,
    area: rec.area ?? null,
    // canonical now carries the measure/name split (recovered deterministically
    // from bronze — see tools/canonicalize-recipes.mjs --split-measure-name), so
    // the detail screen's SEPARATE measure/name columns and NutritionCard/ShareCard
    // (which read `.name` alone) render without the measure prefix. Nutrition stays
    // byte-identical: compute.ts re-joins [measure, name], and `${measure} ${name}`
    // reconstructs `original` (verified for all ingredients), so grams are unchanged.
    // `original` fallback covers any pre-split record still lacking the fields.
    ingredients: (rec.ingredients ?? []).map((i) => ({
      measure: i.measure ?? '',
      name: i.name ?? i.original,
    })),
    steps: rec.instructions ?? [],
    youtubeUrl: rec.media?.youtube ?? null,
    // Parity with mealToRecipe: yield stays null; recipeFacts.json still owns the
    // real servings (Phase 5 folds canonical.servings in). Surfacing it now would
    // change scaling / per-serving output for recipes where it differs from 4.
    servings: null,
    source: rec.provenance?.source ?? 'themealdb',
    sourceName: null,
    sourceUrl: rec.media?.source ?? null,
  };
}

// canonical → RecipeSummary (grid tile). Mirrors mealToSummary exactly: the
// category is whatever the caller filtered by (filter.php omits strCategory, so
// the OFF path carries only the filtered category, null for an area-only filter).
// Reproducing that — rather than reading rec.category — keeps the card's soft
// category kcal estimate byte-identical to the OFF path.
export function canonicalToSummary(
  rec: CanonicalRecord,
  category: string | null = null,
): RecipeSummary {
  return {
    id: toSeedId(rec.id),
    title: rec.title,
    image: rec.media?.image ?? null,
    category,
  };
}
