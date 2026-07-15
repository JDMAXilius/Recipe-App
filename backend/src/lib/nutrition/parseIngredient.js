// B1.1 — ingredient line → structure. "2 1/2 cups plain flour" →
// { qty: 2.5, unit: "cup", item: "plain flour", grams: ~312, confidence }.
// Deterministic, no LLM. Grams are ESTIMATES (density fallbacks) and every
// unresolved qty/unit/density is flagged via confidence — honesty first.

export const UNIT_WORDS =
  "cups?|cup|tablespoons?|tbsps?|tbsp|teaspoons?|tsps?|tsp|grams?|g|kgs?|kg|milliliters?|mls?|ml|liters?|litres?|l|ounces?|oz|pounds?|lbs?|lb|cloves?|cans?|tins?|slices?|sticks?|pinch(?:es)?|dash(?:es)?|handfuls?|pieces?|sprigs?|bunch(?:es)?|packets?|packages?|jars?|heads?|stalks?|fillets?|knobs?|drops?";

// canonical unit ids
const UNIT_ALIASES = [
  [/^cups?$/i, "cup"],
  [/^(tablespoons?|tbsps?)$/i, "tbsp"],
  [/^(teaspoons?|tsps?)$/i, "tsp"],
  [/^(grams?|g)$/i, "g"],
  [/^(kgs?|kilograms?)$/i, "kg"],
  [/^(milliliters?|mls?)$/i, "ml"],
  [/^(liters?|litres?|l)$/i, "l"],
  [/^(ounces?|oz)$/i, "oz"],
  [/^(pounds?|lbs?)$/i, "lb"],
  [/^cloves?$/i, "clove"],
  [/^(cans?|tins?)$/i, "can"],
  [/^slices?$/i, "slice"],
  [/^sticks?$/i, "stick"],
  [/^pinch(es)?$/i, "pinch"],
  [/^dash(es)?$/i, "dash"],
  [/^handfuls?$/i, "handful"],
  [/^pieces?$/i, "piece"],
  [/^sprigs?$/i, "sprig"],
  [/^bunch(es)?$/i, "bunch"],
  [/^(packets?|packages?)$/i, "packet"],
  [/^jars?$/i, "jar"],
  [/^heads?$/i, "head"],
  [/^stalks?$/i, "stalk"],
  [/^fillets?$/i, "fillet"],
  [/^knobs?$/i, "knob"],
  [/^drops?$/i, "drop"],
];

const UNICODE_FRACTIONS = {
  "¼": 0.25, "½": 0.5, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3,
  "⅛": 0.125, "⅜": 0.375, "⅝": 0.625, "⅞": 0.875,
};

// mass → grams, exact
const MASS_G = { g: 1, kg: 1000, oz: 28.35, lb: 453.6 };
// volume → milliliters, exact (US customary)
const VOLUME_ML = { cup: 240, tbsp: 15, tsp: 5, ml: 1, l: 1000 };
// small/approximate units → grams, rough by nature
const APPROX_G = { pinch: 0.4, dash: 0.6, drop: 0.05, knob: 15, handful: 30 };

// per-item density (g/ml) for volume→grams. Water-like default when unknown.
const DENSITY = [
  [/flour|cornstarch|corn starch|cocoa/i, 0.53],
  [/sugar, powdered|powdered sugar|icing sugar|confectioner/i, 0.56],
  [/brown sugar/i, 0.85],
  [/sugar/i, 0.85],
  [/butter|shortening|lard/i, 0.91],
  [/oil/i, 0.92],
  [/honey|syrup|molasses|condensed/i, 1.4],
  [/rice(?!\s*vinegar)/i, 0.85],
  [/oats|oatmeal/i, 0.4],
  [/parmesan|grated cheese/i, 0.42],
  [/cheese/i, 0.47],
  [/breadcrumbs|panko/i, 0.25],
  [/nuts?|almond|walnut|pecan|peanut|cashew/i, 0.55],
  [/spinach|greens|herbs|parsley|cilantro|basil|arugula|lettuce/i, 0.12],
  [/onion|carrot|celery|pepper|tomato|mushroom|zucchini|broccoli/i, 0.6],
  [/yogurt|sour cream|cream cheese|mayo/i, 1.03],
  [/milk|cream|broth|stock|water|juice|wine|vinegar|sauce/i, 1.0],
  [/salt/i, 1.2],
  [/baking (soda|powder)|yeast|spice|cinnamon|paprika|cumin|pepper$/i, 0.55],
];
const DEFAULT_DENSITY = 1.0;

// count-unit piece weights (grams per item). Rough — flagged lower confidence.
const PIECE_G = [
  [/^clove$/, /garlic/i, 5],
  [/^can$/, /tomato|beans|chickpea|corn/i, 400],
  [/^can$/, /tuna|salmon|anchov/i, 150],
  [/^can$/, /coconut milk|evaporated|condensed/i, 400],
  [/^can$/, /./, 400],
  [/^stick$/, /butter/i, 113],
  [/^stick$/, /celery|cinnamon/i, 40],
  [/^slice$/, /bread/i, 30],
  [/^slice$/, /bacon/i, 12],
  [/^slice$/, /./, 25],
  [/^head$/, /garlic/i, 50],
  [/^head$/, /lettuce|cabbage|cauliflower|broccoli/i, 600],
  [/^stalk$/, /celery/i, 40],
  [/^stalk$/, /./, 40],
  [/^sprig$/, /./, 2],
  [/^bunch$/, /herb|parsley|cilantro|basil|mint|dill/i, 40],
  [/^bunch$/, /./, 150],
  [/^fillet$/, /./, 170],
  [/^packet$/, /yeast/i, 7],
  [/^packet$/, /gelatin/i, 7],
  [/^packet$/, /./, 100],
  [/^jar$/, /./, 350],
  [/^piece$/, /./, 50],
];

// bare-count items ("2 eggs", "3 bananas") — grams per each
const EACH_G = [
  [/egg yolk/i, 17],
  [/egg white/i, 33],
  [/egg/i, 50],
  [/banana/i, 118],
  [/onion/i, 150],
  [/potato/i, 210],
  [/carrot/i, 60],
  [/tomato/i, 120],
  [/apple/i, 180],
  [/lemon|lime/i, 70],
  [/orange/i, 130],
  [/avocado/i, 200],
  [/chicken breast/i, 170],
  [/chicken thigh/i, 130],
  [/(bell )?pepper|capsicum/i, 120],
  [/zucchini|courgette/i, 200],
  [/shallot/i, 30],
  [/tortilla|wrap/i, 45],
  [/bun|roll/i, 55],
];

function canonicalUnit(raw) {
  if (!raw) return null;
  const clean = raw.replace(/\.$/, "").trim();
  for (const [re, id] of UNIT_ALIASES) if (re.test(clean)) return id;
  return null;
}

// "2 1/2" | "1/2" | "2.5" | "2,5" | "½" | "2-3" | "2 to 3" → number.
// Ranges resolve to the midpoint (documented; consistent > clever).
export function parseQty(raw) {
  if (raw == null) return null;
  let s = String(raw).trim().replace(/[⁄]/g, "/");
  for (const [ch, val] of Object.entries(UNICODE_FRACTIONS)) {
    // "1½" or standalone "½"
    s = s.replace(new RegExp(`(\\d+)\\s*${ch}`), (_, n) => String(Number(n) + val));
    s = s.replace(new RegExp(ch), String(val));
  }
  const range = s.match(/^([\d./\s]+?)\s*(?:[-–—]|to)\s*([\d./\s]+)$/i);
  if (range) {
    const lo = parseQty(range[1]);
    const hi = parseQty(range[2]);
    if (lo != null && hi != null) return (lo + hi) / 2;
  }
  const mixed = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const frac = s.match(/^(\d+)\/(\d+)$/);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  const num = s.replace(",", ".").match(/^(\d+(?:\.\d+)?)$/);
  if (num) return Number(num[1]);
  return null;
}

function densityFor(item) {
  for (const [re, d] of DENSITY) if (re.test(item)) return { density: d, matched: true };
  return { density: DEFAULT_DENSITY, matched: false };
}

function gramsFor(qty, unit, item) {
  if (qty == null) return { grams: null, level: "none" };
  if (unit && MASS_G[unit]) return { grams: qty * MASS_G[unit], level: "exact" };
  if (unit && VOLUME_ML[unit]) {
    const { density, matched } = densityFor(item);
    return { grams: qty * VOLUME_ML[unit] * density, level: matched ? "good" : "default-density" };
  }
  if (unit && APPROX_G[unit]) return { grams: qty * APPROX_G[unit], level: "approx" };
  if (unit) {
    for (const [unitRe, itemRe, g] of PIECE_G) {
      if (unitRe.test(unit) && itemRe.test(item)) return { grams: qty * g, level: "approx" };
    }
    return { grams: null, level: "none" };
  }
  for (const [re, g] of EACH_G) if (re.test(item)) return { grams: qty * g, level: "approx" };
  return { grams: null, level: "none" };
}

// Line → { qty, unit, item, grams, confidence, raw }.
// Accepts a string ("2 cups flour") or the app's { measure, name } pair.
export function parseIngredientLine(input) {
  const raw =
    typeof input === "string"
      ? input
      : [input?.measure, input?.name].filter(Boolean).join(" ");
  const text = String(raw).replace(/\s+/g, " ").trim();

  const m = text.match(
    new RegExp(
      `^((?:\\d+\\s+\\d+[\\/⁄]\\d+|\\d+[\\/⁄]\\d+|\\d+(?:[.,]\\d+)?|[¼½¾⅓⅔⅛⅜⅝⅞])(?:\\s*(?:[-–—]|to)\\s*\\d+(?:[.,]\\d+)?)?)\\s*(${UNIT_WORDS})?\\.?\\s+(?:of\\s+)?(.+)$`,
      "i"
    )
  );

  let qty = null;
  let unit = null;
  let item = text;
  if (m) {
    qty = parseQty(m[1]);
    unit = canonicalUnit(m[2]);
    item = m[3].trim();
  }

  const { grams, level } = gramsFor(qty, unit, item);
  const confidence =
    level === "exact" || level === "good" ? "high"
    : level === "default-density" || level === "approx" ? "medium"
    : "low"; // qty or unit unresolved — grams unknown

  return {
    qty,
    unit,
    item,
    grams: grams == null ? null : Math.round(grams * 10) / 10,
    confidence,
    raw: text,
  };
}

// List → { lines, totalGrams, confidence } (overall = worst-weighted).
export function parseIngredients(list) {
  const lines = (list || []).map(parseIngredientLine);
  const withGrams = lines.filter((l) => l.grams != null);
  const totalGrams = withGrams.reduce((sum, l) => sum + l.grams, 0);
  const lowShare = lines.length ? lines.filter((l) => l.confidence === "low").length / lines.length : 1;
  const medShare = lines.length ? lines.filter((l) => l.confidence === "medium").length / lines.length : 0;
  const confidence = lowShare > 0.25 ? "low" : lowShare > 0 || medShare > 0.5 ? "medium" : "high";
  return { lines, totalGrams: Math.round(totalGrams), confidence };
}
