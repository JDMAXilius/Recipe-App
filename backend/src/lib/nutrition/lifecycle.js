// B1.4 — where nutrition meets the recipe lifecycle.
//
// Decision (logged in REDESIGN_NOTES): compute is ASYNC on save. The write
// returns immediately, nutrition backfills onto the row, the client picks it
// up on next fetch. Rationale: a network provider can add seconds and a save
// should never feel slow (USDA is local, but the seam stays provider-agnostic);
// a briefly-null nutrition renders as the existing honest
// estimate framing, not an error. Cache-once everywhere: compute happens on
// create/edit/recompute — NEVER on read (budget guard).
import { db } from "../../config/db.js";
import { recipesTable, seedNutritionTable } from "../../db/schema.js";
import { and, eq } from "drizzle-orm";
import { computeNutrition, activeNutritionProvider } from "./NutritionProvider.js";
import { recipeSource } from "../content/RecipeSource.js";
import { reportError, logger } from "../logger.js";

export const nutritionActive = () => Boolean(activeNutritionProvider());

// Fire-and-forget backfill for a user recipe. Safe to call when the provider
// is dormant (no-op) — callers never await this.
export function backfillUserRecipeNutrition(recipeId, userId) {
  if (!nutritionActive()) return;
  (async () => {
    const rows = await db
      .select()
      .from(recipesTable)
      .where(and(eq(recipesTable.id, recipeId), eq(recipesTable.userId, userId)));
    const recipe = rows[0];
    if (!recipe) return;
    const nutrition = await computeNutrition(recipe.ingredients, recipe.servings || 1, null, recipe.steps);
    if (!nutrition) {
      logger.info({ recipeId }, "nutrition unavailable for recipe");
      return;
    }
    // guard against the overlapping-edit race (QA P2-2): if the row changed
    // while the provider ran, these numbers describe stale ingredients —
    // drop them; the edit's own backfill is already in flight
    await db
      .update(recipesTable)
      .set({ nutrition })
      .where(
        and(
          eq(recipesTable.id, recipeId),
          eq(recipesTable.userId, userId),
          eq(recipesTable.updatedAt, recipe.updatedAt)
        )
      );
  })().catch((error) => reportError(error, { msg: "nutrition backfill failed", recipeId }));
}

// Seed (TheMealDB) nutrition: cache-first, compute-once. Returns the cached
// or freshly-computed nutrition object, or null when honestly unknown /
// provider dormant.
export async function seedNutritionFor(mealId) {
  const cached = await db
    .select()
    .from(seedNutritionTable)
    .where(eq(seedNutritionTable.recipeId, mealId));
  if (cached.length) {
    // negative-cache sentinel (QA P3-8): this recipe was tried and honestly
    // couldn't be analyzed — don't re-pay the provider on every view
    return cached[0].nutrition?.unavailable ? null : cached[0].nutrition;
  }

  if (!nutritionActive()) return null; // dormant — never cache, so keys landing later still compute

  const meal = await recipeSource.getById(mealId);
  const nutrition =
    meal && meal.ingredients?.length
      ? await computeNutrition(meal.ingredients, 4, mealId, meal.steps)
      : null;
  // TheMealDB has no servings field; category-typical default of 4 — the
  // basis_grams on the result keeps the portion honest.

  await db
    .insert(seedNutritionTable)
    .values({ recipeId: mealId, nutrition: nutrition ?? { unavailable: true } })
    .onConflictDoNothing();
  return nutrition;
}
