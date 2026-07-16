// B1.4 — where nutrition meets the recipe lifecycle.
//
// Decision (logged in REDESIGN_NOTES): compute is ASYNC on save. The write
// returns immediately, nutrition backfills onto the row, the client picks it
// up on next fetch. Rationale: Edamam adds ~1-3s and a save should never
// feel slow; a briefly-null nutrition renders as the existing honest
// estimate framing, not an error. Cache-once everywhere: compute happens on
// create/edit/recompute — NEVER on read (budget guard).
import { db } from "../../config/db.js";
import { recipesTable } from "../../db/schema.js";
import { and, eq } from "drizzle-orm";
import { computeNutrition, activeNutritionProvider } from "./NutritionProvider.js";
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
    const nutrition = await computeNutrition(recipe.ingredients, recipe.servings || 1);
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
