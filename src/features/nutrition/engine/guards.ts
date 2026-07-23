// Guards carried over VERBATIM from v1 (engine.md Laws §4): raw-vs-cooked
// ambiguity, canned legumes, frying medium, batch condiment, typical amounts,
// negligible/inedible classification, coverage floor, plausibility bounds —
// and the carb ceiling (moved INTO the engine from mobile/constants/
// nutritionEstimates.js; the category fallback ranges stay feature-layer).
import type { ParsedLine } from "./parse";
import type { FoodRow } from "./lookup";

export interface Row {
  parsed: ParsedLine;
  food: FoodRow | null;
  name: string;
  resolved: boolean;
  estimated?: boolean;
  fryingMedium?: boolean;
  batchCondiment?: boolean;
  // Set by buildContext from recipeFacts `frying`: a human marked this line as a
  // browning/frying medium that mostly stays in the pan. See applyFryingMedium.
  curatedFrying?: boolean;
}

// ── Raw-vs-cooked ambiguity (usdaProvider.js) ────────────────────────────────
// "3 cups brown rice" does not say whether the rice is raw or cooked, and the
// two differ ~3x. The table holds the raw record. Nothing in an ingredient
// LINE resolves this; only the instructions do — and the engine never reads
// them (that is the edge-function classifier's job). So the recipe honestly
// refuses instead: null → the UI's ~category estimate.
const AMBIGUOUS_GRAIN =
  /\b(rice|pasta|spaghetti|macaroni|noodles?|penne|rigatoni|tagliatelle|fettuccine|linguine|farfalle|couscous|quinoa|bulgur|orzo|barley|farro|lentils?|oats|polenta|grits)\b/i;
const VOLUME_MEASURE = /\b(cups?|c\.)\b/i;

// Same trap in legumes: the table holds DRY beans (black beans, 341 kcal/100g)
// but "1 Can Black Beans" is cooked and drained (~91). Arepa Pabellón read
// 1364 kcal off one bean line alone. A can/tin measure means cooked; the table
// row does not, and it cannot vary per line.
const LEGUME = /\b(beans?|chickpeas?|lentils?|peas)\b/i;
const CANNED_MEASURE = /\b(cans?|tins?|tinned|canned)\b/i;

// A grain measured by VOLUME is the high-risk shape: "3 cups rice" reads
// naturally as either. Weight ("400g rice") almost always means raw in a
// recipe, so it is left alone rather than nulling half the catalogue.
export function isAmbiguousLine(p: { name?: string | null; measure?: string | null }): boolean {
  const name = String(p.name || "");
  const measure = String(p.measure || "");
  return (
    (AMBIGUOUS_GRAIN.test(name) && VOLUME_MEASURE.test(measure)) ||
    (LEGUME.test(name) && CANNED_MEASURE.test(measure))
  );
}

export function hasAmbiguousGrain(list: { name?: string | null; measure?: string | null }[]): boolean {
  return list.some(isAmbiguousLine);
}

// ── Frying medium ────────────────────────────────────────────────────────────
// A fat line this large cannot be an eaten ingredient: no 4-serving dish
// contains 250 g of oil as food. Above this we read it as the frying bath.
const FRYING_MEDIUM_MIN_G = 250;
const FAT_RE = /\b(oils?|ghee|lard|shortening|dripping|tallow)\b/i;
// Grams of fat absorbed per 100 g of food fried. Bognár (2002), BFE-R-02-03 —
// the table EuroFIR and FAO both cite: breaded meat/fish/vegetables 5–6,
// unbreaded 0–1, doughnuts/fried dough ~10. We use one conservative middle
// figure rather than pretending to know the breading state of every recipe;
// under-counting is the honest direction on a health-adjacent number.
const FAT_ABSORBED_PER_100G = 6;

// Per SERVING, not absolute. The flat 250 g was calibrated on "no 4-serving
// dish contains that much oil as food", which silently exempted small recipes:
// Chick-Fil-A is one serving whose "1 cup Olive Oil" (221 g) is explicitly a
// shallow-fry bath ("1/2 inch deep… blot on paper") yet sat under the bar.
// 60 g of fat in ONE portion is already extreme as an eaten ingredient.
const FRYING_MEDIUM_MIN_G_PER_SERVING = 60;

// ── Curated browning/frying medium (recipeFacts `frying`) ────────────────────
// The bath thresholds above only catch a submerged deep-fry. The commoner case —
// a stew or curry that browns a large main in "120 ml oil", most of which stays
// in the pan — sits FAR below the bath bar and so was counted whole (976 kcal of
// uneaten oil in one Irish stew). It CANNOT be inferred from the ingredient list:
// the same 120 ml oil is discarded pan residue in one dish and an eaten sauce
// base in the next, and only the instructions say which — which the engine never
// reads (contract). So this is HUMAN-curated per recipe, exactly like `servings`
// and `cooked`: a person marks the line, and only then is it treated as a medium.
// No threshold, no list heuristic, no false positives. Count only the film the
// food retains — a small amount that scales gently with servings, floored so a
// genuine pour never reads as near-zero. (Deep-fry baths still need no curation;
// the bath tier catches those for every recipe.)
const FRYING_MEDIUM_ABSORBED_G_PER_SERVING = 4;
const FRYING_MEDIUM_ABSORBED_FLOOR_G = 10;

export function applyFryingMedium(rows: Row[], perServing = 4): void {
  const servings = Math.max(1, perServing);
  const bathThreshold = Math.min(FRYING_MEDIUM_MIN_G, FRYING_MEDIUM_MIN_G_PER_SERVING * servings);
  // A large FAT_RE line reads as a submerged deep-fry bath (the pre-existing tier).
  const isBathOil = (r: Row) => (r.parsed.grams ?? 0) >= bathThreshold && FAT_RE.test(r.name || "");
  // What a bath cooks — everything EXCEPT the bath oils. Kept verbatim from the
  // original: a sub-threshold fat line still counts as fried food here, so a
  // recipe pairing a bath oil with a smaller oil is unchanged by this tier.
  const friedFoodGrams = rows
    .filter((r) => !isBathOil(r) && (r.parsed.grams ?? 0) > 0)
    .reduce((a, r) => a + (r.parsed.grams as number), 0);
  const curatedAbsorbed = Math.max(
    FRYING_MEDIUM_ABSORBED_FLOOR_G,
    Math.round(FRYING_MEDIUM_ABSORBED_G_PER_SERVING * servings)
  );

  for (const r of rows) {
    if (r.fryingMedium) continue; // already interpreted — keep the guard idempotent
    const grams = r.parsed.grams ?? 0;
    if (grams <= 0) continue;
    let absorbed: number | null = null;
    if (isBathOil(r)) {
      // Deep-fry bath (inferred): food submerged, ~6 % of its weight absorbed.
      // Checked FIRST so a line mis-curated as browning but actually a bath still
      // gets the (larger, safer) bath estimate rather than the small film.
      absorbed = Math.round((friedFoodGrams * FAT_ABSORBED_PER_100G) / 100);
    } else if (r.curatedFrying) {
      // Human-confirmed browning medium — no threshold, no inference. Film only.
      absorbed = curatedAbsorbed;
    }
    if (absorbed == null || absorbed >= grams) continue; // eaten / no reduction → count whole
    // Never claim MORE was absorbed than the cook put in the pan.
    r.parsed = { ...r.parsed, grams: Math.min(absorbed, grams), confidence: "medium" };
    r.fryingMedium = true; // an interpretation, so it scores as a guess
  }
}

// ── Batch condiment (made in bulk, eaten by the spoonful) ────────────────────
// Same shape as the frying medium, and the same failure: the Big Mac recipe
// mixes "1 cup Mayonnaise" of special sauce and spreads "a little" on two
// burgers. Counted whole that is 1496 of the recipe's 3056 kcal — the mixing
// bowl, not the dish — and it pushed the card past the plausibility cap.
//
// Per SERVING, so a potato salad that genuinely folds a cup of mayo through
// eight portions is untouched (~27 g each); only an implausible per-portion
// amount trips it. 50 g of pure condiment on ONE plate is already extreme.
const CONDIMENT_RE =
  /\b(mayonnaise|mayo|aioli|salad dressing|dressing|ketchup|catsup|mustard|relish|bbq sauce|barbeque sauce|barbecue sauce|hot ?sauce|sriracha|tartare|remoulade|salsa|guacamole|hummus|pesto|chutney|marinade)\b/i;
const CONDIMENT_MAX_G_PER_SERVING = 50;
// What one portion actually gets. A generous spread, not a ladle.
const CONDIMENT_SERVING_G = 30;

export function applyBatchCondiment(rows: Row[], perServing = 4): void {
  const servings = Math.max(1, perServing);
  for (const r of rows) {
    if (!((r.parsed.grams ?? 0) > 0) || !CONDIMENT_RE.test(r.name || "")) continue;
    if ((r.parsed.grams as number) / servings <= CONDIMENT_MAX_G_PER_SERVING) continue;
    const kept = CONDIMENT_SERVING_G * servings;
    // Never claim more was used than the recipe made.
    r.parsed = { ...r.parsed, grams: Math.min(kept, r.parsed.grams as number), confidence: "medium" };
    r.batchCondiment = true; // an interpretation, so it scores as a guess
  }
}

// Typical amounts for a line the recipe never quantified, by role. Deliberately
// CONSERVATIVE — under-counting is the honest direction on a health number, and
// these are our estimates, not USDA's. Ordered: first match wins.
const TYPICAL_G: [RegExp, number][] = [
  // Condiments and sauces: a serving spoonful, not the jar.
  [/sauce|ketchup|mustard|mayo|dressing|syrup|honey|vinegar|hot ?sauce|relish|chutney/i, 30],
  // Dry seasonings and leaveners already fall to NEGLIGIBLE; this catches the rest.
  [/sugar|flour|cornflour|cornstarch|starch|breadcrumb|cocoa/i, 30],
  [/oil|butter|ghee|lard|margarine/i, 15],
  [/cheese/i, 60],
  [/berr|strawberr|raspberr|blackberr|blueberr/i, 100],
  [/lettuce|spinach|rocket|salad|greens/i, 40],
  [/onion|pepper|tomato|carrot|celery|mushroom|garlic/i, 60],
  [/beef|pork|chicken|lamb|fish|prawn|shrimp|bacon|sausage/i, 120],
  [/bread|bun|roll|tortilla|pastry/i, 60],
];

export function applyTypicalAmounts(rows: Row[]): void {
  for (const r of rows) {
    if (!r.food || (r.parsed.grams ?? 0) > 0 || isNegligible(r)) continue;
    const name = String(r.name || "");
    const hit = TYPICAL_G.find(([re]) => re.test(name));
    if (!hit) continue;
    r.parsed = { ...r.parsed, grams: hit[1], confidence: "low" };
    r.estimated = true; // full doubt — the amount is ours, not the recipe's
  }
}

export const MAX_PLAUSIBLE_SERVING_GRAMS = 700;

// Human range for one serving of one dish. Anything outside it means the inputs
// were broken, not that the food is remarkable.
// Ceiling on the share of substantial lines that may carry no weight at all.
// Beyond this the mass-based coverage fraction is vouching for a minority of
// the recipe (see the guard that uses it).
export const UNWEIGHED_LINE_MAX = 0.4;

export const MIN_PLAUSIBLE_KCAL = 40;
export const MAX_PLAUSIBLE_KCAL = 1500;

// Fraction of a recipe's substantial (non-seasoning) mass that must match a
// USDA row before the computed total is trustworthy. Below this, enough is
// missing that the sum describes a different dish — return null (→ estimate).
// 0.7 keeps normal recipes (a stray specialty line is fine) while catching the
// "main ingredient dropped" case that reads plausible but is wrong.
export const COVERAGE_MIN = 0.7;

// SEASONING IS NOT DOUBT.
//
// Measured over the seed catalogue 2026-07-19: 78.5% of recipes read "low" and
// only 2.4% "high" — a signal that never varies carries no information. The
// cause was not bad data. 99.4% of ingredient lines matched a USDA record; what
// failed to resolve was overwhelmingly "To taste Salt" and "To taste Pepper",
// which are unquantifiable BY NATURE and contribute ~no calories either way.
//
// The old formula divided by every line, so an unknowable pinch of salt scored
// exactly as much doubt as a missing cup of flour. That reported the ESTIMATE as
// poor when only the salt was unknown — the opposite of honest.
//
// So these lines are excluded from the confidence metric entirely. They are NOT
// excluded from the nutrition sum: if one resolves, its grams still count. Only
// the guard on quantity keeps this narrow — a garnish of parsley is negligible,
// 500g of spinach is a real ingredient and is scored like one.
const NEGLIGIBLE =
  /\b(salt|pepper|peppercorns?|seasoning|spices?|herbs?|parsley|cilantro|coriander|basil|thyme|rosemary|oregano|sage|mint|dill|chives|bay leaf|bay leaves|garnish|zest|vanilla extract|food colou?ring|cardamom|star anise|cloves|saffron|nutmeg|vanilla pods?|orange (?:blossom|flower) water|rose ?water|kaffir lime lea(?:f|ves)|lime lea(?:f|ves)|pandan lea(?:f|ves)|curry lea(?:f|ves)|lemongrass stalk)\b/i;
const NEGLIGIBLE_MAX_G = 15;

// Serving-suggestion measures — "To serve", "To garnish", "For greasing": the
// line is an optional accompaniment or trace, not measured recipe mass, so an
// unmatched one is not missing calories. "For frying" is deliberately NOT here:
// absorbed frying oil is real, uncounted kcal — that doubt is honest.
// TheMealDB writes these bare as often as with "for" ("Dusting", not "for
// dusting"; "To Glaze"; "Drizzle"). The bare forms were missing, so a finishing
// trace of flour or egg-wash was scored as a missing ingredient and dragged its
// recipe's confidence down. A glaze or a dusting is a trace by definition — the
// same reasoning that already excludes "to serve".
const UNQUANTIFIED =
  /\b(to serve|to garnish|for (?:the )?garnish|to taste|for greasing|for brushing|for dusting|for drizzling|as needed|as required|optional|dusting|to glaze|for glazing|drizzle|to decorate|for decoration|to finish|beaten)\b/i;

// NOT FOOD AT ALL.
//
// Num Ansom wraps its rice parcels in "8 Banana Leaves" — 944 g of leaf against
// 882 g of actual cake. The leaf is a steamer, discarded at step 13 ("Unwrap the
// banana leaves and slice"); nobody eats it. Left unmatched it sank coverage to
// 48% and the recipe refused, and matching it to a food row would have invented
// a meal out of foliage. Neither is true, so the line leaves the coverage
// denominator at ANY mass — which is what separates this from NEGLIGIBLE, a real
// food present in trace amounts and capped at 15 g.
const INEDIBLE =
  // Aromatic leaves are simmered for perfume and lifted out before serving -
  // bay, kaffir lime, pandan, curry leaf, lemongrass stalk. They are not eaten at
  // any quantity, so the 15 g NEGLIGIBLE cap is the wrong instrument: "4 Kaffir
  // Lime Leaves" is 20 g and was being scored as a missing ingredient.
  /\b(banana leaves?|bamboo leaves?|lotus leaves?|corn husks?|kaffir lime lea(?:f|ves)|lime lea(?:f|ves)|pandan lea(?:f|ves)|curry lea(?:f|ves)|lemongrass stalks?|skewers?|toothpicks?|cocktail sticks?|kitchen twine|greaseproof paper|parchment paper|baking paper)\b/i;

export function isNegligible(row: Pick<Row, "name" | "parsed">): boolean {
  if (INEDIBLE.test(row.name || "") || INEDIBLE.test(row.parsed.item || "")) return true;
  if (row.parsed.grams == null && UNQUANTIFIED.test(row.parsed.raw || "")) return true;
  if (!NEGLIGIBLE.test(row.name || "") && !NEGLIGIBLE.test(row.parsed.item || "")) return false;
  return row.parsed.grams == null || row.parsed.grams <= NEGLIGIBLE_MAX_G;
}

// ── CARB CEILING (TestFlight QA 2026-07-21) ─────────────────────────────────
// Ported from mobile/constants/nutritionEstimates.js per engine.md Laws §4:
// the ceiling lives INSIDE the engine, one copy. The category template is a
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

export interface CategoryEstimate {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function applyCarbCeiling(
  estimate: CategoryEstimate,
  ingredientNames: (string | null | undefined)[] | null | undefined
): CategoryEstimate {
  const names = (ingredientNames || []).map((n) => String(n || "")).filter(Boolean);
  if (!names.length) return estimate; // no list to judge by — leave it alone
  const carbBearing = names.some(
    (n) => !CARB_TRACE_ONLY.test(n) && CARB_SOURCES.test(n)
  );
  if (carbBearing || estimate.carbs <= TRACE_CARBS_G) return estimate;
  return { ...estimate, carbs: TRACE_CARBS_G };
}
