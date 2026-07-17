// NutritionProvider (B0.3) — the seam for nutrition math. B1 fills this with
// the USDA FoodData Central adapter; another provider can replace it later
// without touching callers.
//
// Interface:
//   computeNutrition(ingredients, servings) → {
//     kcal, protein_g, carbs_g, fat_g,             // per serving, rounded
//     fiber_g?, sugar_g?, sodium_mg?,               // when the source has them
//     basis_grams,                                  // est. weight of one serving
//     confidence,                                   // "high" | "medium" | "low"
//     per: "serving", source, computed_at,
//   } | null                                        // null = honestly unknown
//
// ingredients: [{ measure, name }] (the app-wide shape); servings: int ≥ 1.
// Honesty law: null beats a guess. Callers render nothing (or the old
// category estimate) when this returns null — never a fabricated number.

import { usdaProvider } from "./usdaProvider.js";

// USDA is the live provider and needs no keys: usdaTable.json ships with the
// app, so nutrition works offline, for free, forever.
//
// It replaced Edamam on licensing, not price. Edamam's Food DB Enterprise Basic
// permits caching "FoodId, Food Label" only and forbids "automated programatic
// requests with the goal to collect, scrape or save data" — and Otto's design
// is a permanent per-recipe cache, so no Edamam tier under $299/mo could hold
// it legally. USDA FoodData Central is public domain (CC0): store it, ship it,
// redistribute it. The retired Edamam adapters (edamamProvider.js /
// foodDbProvider.js) live in git history should a caching-permitted tier
// ever be bought.
export function activeNutritionProvider() {
  return usdaProvider;
}

export async function computeNutrition(ingredients, servings) {
  const provider = activeNutritionProvider();
  if (!provider) return null;
  return provider.computeNutrition(ingredients, servings);
}
