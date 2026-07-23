// Category fallback ranges ONLY (engine.md Laws §4: feature-layer estimates.ts
// keeps the category templates; it NEVER re-implements a guard). The carb
// ceiling lives inside the engine — imported and re-exported here so callers of
// the fallback get both from one place, but not a second copy.
//
// TheMealDB provides no nutrition data: these are typical per-serving values for
// each kind of dish, ALWAYS presented as estimates (see estimateCaption), never
// as measured facts. The computed per-ingredient USDA figure (engine) always
// wins when available; a category template only answers when computation
// honestly returns null. Ported from mobile/constants/nutritionEstimates.js.
import { applyCarbCeiling, type CategoryEstimate } from "./engine/guards";

export { applyCarbCeiling };
export type { CategoryEstimate };

const ESTIMATES: Record<string, CategoryEstimate> = {
  Beef: { calories: 450, protein: 35, carbs: 22, fat: 24 },
  Breakfast: { calories: 380, protein: 18, carbs: 38, fat: 17 },
  Chicken: { calories: 400, protein: 38, carbs: 20, fat: 18 },
  Dessert: { calories: 390, protein: 6, carbs: 52, fat: 17 },
  Goat: { calories: 420, protein: 36, carbs: 18, fat: 22 },
  Lamb: { calories: 460, protein: 34, carbs: 20, fat: 26 },
  Miscellaneous: { calories: 420, protein: 24, carbs: 36, fat: 18 },
  Pasta: { calories: 480, protein: 18, carbs: 62, fat: 16 },
  Pork: { calories: 440, protein: 33, carbs: 20, fat: 24 },
  Seafood: { calories: 350, protein: 32, carbs: 18, fat: 14 },
  Side: { calories: 220, protein: 6, carbs: 30, fat: 9 },
  Starter: { calories: 260, protein: 12, carbs: 24, fat: 12 },
  Vegan: { calories: 340, protein: 14, carbs: 46, fat: 12 },
  Vegetarian: { calories: 360, protein: 15, carbs: 44, fat: 14 },

  // Drinks (2026-07-21): the old fallthrough sent a black coffee to the
  // 420-kcal dinner DEFAULT. Ranges are wide by nature — the "~" estimate
  // framing is exactly what that is for.
  Drink: { calories: 120, protein: 2, carbs: 22, fat: 2 },
  Coffee: { calories: 60, protein: 2, carbs: 6, fat: 3 },
  Tea: { calories: 40, protein: 1, carbs: 8, fat: 1 },
  Smoothie: { calories: 200, protein: 5, carbs: 40, fat: 3 },
  Juice: { calories: 120, protein: 1, carbs: 28, fat: 0 },
  Cocktail: { calories: 160, protein: 0, carbs: 14, fat: 0 },
};

const DEFAULT: CategoryEstimate = { calories: 420, protein: 24, carbs: 36, fat: 18 };

// Seed categories arrive as exact TheMealDB strings; user/Otto recipes carry
// freeform ones ("drinks", "beverage", "Smoothies"). Normalize case + trailing-s
// plus a few synonyms so a drink never falls through to the dinner default.
const norm = (s: string | null | undefined): string =>
  String(s || "").trim().toLowerCase().replace(/s$/, "");

const LOOKUP: Record<string, CategoryEstimate> = {};
for (const [name, value] of Object.entries(ESTIMATES)) LOOKUP[norm(name)] = value;
LOOKUP[norm("Beverage")] = ESTIMATES.Drink;
LOOKUP[norm("Hot drink")] = ESTIMATES.Coffee;
LOOKUP[norm("Latte")] = ESTIMATES.Coffee;
LOOKUP[norm("Shake")] = ESTIMATES.Smoothie;
LOOKUP[norm("Milkshake")] = ESTIMATES.Smoothie;
LOOKUP[norm("Mocktail")] = ESTIMATES.Juice;

export function getNutritionEstimate(category: string | null | undefined): CategoryEstimate {
  return LOOKUP[norm(category)] || DEFAULT;
}

// The honesty copy, in ONE place. A category template is never shown as a fact:
// its caption always says "estimate". Kept pure (no React) so it is unit-tested
// as the proof that estimates are flagged.
export type EstimateKind = "computed" | "computed-low" | "category" | "none";

export function estimateCaption(kind: EstimateKind): string {
  switch (kind) {
    case "computed":
      return "Otto worked this out from the ingredients — an estimate.";
    case "computed-low":
      return "Otto worked this out from the ingredients, but a few lines didn't measure cleanly — treat it as a rough guide.";
    case "category":
      return "Otto's estimate, from this kind of dish.";
    case "none":
      return "No nutrition estimate for this recipe yet.";
  }
}
