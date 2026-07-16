// B1.2b — Edamam Food Database adapter. The account's plan is Food DB, so
// edamamProvider.js (Recipe Nutrition Analysis) 401s: "This app is for another
// API". Same seam, same output contract — only the math source differs.
//
// Split of duties: parseIngredient.js already owns qty→grams (it does for
// scaling and shopping), so it keeps owning it here. Food DB owns food matching
// and the nutrient panel; we own the summing.
//
// Two calls per ingredient: parser resolves a foodId, /nutrients returns that
// food's panel at our gram weight. It is not batchable — this plan's /nutrients
// rejects 2+ ingredients with "Too many ingredients" — so the recipe total is
// summed here. Cost is bounded by the per-recipe cache (seed_nutrition): a
// recipe pays 2N calls once, not per view.
//
// nutrition-type is deliberately omitted: the default is cooking semantics
// (raw ingredients), which is what a recipe line means. Passing "logging"
// matches ready-to-eat foods instead — "1 cup rice" becomes cooked rice at
// 130 kcal/100g rather than raw at 360, a 2.8x error.
import { ENV } from "../../config/env.js";
import { logger } from "../logger.js";
import { parseIngredientLine } from "./parseIngredient.js";

const PARSER = "https://api.edamam.com/api/food-database/v2/parser";
const NUTRIENTS = "https://api.edamam.com/api/food-database/v2/nutrients";
const GRAM = "http://www.edamam.com/ontologies/edamam.owl#Measure_gram";

const round = (n, dp = 0) =>
  n == null || Number.isNaN(n) ? null : Math.round(n * 10 ** dp) / 10 ** dp;

const auth = () => `app_id=${ENV.EDAMAM_APP_ID}&app_key=${ENV.EDAMAM_APP_KEY}`;

// Resolve one ingredient name → foodId. null when Food DB has no match: the
// line is dropped from the sum and counted against confidence.
async function resolveFoodId(item) {
  try {
    const url = `${PARSER}?${auth()}&ingr=${encodeURIComponent(item)}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) {
      logger.warn({ status: response.status, item }, "food-db parser failed");
      return null;
    }
    const data = await response.json();
    // parsed = Edamam's own best match for the line; hints = ranked candidates.
    // Prefer parsed, fall back to the top hint, else honestly unmatched.
    return data?.parsed?.[0]?.food?.foodId ?? data?.hints?.[0]?.food?.foodId ?? null;
  } catch (error) {
    logger.warn({ err: error.message, item }, "food-db parser threw");
    return null;
  }
}

// One food at its gram weight → full nutrient panel. null on any failure.
async function fetchPanel(foodId, grams) {
  try {
    const response = await fetch(`${NUTRIENTS}?${auth()}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ingredients: [{ quantity: grams, measureURI: GRAM, foodId }],
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      logger.warn({ status: response.status, foodId }, "food-db nutrients failed");
      return null;
    }
    const data = await response.json();
    return Number.isFinite(data?.calories) ? data : null;
  } catch (error) {
    logger.warn({ err: error.message, foodId }, "food-db nutrients threw");
    return null;
  }
}

export const foodDbProvider = {
  name: "edamam-fooddb",

  async computeNutrition(ingredients, servings) {
    const lines = (ingredients || [])
      .map((p) => [p.measure, p.name].filter(Boolean).join(" ").trim())
      .filter(Boolean);
    if (!lines.length) return null;
    const perServing = Math.max(1, Number(servings) || 1);

    // ponytail: every ingredient's 2-call chain runs concurrently — ~10-20 in
    // flight for a real recipe, and cached per recipe after. Add a concurrency
    // cap if Edamam starts 429ing.
    const results = await Promise.all(
      lines.map(async (line) => {
        const p = parseIngredientLine(line);
        if (!(p.grams > 0)) return { p, panel: null };
        const foodId = await resolveFoodId(p.item);
        const panel = foodId ? await fetchPanel(foodId, p.grams) : null;
        return { p, panel };
      })
    );

    const usable = results.filter((r) => r.panel);
    if (!usable.length) return null; // matched nothing — honestly unknown

    // Sum a nutrient across matched ingredients. Stays null when NO ingredient
    // reported it: null/perServing would become 0 and fabricate a "0g" where
    // the source had no data at all (QA P2-3).
    const sum = (key) => {
      let total = null;
      for (const { panel } of usable) {
        const v = panel.totalNutrients?.[key]?.quantity;
        if (Number.isFinite(v)) total = (total ?? 0) + v;
      }
      return total;
    };
    const per = (v, dp) => (v == null ? null : round(v / perServing, dp));

    const kcalTotal = usable.reduce((a, { panel }) => a + (panel.calories || 0), 0);
    const weightTotal = usable.reduce((a, { panel }) => a + (panel.totalWeight || 0), 0);

    // Confidence carries both failure modes, but they are not equally bad:
    //  - unmatched  → the line is dropped from the sum, so the total is WRONG
    //                 (understated). Counts full weight.
    //  - guessed    → our parser estimated the grams ("2 large eggs" → 100g,
    //                 medium). The line IS in the sum, just approximate. Half.
    // Weighting them equally tipped a fully-matched 4-line recipe to "low" on
    // one fuzzy egg line, which overstated the doubt.
    const unmatched = results.length - usable.length;
    const guessed = usable.filter((r) => r.p.confidence !== "high").length;
    const doubt = (unmatched + guessed * 0.5) / results.length;
    const confidence = doubt === 0 ? "high" : doubt <= 0.2 ? "medium" : "low";

    return {
      kcal: round(kcalTotal / perServing),
      protein_g: per(sum("PROCNT"), 1),
      carbs_g: per(sum("CHOCDF"), 1),
      fat_g: per(sum("FAT"), 1),
      fiber_g: per(sum("FIBTG"), 1),
      sugar_g: per(sum("SUGAR"), 1),
      sodium_mg: per(sum("NA"), 0),
      basis_grams: round(weightTotal / perServing),
      per: "serving",
      source: "edamam-fooddb",
      confidence,
      computed_at: new Date().toISOString(),
    };
  },
};
