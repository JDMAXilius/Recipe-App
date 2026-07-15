// Per-serving nutrition ESTIMATES by TheMealDB category.
// TheMealDB provides no nutrition data (docs/DESIGN_SYSTEM.md B8 / P2-7):
// these are typical values for each kind of dish, always presented with the
// "~" estimate framing, never as measured facts. One estimator feeds both
// the recipe cards and the detail NutritionCard so numbers never disagree.

const ESTIMATES = {
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
};

const DEFAULT = { calories: 420, protein: 24, carbs: 36, fat: 18 };

export const getNutritionEstimate = (category) => ESTIMATES[category] || DEFAULT;
