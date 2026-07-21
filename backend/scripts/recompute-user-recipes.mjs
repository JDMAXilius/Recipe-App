// Recompute nutrition for USER recipes only (imported + created) — the cheap tail
// of refresh-nutrition.mjs, for when a parser/table fix shouldn't cost a full
// catalogue re-run. Idempotent. Usage:
//   node --env-file=.env scripts/recompute-user-recipes.mjs
import { db } from "../src/config/db.js";
import { recipesTable } from "../src/db/schema.js";
import { computeNutrition } from "../src/lib/nutrition/NutritionProvider.js";
import { eq } from "drizzle-orm";

const recipes = await db.select().from(recipesTable);
let computed = 0;
let unknown = 0;
for (const recipe of recipes) {
  const nutrition = await computeNutrition(recipe.ingredients, recipe.servings || 1, null, recipe.steps);
  await db.update(recipesTable).set({ nutrition }).where(eq(recipesTable.id, recipe.id));
  if (nutrition) computed += 1;
  else unknown += 1;
  console.log(
    recipe.id,
    recipe.title,
    nutrition ? `${nutrition.kcal} kcal, ${nutrition.carbs_g} g carbs, ${nutrition.confidence}` : "unknown"
  );
}
console.log(`user recipes: ${computed} recomputed, ${unknown} honestly unknown, of ${recipes.length}`);
process.exit(0);
