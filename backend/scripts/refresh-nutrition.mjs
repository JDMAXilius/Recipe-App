// FULL nutrition recalculation under the USDA+Claude framework (Phase 15e/15g).
// Founder directive: recalculate the CURRENT DATABASE — every recipe, eagerly,
// not lazily. Run against prod AFTER deploy, with the keys already in env
// (Railway AND this shell's .env), from backend/:
//   node --env-file=.env scripts/refresh-nutrition.mjs
//
// Why: both nutrition caches are compute-once, so they hold the OLD engine's
// output — corrupt chicken-skin/pork-backfat values, totals understated by
// silently-dropped ingredients, and "unavailable" sentinels that never retry.
// Deploying code does not touch stored output; this script re-produces it all.
//
// What it does (idempotent — safe to re-run whenever the engine improves):
// 1. Enumerates the ENTIRE seed catalogue from TheMealDB (search.php?f=a..z),
//    wipes seed_nutrition, and eagerly recomputes every catalogue recipe with
//    the current engine (curated facts + negative sentinel, same one code path
//    the API uses). Falls back to the previously-cached id list if enumeration
//    fails, so a network blip can't silently shrink coverage.
// 2. Recomputes every user recipe inline (null when honestly unknown — the app
//    then shows the ~category estimate).
import { db } from "../src/config/db.js";
import { seedNutritionTable, recipesTable } from "../src/db/schema.js";
import { seedNutritionFor } from "../src/lib/nutrition/lifecycle.js";
import { computeNutrition } from "../src/lib/nutrition/NutritionProvider.js";
import { MEALDB_BASE_URL } from "../src/lib/content/RecipeSource.js";
import { eq } from "drizzle-orm";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- 1. Enumerate the full seed catalogue (full objects come back per letter,
// but we only need the ids — seedNutritionFor owns fetching + computing so the
// script and the live API can never disagree).
async function listCatalogueIds() {
  const ids = new Set();
  for (const letter of "abcdefghijklmnopqrstuvwxyz") {
    try {
      const res = await fetch(`${MEALDB_BASE_URL}/search.php?f=${letter}`, {
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error(`TheMealDB answered ${res.status}`);
      const data = await res.json();
      for (const meal of data.meals || []) if (meal?.idMeal) ids.add(String(meal.idMeal));
      await sleep(120); // be polite to the catalogue
    } catch (error) {
      console.warn(`  catalogue letter "${letter}" failed (${error.message}) — continuing`);
    }
  }
  return [...ids];
}

const previouslyCached = (await db.select().from(seedNutritionTable)).map((r) => String(r.recipeId));
console.log(`seed_nutrition: ${previouslyCached.length} rows cached under the old engine`);

let catalogueIds = await listCatalogueIds();
if (catalogueIds.length === 0) {
  console.warn("catalogue enumeration returned nothing — falling back to previously-cached ids");
  catalogueIds = previouslyCached;
} else {
  // anything cached but no longer in the catalogue (e.g. test-batch ids) still
  // deserves a recompute rather than silent disappearance
  for (const id of previouslyCached) if (!catalogueIds.includes(id)) catalogueIds.push(id);
}
console.log(`recalculating ${catalogueIds.length} seed recipes eagerly…`);

await db.delete(seedNutritionTable);

let seedComputed = 0;
let seedUnavailable = 0;
let done = 0;
for (const id of catalogueIds) {
  try {
    const nutrition = await seedNutritionFor(id); // computes + caches, one code path
    if (nutrition) seedComputed += 1;
    else seedUnavailable += 1;
  } catch (error) {
    seedUnavailable += 1;
    console.warn(`  seed ${id} failed: ${error.message}`);
  }
  done += 1;
  if (done % 25 === 0) console.log(`  …${done}/${catalogueIds.length}`);
  await sleep(80);
}
console.log(
  `seed recipes: ${seedComputed} computed, ${seedUnavailable} honestly unknown (estimate shown), of ${catalogueIds.length}`
);

// --- 2. Every user recipe (imported + created), recomputed inline.
const recipes = await db.select().from(recipesTable);
let userComputed = 0;
let userUnknown = 0;
for (const recipe of recipes) {
  const nutrition = await computeNutrition(recipe.ingredients, recipe.servings || 1);
  await db.update(recipesTable).set({ nutrition }).where(eq(recipesTable.id, recipe.id));
  if (nutrition) userComputed += 1;
  else userUnknown += 1;
}
console.log(
  `user recipes: ${userComputed} recomputed, ${userUnknown} honestly unknown (estimate shown), of ${recipes.length}`
);

process.exit(0);
