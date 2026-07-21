// Nutrition cache refresh (Phase 15e) — run against prod AFTER deploying the
// USDA+Claude nutrition framework (and ideally after the keys land), from
// backend/:
//   node --env-file=.env scripts/refresh-nutrition.mjs
//
// Why this exists: both nutrition caches are compute-once by design, so they
// still hold the OLD engine's output — including the corrupt chicken-skin /
// pork-backfat values, totals understated by silently-dropped ingredients,
// and "unavailable" negative-cache sentinels for recipes the old guards
// refused (those would otherwise never retry, even with the new matcher).
//
// What it does (idempotent — safe to re-run any time the engine improves):
// 1. Wipes seed_nutrition: seed recipes lazily recompute on next view with
//    the fixed engine (USDA table is local + free; the compute-once cache
//    refills itself).
// 2. Recomputes every user recipe's nutrition inline with the current engine
//    (null when honestly unknown — the app then shows the ~category estimate).
import { db } from "../src/config/db.js";
import { seedNutritionTable, recipesTable } from "../src/db/schema.js";
import { computeNutrition } from "../src/lib/nutrition/NutritionProvider.js";
import { eq } from "drizzle-orm";

const seedRows = await db.select().from(seedNutritionTable);
await db.delete(seedNutritionTable);
console.log(`seed_nutrition: cleared ${seedRows.length} cached rows (will recompute lazily on view)`);

const recipes = await db.select().from(recipesTable);
let computed = 0;
let unknown = 0;
for (const recipe of recipes) {
  const nutrition = await computeNutrition(recipe.ingredients, recipe.servings || 1);
  await db
    .update(recipesTable)
    .set({ nutrition })
    .where(eq(recipesTable.id, recipe.id));
  if (nutrition) computed += 1;
  else unknown += 1;
}
console.log(`user recipes: ${computed} recomputed, ${unknown} honestly unknown (estimate shown), of ${recipes.length}`);

process.exit(0);
