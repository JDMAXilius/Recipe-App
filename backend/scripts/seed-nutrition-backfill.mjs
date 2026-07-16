// B1.6 — one-time (resumable) nutrition backfill for the seed catalogue.
//
// Why: seedNutritionFor() is cache-first, but an EMPTY cache means the first
// user to open each recipe pays the provider bill AND the wait — ~2 calls per
// ingredient, on a rate limit that returns 429 under load. Precomputing moves
// that cost off the user entirely. After this runs, a seed recipe view is a
// single indexed SELECT and calls Edamam zero times.
//
// User-created recipes are untouched: those still compute async-on-save via
// backfillUserRecipeNutrition(), which is correct — they are new data.
//
// Resumable: already-cached recipes (including negative-cached "unavailable"
// ones) are skipped, so re-running only fills gaps. Safe to Ctrl-C.
//
// Run from backend/:  node --env-file=.env scripts/seed-nutrition-backfill.mjs [limit]
import { db } from "../src/config/db.js";
import { seedNutritionTable } from "../src/db/schema.js";
import { seedNutritionFor, nutritionActive } from "../src/lib/nutrition/lifecycle.js";

const LIMIT = Number(process.argv[2]) || Infinity;
// Gap between recipes. The provider already pools at 2 and retries 429s; this
// keeps sustained load under Edamam's burst window on top of that.
const GAP_MS = 1200;

if (!nutritionActive()) {
  console.log("nutrition provider dormant (no EDAMAM keys) — nothing to backfill.");
  process.exit(0);
}

// TheMealDB has no "list all" — the a-z name index is the complete catalogue.
console.log("enumerating seed catalogue...");
const ids = new Set();
for (const letter of "abcdefghijklmnopqrstuvwxyz") {
  const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?f=${letter}`);
  const data = await res.json().catch(() => ({}));
  for (const meal of data.meals || []) ids.add(meal.idMeal);
}
console.log(`  ${ids.size} seed recipes`);

const cached = new Set(
  (await db.select({ id: seedNutritionTable.recipeId }).from(seedNutritionTable)).map((r) => r.id)
);
const todo = [...ids].filter((id) => !cached.has(id)).slice(0, LIMIT);
console.log(`  ${cached.size} already cached, ${todo.length} to compute\n`);

let ok = 0;
let unavailable = 0;
let failed = 0;

for (const [i, id] of todo.entries()) {
  const label = `[${i + 1}/${todo.length}] ${id}`;
  try {
    const n = await seedNutritionFor(id);
    if (n) {
      ok++;
      console.log(`${label} → ${n.kcal} kcal (${n.confidence})`);
    } else {
      // seedNutritionFor negative-caches this, so it will not be retried on view
      unavailable++;
      console.log(`${label} → unavailable (negative-cached)`);
    }
  } catch (error) {
    failed++;
    console.log(`${label} → ERROR ${error.message}`);
  }
  if (i < todo.length - 1) await new Promise((r) => setTimeout(r, GAP_MS));
}

console.log(`\ndone: ${ok} computed, ${unavailable} unavailable, ${failed} errored`);
console.log("failed ones are NOT cached — re-run to retry just those.");
process.exit(0);
