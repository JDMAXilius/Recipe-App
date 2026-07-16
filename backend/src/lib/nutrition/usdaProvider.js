// B1.7 — USDA nutrition provider. Same seam, same contract as the (now
// retired) Edamam adapters; only the source of the numbers differs.
//
// Why USDA won: FoodData Central is public domain (CC0 1.0), so its values can
// be stored, shipped and redistributed. Edamam could not be: Food DB Enterprise
// Basic permits caching "FoodId, Food Label" ONLY, and all plans forbid
// "automated programatic requests with the goal to collect, scrape or save
// data". Otto's whole design is a permanent per-recipe cache, so that plan was
// unusable at any price. USDA also happens to be free.
//
// Shape: usdaTable.json resolves TheMealDB's 961 ingredient names to real USDA
// food records (built once by scripts/build-usda-table.mjs, each row carrying
// its fdcId). parseIngredient.js owns qty→grams, as it already does for scaling
// and shopping. Nutrition is then grams x per-100g values — plain arithmetic.
//
// The consequence worth stating: ZERO network calls at runtime. A recipe view
// costs nothing, cannot be rate limited, and cannot break because a vendor is
// down or a subscription lapsed. It works for user-created recipes too, as long
// as their ingredient names resolve.
//
// Attribution: USDA asks that FoodData Central be credited as the data source.
// Otto surfaces this alongside its TheMealDB credit.
import { parseIngredientLine } from "./parseIngredient.js";
import table from "./usdaTable.json" with { type: "json" };

const round = (n, dp = 0) =>
  n == null || Number.isNaN(n) ? null : Math.round(n * 10 ** dp) / 10 ** dp;

const key = (s) => String(s || "").trim().toLowerCase();

// Seed recipes arrive as { measure, name } where `name` IS the TheMealDB
// ingredient name the table is keyed on — so it matches directly. User-written
// recipes are freeform, so fall back to the parser's extracted item
// ("2 tbsp olive oil" → "olive oil") before giving up.
function lookup(name, parsedItem) {
  return table[key(name)] || table[key(parsedItem)] || null;
}

export const usdaProvider = {
  name: "usda",

  // async to satisfy the NutritionProvider contract; no I/O actually happens.
  async computeNutrition(ingredients, servings) {
    const list = (ingredients || []).filter((p) => p && (p.name || p.measure));
    if (!list.length) return null;
    const perServing = Math.max(1, Number(servings) || 1);

    const rows = list.map((p) => {
      const line = [p.measure, p.name].filter(Boolean).join(" ").trim();
      const parsed = parseIngredientLine(line);
      const food = lookup(p.name, parsed.item);
      return { parsed, food };
    });

    const usable = rows.filter((r) => r.food && r.parsed.grams > 0);
    if (!usable.length) return null; // nothing resolved — honestly unknown

    // Sum one nutrient across matched ingredients, scaling per-100g by grams.
    // Stays null when NO ingredient reported it: null/servings would become 0
    // and fabricate a "0mg" out of missing data (QA P2-3).
    const sum = (field) => {
      let total = null;
      for (const { parsed, food } of usable) {
        const v = food[field];
        if (Number.isFinite(v)) total = (total ?? 0) + (v * parsed.grams) / 100;
      }
      return total;
    };
    const per = (v, dp) => (v == null ? null : round(v / perServing, dp));

    const gramsTotal = usable.reduce((a, r) => a + r.parsed.grams, 0);

    // Confidence weights the two failure modes differently:
    //  - unmatched → the line is dropped from the sum, so the total is WRONG
    //    (understated). Counts full.
    //  - guessed   → our parser estimated the grams ("2 large eggs" → 100g,
    //    medium). The line IS in the sum, just approximate. Counts half.
    const unmatched = rows.length - usable.length;
    const guessed = usable.filter((r) => r.parsed.confidence !== "high").length;
    const doubt = (unmatched + guessed * 0.5) / rows.length;
    const confidence = doubt === 0 ? "high" : doubt <= 0.2 ? "medium" : "low";

    return {
      kcal: per(sum("kcal"), 0),
      protein_g: per(sum("protein_g"), 1),
      carbs_g: per(sum("carbs_g"), 1),
      fat_g: per(sum("fat_g"), 1),
      fiber_g: per(sum("fiber_g"), 1),
      sugar_g: per(sum("sugar_g"), 1),
      sodium_mg: per(sum("sodium_mg"), 0),
      basis_grams: round(gramsTotal / perServing),
      per: "serving",
      source: "usda",
      confidence,
      computed_at: new Date().toISOString(),
    };
  },
};
