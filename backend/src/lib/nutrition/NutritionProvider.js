// NutritionProvider (B0.3) — the seam for nutrition math. B1 fills this with
// the Edamam adapter; a USDA FoodData Central adapter can replace it later
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

import { ENV } from "../../config/env.js";
import { foodDbProvider } from "./foodDbProvider.js";

// Both Edamam products authenticate with the same APP_ID/APP_KEY pair, so env
// cannot tell them apart — the active provider is a deliberate choice. The
// account's plan is Food DB, so that is the live path. edamamProvider.js
// (Recipe Nutrition Analysis) is kept for the day that subscription is bought:
// it needs no code change, only swapping the import here.
export function activeNutritionProvider() {
  if (ENV.EDAMAM_APP_ID && ENV.EDAMAM_APP_KEY) return foodDbProvider;
  return null; // no keys yet — pipeline stays dormant, UI keeps estimate framing
}

export async function computeNutrition(ingredients, servings) {
  const provider = activeNutritionProvider();
  if (!provider) return null;
  return provider.computeNutrition(ingredients, servings);
}
