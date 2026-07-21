// Per-serving nutrition ESTIMATES by category.
// TheMealDB provides no nutrition data (docs/DESIGN_SYSTEM.md B8 / P2-7):
// these are typical values for each kind of dish, always presented with the
// "~" estimate framing, never as measured facts. One estimator feeds both
// the recipe cards and the detail NutritionCard so numbers never disagree.
//
// Estimates are the FALLBACK — the computed per-ingredient figure (USDA)
// always wins when available. These only answer when computation honestly
// can't.

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

  // Drinks (added 2026-07-21; the old fallthrough sent a black coffee to the
  // 420-kcal DEFAULT). Figures grounded in USDA/WebMD beverage references:
  // black coffee ~2 kcal, latte 70–120, juice ~120/cup, smoothie 150–250,
  // beer ~155, wine ~125/glass. Drink ranges are wide by nature — which is
  // exactly what the "~" estimate framing is for.
  Drink: { calories: 120, protein: 2, carbs: 22, fat: 2 },
  Coffee: { calories: 60, protein: 2, carbs: 6, fat: 3 },
  Tea: { calories: 40, protein: 1, carbs: 8, fat: 1 },
  Smoothie: { calories: 200, protein: 5, carbs: 40, fat: 3 },
  Juice: { calories: 120, protein: 1, carbs: 28, fat: 0 },
  Cocktail: { calories: 160, protein: 0, carbs: 14, fat: 0 },
};

const DEFAULT = { calories: 420, protein: 24, carbs: 36, fat: 18 };

// Seed categories arrive as exact TheMealDB strings, but user-written and
// Otto-generated recipes carry freeform ones ("drinks", "beverage",
// "Smoothies"). Normalize case + trailing-s, plus a few synonyms, so a drink
// never falls through to the 420-kcal dinner default.
const norm = (s) => String(s || "").trim().toLowerCase().replace(/s$/, "");

const LOOKUP = {};
for (const [name, value] of Object.entries(ESTIMATES)) LOOKUP[norm(name)] = value;
LOOKUP[norm("Beverage")] = ESTIMATES.Drink;
LOOKUP[norm("Hot drink")] = ESTIMATES.Coffee;
LOOKUP[norm("Latte")] = ESTIMATES.Coffee;
LOOKUP[norm("Shake")] = ESTIMATES.Smoothie;
LOOKUP[norm("Milkshake")] = ESTIMATES.Smoothie;
LOOKUP[norm("Mocktail")] = ESTIMATES.Juice;

export const getNutritionEstimate = (category) => LOOKUP[norm(category)] || DEFAULT;

// CARB CEILING (TestFlight QA 2026-07-21). The category template is a
// typical-dish guess — and "typical chicken dish" carries 20 g of carbs from
// the rice/tortilla/sauce most chicken dinners have. Garlic butter chicken
// has none of those, yet the card showed those 20 g as if they were read off
// the ingredients: a fabricated macro on an honest-looking number, the exact
// class the honesty law forbids. When the ingredient list is known and
// nothing in it can supply real carbs, cap the template's carbs at a trace.
// Deliberately one-way (only ever lowers, never raises) and deliberately
// conservative: one carb-bearing name anywhere keeps the template untouched.
const CARB_SOURCES =
  /\b(flour|bread(?:crumbs)?|naan|pita|tortillas?|wraps?|buns?|rolls?|toast|baguette|ciabatta|brioche|pasta|spaghetti|noodles?|macaroni|penne|couscous|rice|quinoa|barley|bulgur|farro|oats?|oatmeal|granola|cereal|corn|polenta|grits|potato(?:es)?|yams?|plantains?|cassava|yuca|beans?|chickpeas?|lentils?|peas|sugar|honey|syrup|molasses|treacle|jam|jelly|marmalade|chocolate|cocoa|biscuits?|cookies?|crackers?|cakes?|pastry|dough|batter|milk|yogurt|yoghurt|fruit|apples?|bananas?|mango(?:es)?|berr(?:y|ies)|raisins?|sultanas?|dates?|apricots?|oranges?|pineapple|grapes?|pears?|peach(?:es)?|beets?|beetroot|carrots?|parsnips?|squash|pumpkin|sweetcorn|ketchup|hoisin|teriyaki|bbq sauce|barbecue sauce|juice|beer|wine|cider|soda|cola)\b/i;

// Names whose carb word is a red herring at recipe amounts — a squeeze of
// citrus juice or a splash of vinegar is a trace, not a carb source.
const CARB_TRACE_ONLY = /\b(?:lemon|lime) juice\b|\bvinegar\b|\bzest\b/i;

const TRACE_CARBS_G = 3;

export function applyCarbCeiling(estimate, ingredientNames) {
  const names = (ingredientNames || []).map((n) => String(n || "")).filter(Boolean);
  if (!names.length) return estimate; // no list to judge by — leave it alone
  const carbBearing = names.some(
    (n) => !CARB_TRACE_ONLY.test(n) && CARB_SOURCES.test(n)
  );
  if (carbBearing || estimate.carbs <= TRACE_CARBS_G) return estimate;
  return { ...estimate, carbs: TRACE_CARBS_G };
}
