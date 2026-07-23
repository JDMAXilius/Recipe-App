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
const FAT_RE = /\b(oils?|ghee|lard|shortening|dripping|tallow|margarine)\b/i;
// Butter is matched as a bare dairy-butter word, ruling out the EATEN foods the
// WORD rides on — peanut/nut butter, butter beans, buttermilk, butternut. It is
// used ONLY to keep butter out of the fried-food denominator (it is a fat, not
// food being fried); butter is NOT a browning medium — see applyFryingMedium.
const BUTTER_RE = /\bbutter\b/i;
const BUTTER_NOT =
  /\b(peanut|nut|almond|cashew|hazelnut|apple|cocoa|shea|body|butter ?beans?|buttermilk|butternut|butterhead|butterscotch)\b/i;
const isButterMedium = (name: string) => BUTTER_RE.test(name) && !BUTTER_NOT.test(name);
const isFatLine = (name: string) => FAT_RE.test(name) || isButterMedium(name);

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

// T1 (Irish Stew, 2026-07-23). The bath rule above catches DEEP fries but misses
// the more common leak: a MODERATE pour used to BROWN. Irish stew's "120ml olive
// oil" (110 g) is 976 uneaten kcal, yet at 8 servings it is only 13.75 g/serving
// — far under any bath threshold, and LOWERING the per-serving bar can't fix it
// without also zeroing a 120 g jar of vinaigrette. The honest signal is not the
// oil's size but whether there is something to brown IN it: substantial MEAT. So
// a moderate fat pour counts as a browning medium only when a real quantity of
// meat/fish is present. A dressing, aglio e olio, hummus/pesto, an oil-poach, a
// Mediterranean bean-in-oil braise (Fasoliyyeh, Gigantes) — none carry browning
// meat, so their oil stays fully eaten, exactly as the honesty constraint demands.
const MEAT_RE =
  /\b(beef|mince|steak|lamb|mutton|pork|bacon|ham|gammon|sausages?|chorizo|pancetta|prosciutto|salami|veal|goat|venison|chicken|turkey|duck|quail|poultry|meat|fish|salmon|cod|tuna|haddock|tilapia|barramundi|snapper|mackerel|trout|prawns?|shrimps?|squid|octopus|scallops?|tofu|paneer)\b/i;
// Stock/broth/sauce/paste carry the meat word but no meat to brown.
const MEAT_NOT = /\b(stock|broth|bouillon|consomm|sauce|paste|powder|cube)\b/i;
const MEAT_MIN_G = 100;

// T1-followup (marinade/roast, NOT this ticket): unquantified proteins — "1
// Chicken", "1 Lamb Leg", "2 x 400g barramundi" — parse to —g, so meatPresent
// stays false and the oil is (correctly, for now) left whole. Those dishes
// (53103, 53280, 53437) mistake a MARINADE for a browning medium, a different
// problem from browning-vs-eaten; left for a future ticket.

// Liquids do not absorb frying oil, so they must not pad the food mass the bath
// model divides the oil across. Mulukhiyah's 1 L water inflated the denominator
// enough to force a genuine oil-braise down to the 14 g browning film. (T1 rev.)
const LIQUID_RE = /\b(water|stock|broth|bouillon|consomm[eé]|wine|beer|ale|lager|cider|milk|cream|buttermilk|juice|vinegar)\b/i;

// A moderate pour is a BROWNING medium only in a hot meat braise/sear. The same
// pour in a cold DRESSED or finished-starch dish is eaten vinaigrette/finishing
// fat, and slashing that is a false positive on eaten calories (REFUTER, T1
// rev). Ingredient-line signals of that non-browning context:
//   • a vinaigrette/dressing — vinegar, mustard-emulsion, an explicit dressing word;
//   • a salad base — raw salad leaves/veg (spinach, lettuce, rocket, cucumber, avocado…);
//   • a starch that DOMINATES the dish (potato/rice/pasta/quinoa the largest food
//     line) — a dressed pasta/potato salad or a finished mash/risotto, not a braise.
// Irish stew keeps browning: its lamb dominates (no starch base) and it carries
// no dressing or salad line. Mulukhiyah keeps browning too: jute (a cooked green)
// is not a salad leaf and does not match the starch base.
const DRESSING_RE = /\b(vinegar|vinaigrette|dressing|mustard)\b/i;
const SALAD_VEG_RE =
  /\b(lettuce|spinach|rocket|arugula|cucumber|avocado|watercress|mesclun|mixed greens|salad leaves)\b/i;
const STARCH_RE =
  /\b(potato(?:es)?|rice|pasta|spaghetti|macaroni|noodles?|penne|farfalle|fusilli|rigatoni|tagliatelle|fettuccine|linguine|couscous|quinoa|bulgur|orzo|barley|farro|gnocchi)\b/i;
// What a browning film actually leaves behind: ~1 tbsp clings to the food, the
// rest is pan residue or renders off (USDA FNDDS retention; NUTRITION_ACCURACY
// T1). Unlike the deep-fry model this is a flat cap — a browning pour is a thin
// medium, not a bath the food is immersed in, so absorption does not scale with
// the whole food mass.
const FRY_ABSORBED_G = 14;

export function applyFryingMedium(rows: Row[], perServing = 4): void {
  const servings = Math.max(1, perServing);
  const bathMin = Math.min(FRYING_MEDIUM_MIN_G, FRYING_MEDIUM_MIN_G_PER_SERVING * servings);
  const meatPresent = rows.some(
    (r) => (r.parsed.grams ?? 0) >= MEAT_MIN_G && MEAT_RE.test(r.name || "") && !MEAT_NOT.test(r.name || "")
  );

  // The solid food lines (fat and liquid excluded) the oil would be browning /
  // soaking into — also the basis for "which food dominates".
  const foods = rows.filter(
    (r) => (r.parsed.grams ?? 0) > 0 && !isFatLine(r.name || "") && !LIQUID_RE.test(r.name || "")
  );
  const dominant = foods.reduce<Row | null>(
    (max, r) => ((r.parsed.grams as number) > (max?.parsed.grams ?? 0) ? r : max),
    null
  );
  // Dressed/finished context ⇒ the fat is eaten, not a browning medium.
  const dressedContext =
    (dominant != null && STARCH_RE.test(dominant.name || "")) ||
    rows.some((r) => DRESSING_RE.test(r.name || "") || SALAD_VEG_RE.test(r.name || ""));

  const fats = rows.filter((r) => {
    if (r.fryingMedium) return false; // idempotent: never re-medium a reduced line
    const grams = r.parsed.grams ?? 0;
    if (grams <= 0) return false;
    const name = r.name || "";
    // Butter is NOT a frying medium. It is a finishing/mounting fat — stirred
    // into mash, risotto, and sauces and fully eaten — far more often than a
    // browning bath, and every worst T1 false positive was butter slashed on a
    // fully-eaten dish. Real deep-frying uses ghee/clarified (already in FAT_RE);
    // frying in whole butter is vanishingly rare. So butter is always eaten. The
    // `!FAT_RE` gate below already excludes it; this is the reason. (T1 rev.)
    if (!FAT_RE.test(name)) return false;
    return grams >= bathMin || (meatPresent && grams > FRY_ABSORBED_G && !dressedContext);
  });
  if (!fats.length) return;

  const friedFoodGrams = foods.reduce((a, r) => a + (r.parsed.grams as number), 0);
  for (const r of fats) {
    const oil = r.parsed.grams as number;
    const deepFry = Math.round((friedFoodGrams * FAT_ABSORBED_PER_100G) / 100);
    // Bath (deep fry): the oil pool exceeds what the food can soak up, so the
    // food's absorption is the ceiling and the rest is drained — count that.
    // Film (browning): the pour is less than that ceiling, a thin medium to sear
    // in rather than a bath, so only ~1 tbsp clings and the rest stays in the pan.
    const absorbed = deepFry <= oil ? deepFry : Math.min(oil, FRY_ABSORBED_G);
    // Never claim MORE was absorbed than the cook put in the pan.
    r.parsed = { ...r.parsed, grams: Math.min(absorbed, oil), confidence: "medium" };
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
