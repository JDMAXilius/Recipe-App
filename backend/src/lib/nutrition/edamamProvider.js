// B1.2 — Edamam Nutrition Analysis adapter. Edamam does parse+match+sum on
// raw ingredient lines; we divide totals by servings for per-serving numbers.
// Our own parser (parseIngredient.js) still owns scaling + shopping — this
// adapter only owns the nutrition math, so a USDA-owned path can replace it.
// DORMANT until EDAMAM_APP_ID/EDAMAM_APP_KEY land in env (founder input).
import { ENV } from "../../config/env.js";
import { logger } from "../logger.js";

const API = "https://api.edamam.com/api/nutrition-details";

const round = (n, dp = 0) =>
  n == null || Number.isNaN(n) ? null : Math.round(n * 10 ** dp) / 10 ** dp;

export const edamamProvider = {
  name: "edamam",

  async computeNutrition(ingredients, servings) {
    const lines = (ingredients || [])
      .map((p) => [p.measure, p.name].filter(Boolean).join(" ").trim())
      .filter(Boolean);
    if (!lines.length) return null;
    const perServing = Math.max(1, Number(servings) || 1);

    const response = await fetch(
      `${API}?app_id=${ENV.EDAMAM_APP_ID}&app_key=${ENV.EDAMAM_APP_KEY}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ingr: lines }),
        signal: AbortSignal.timeout(15000),
      }
    );
    // 555 = "recipe could not be analyzed" — honestly unknown, not an outage
    if (response.status === 555) return null;
    if (!response.ok) {
      logger.warn({ status: response.status }, "edamam request failed");
      return null;
    }
    const data = await response.json();
    if (!data || !Number.isFinite(data.calories)) return null;

    const n = data.totalNutrients || {};
    const q = (key) => (Number.isFinite(n[key]?.quantity) ? n[key].quantity : null);
    // null must stay null through the division — null/4 === 0 in JS would
    // fabricate a "0g" where the source honestly had no data (QA P2-3)
    const per = (v, dp) => (v == null ? null : round(v / perServing, dp));

    // Edamam flags lines it couldn't parse; use that as our confidence signal.
    const unmatched = Array.isArray(data.ingredients)
      ? data.ingredients.filter((i) => !i.parsed?.length).length
      : 0;
    const share = unmatched / lines.length;
    const confidence = share === 0 ? "high" : share <= 0.2 ? "medium" : "low";

    return {
      kcal: round(data.calories / perServing),
      protein_g: per(q("PROCNT"), 1),
      carbs_g: per(q("CHOCDF"), 1),
      fat_g: per(q("FAT"), 1),
      fiber_g: per(q("FIBTG"), 1),
      sugar_g: per(q("SUGAR"), 1),
      sodium_mg: per(q("NA"), 0),
      basis_grams: round((data.totalWeight || 0) / perServing),
      per: "serving",
      source: "edamam",
      confidence,
      computed_at: new Date().toISOString(),
    };
  },
};
