// PROTOTYPE — weight-first ("food scale") ingredient display, Kitchen Stories
// style. Locked product decisions (founder, 2026-07):
//
//   1. Weigh EVERYTHING weighable → grams, produce included (onion → grams,
//      not a count). Liquids → ml.
//   2. Scaled amounts read like a digital kitchen scale: "166.7 g", never
//      "166⅔". One decimal place, trailing ".0" stripped. Same for ml.
//   3. Shopping totals roll grams → kg above 1000 g ("1.2 kg", 1 dp).
//   4. Sub-5 g seasonings (salt, spices, leaveners, "to taste") stay as
//      tsp / tbsp / to taste — a home scale can't read them.
//   5. No "≈"/"~" marks. Clean numbers.
//   6. Weight-first is the default; `mode: "uscups"` keeps the classic
//      cups/fractions display for the account-screen toggle.
//
// This module deliberately does NOT reuse ingredientWeight.js's gating
// (MIN_GRAMS=20, produce excluded, ≈ prefix) — those encode the opposite
// product decision. It shares the parser so measures tokenize identically.
//
// Density sources: King Arthur Baking ingredient weight chart (baking staples),
// USDA FoodData Central household-measure conventions (produce, proteins,
// canned goods). Each row is tagged with its source category in a comment.

import { parseMeasure, convertMeasure, formatQty, snapQty } from "./ingredientParser.js";

// ---------------------------------------------------------------------------
// Number formatting — the "food scale" rule (locked decision #2).
// 1 decimal place, trailing .0 stripped: 166.6666 → "166.7", 150 → "150".
export function scaleNum(value) {
  const r = Math.round(value * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

// Shopping-list totals (locked decision #3): grams roll to kg above 1000 g.
export function formatShoppingWeight(grams) {
  if (grams == null) return "";
  if (grams > 1000) return `${scaleNum(grams / 1000)} kg`;
  return `${scaleNum(grams)} g`;
}
export function formatShoppingVolume(ml) {
  if (ml == null) return "";
  if (ml > 1000) return `${scaleNum(ml / 1000)} l`;
  return `${scaleNum(ml)} ml`;
}

// ---------------------------------------------------------------------------
// Unit tables (US customary → metric)
const MASS_G = { g: 1, kg: 1000, oz: 28.35, lb: 453.6 };
const VOLUME_ML = { cup: 240, tbsp: 15, tsp: 5, ml: 1, l: 1000, pint: 473, quart: 946, gallon: 3785 };
const CUP_ML = 240;

// ---------------------------------------------------------------------------
// ALWAYS-SPOONS seasonings (locked decision #4). These keep tsp/tbsp even when
// a big amount would clear 5 g — "1 tbsp paprika" is a spoon job, and salt
// brands vary ~2× by crystal (Diamond vs Morton), so grams would be false
// precision. Leaveners included: KA lists baking powder at 4 g/tsp.
const SEASONING_RE =
  /\b(salt|black pepper|white pepper|peppercorn|cayenne|paprika|cumin|coriander seed|ground coriander|cinnamon|nutmeg|clove(s)? \(ground\)|ground clove|allspice|turmeric|curry powder|garam masala|chin(?:ese)? five spice|five[- ]spice|chil(?:l)?i (powder|flakes)|red pepper flakes|oregano|thyme|rosemary|sage|dried (basil|parsley|dill|mint|herb)|italian seasoning|mixed spice|herbes? de provence|bay lea(f|ves)|mustard powder|onion powder|garlic powder|ginger \(ground\)|ground ginger|cardamom|star anise|saffron|sumac|za'?atar|fenugreek|caraway|celery salt|fennel seed|mustard seed|cumin seed|nigella|vanilla( extract| essence)?|almond extract|baking powder|baking soda|bicarbonate|cream of tartar|yeast|msg|stock cube|bouillon cube|zest|food colou?ring|liquid smoke|worcestershire|tabasco|hot sauce|fish sauce|sesame oil)\b/i;

// Phrases that are honestly unmeasurable — pass through verbatim.
const AS_IS_RE = /to taste|to serve|for (frying|greasing|garnish|dusting|the)|garnish|as needed|optional|dash|pinch|drizzle|splash|handful|sprinkling/i;

// Liquids display in ml (locked decision #1). Matched against the NAME.
const LIQUID_RE =
  /\b(water|milk(?!\s*powder)|buttermilk|cream(?!\s*cheese| of tartar)|double cream|single cream|half[- ]and[- ]half|stock|broth|wine|beer|cider|brandy|rum|sherry|marsala|vermouth|juice|vinegar|oil(?!ive)|olive oil|vegetable oil|sunflower oil|coconut milk|coconut cream|coconut water|passata|soy sauce|tamari|fish sauce|oyster sauce|hoisin|teriyaki|maple syrup|golden syrup|corn syrup|honey|molasses|treacle|condensed milk|evaporated milk|kefir|espresso|coffee|tea\b)\b/i;
// (honey/syrups: pourable — Kitchen Stories shows them in g, but a measuring
// jug/scale both work; we show ml for anything that pours level. Founder can
// flip syrups to g by moving them to the density table below.)

// ---------------------------------------------------------------------------
// name → grams per US cup. First match wins; specific before general.
// [KA] = King Arthur chart figure, [USDA] = FoodData Central household measure.
const DENSITY = [
  // — flours & starches [KA] —
  [/almond flour|ground almond/i, 96],
  [/whole ?wheat flour|wholemeal/i, 113],
  [/bread flour|strong flour/i, 120],
  [/self[- ]raising flour|self[- ]rising/i, 113],
  [/cornflour|cornstarch|corn starch|potato starch|tapioca|arrowroot/i, 113],
  [/cocoa/i, 85],
  [/flour/i, 120],
  // — sugars [KA] —
  [/icing sugar|powdered sugar|confectioner/i, 113],
  [/caster sugar|superfine sugar/i, 198],
  [/brown sugar|muscovado|demerara|coco sugar/i, 213],
  [/sugar/i, 198],
  // — fats [KA] —
  [/butter|margarine|shortening|lard|ghee|suet/i, 227],
  [/peanut butter|almond butter|tahini/i, 258],
  // — dairy solids & cheeses [KA/USDA] —
  [/cream cheese|mascarpone/i, 227],
  [/ricotta|cottage cheese|paneer|quark/i, 246],
  [/cr[eè]me fra[iî]che|sour cream|greek yog(h)?urt|yog(h)?urt/i, 245],
  [/parmesan|pecorino|grated cheese/i, 100],
  [/feta|goat'?s? cheese|blue cheese|stilton|gorgonzola/i, 150],
  [/cheese|cheddar|mozzarella|gruy[eè]re|monterey|colby|halloumi|emmental/i, 113],
  [/chocolate chip|chocolate|cacao nib/i, 170],
  // — coconut before nut (coconut ≠ nut density) [USDA] —
  [/coconut (milk|cream|water)/i, 227],
  [/desiccated coconut|shredded coconut|coconut flake/i, 80],
  [/coconut/i, 80],
  // — nuts, seeds, crumbs [KA] —
  [/panko/i, 50],
  [/breadcrumb|bread crumb/i, 113],
  [/flaked almond|sliced almond/i, 86],
  [/almond|walnut|pecan|peanut|cashew|pistachio|hazelnut|macadamia|pine nut|\bnuts?\b/i, 142],
  [/sesame|sunflower seed|pumpkin seed|chia|flax|poppy seed/i, 140],
  [/digestive biscuit|graham cracker|biscuit crumb|cookie crumb/i, 100],
  // — grains, legumes, pasta (dry) [KA/USDA] —
  [/rolled oats|oatmeal|porridge oats|\boats\b/i, 89],
  [/cornmeal|polenta|semolina|grits/i, 160],
  [/buckwheat|millet|barley|farro|spelt|freekeh/i, 170],
  [/quinoa|couscous|bulgur/i, 177],
  [/lentil/i, 192],
  [/split pea/i, 197],
  [/chickpea|garbanzo|cannellini|borlotti|kidney bean|black bean|butter bean|haricot|pinto|bean(?!\s*sprout)/i, 190],
  [/basmati|jasmine|arborio|risotto rice|long[- ]grain|rice(?!\s*(vinegar|wine|paper))/i, 185],
  [/pasta|macaroni|spaghetti|penne|fusilli|farfalle|rigatoni|orzo|linguine|fettuc+ine|tagliatelle|noodle|vermicelli/i, 100],
  // — dried fruit [KA] —
  [/raisin|sultana|\bcurrants?\b|dried cranberr|dried cherr|goji/i, 145],
  [/\bdates?\b|medjool|dried apricot|dried fig|dried mango|prune/i, 150],
  // — condiments & canned [USDA] —
  [/tomato (pur[eé]e|paste)/i, 262],
  [/passata|crushed tomato|chopped tomato|canned tomato|tinned tomato|diced tomato|plum tomato(es)? \(canned\)/i, 242],
  [/ketchup|barbecue sauce|bbq sauce/i, 274],
  [/mayonnaise|mayo/i, 232],
  [/mustard(?!\s*(powder|seed))/i, 249],
  [/pesto/i, 232],
  [/hummus/i, 246],
  [/salsa/i, 259],
  [/jam|marmalade|preserves|curd/i, 320],
  [/\bolives?\b/i, 135],
  [/capers?/i, 137],
  [/sweetcorn|corn kernel|frozen corn|canned corn/i, 165],
  [/frozen pea|garden pea|petits? pois|\bpeas\b/i, 145],
  // — produce, prepped (chopped/sliced unless noted) [USDA] —
  [/spinach|kale|rocket|arugula|watercress|salad leaves|lettuce|greens/i, 30],
  [/cabbage|slaw/i, 89],
  [/broccoli/i, 91],
  [/cauliflower/i, 100],
  [/mushroom/i, 70],
  [/celery/i, 101],
  [/carrot/i, 128],
  [/courgette|zucchini/i, 124],
  [/aubergine|eggplant/i, 82],
  [/cucumber/i, 119],
  [/(bell |red |green |yellow )?pepper(?!corn)|capsicum/i, 149],
  [/potato|swede|turnip|parsnip|celeriac|beetroot|squash|pumpkin(?!\s*seed)/i, 150],
  [/onion|shallot|leek|spring onion|scallion/i, 160],
  [/tomato/i, 180],
  [/green bean|runner bean|mangetout|snow pea|sugar ?snap/i, 110],
  [/avocado/i, 150],
  [/apple|pear/i, 125],
  [/banana/i, 150],
  [/strawberr|raspberr|blackberr|blueberr|cherr|berry|berries/i, 145],
  [/mango|pineapple|peach|nectarine|apricot|plum|melon|grape\b|grapes/i, 165],
  [/ginger(?!\s*(ale|beer))/i, 96],
  // — proteins by volume (diced/ground, for "1 cup cooked chicken") [USDA] —
  [/chicken|beef|pork|lamb|turkey|mince|sausage meat/i, 225],
  [/prawn|shrimp/i, 145],
  [/tofu/i, 252],
  // — milk powder & misc dry [KA] —
  [/milk powder|powdered milk/i, 128],
  [/gelatin(e)?/i, 150],
];

// ---------------------------------------------------------------------------
// Whole countable things → grams each [USDA medium unless noted].
// Used for unitless counts ("2 Onions") — most of TheMealDB.
const EACH_G = [
  [/whole chicken|chicken, whole/i, 1400],
  [/chicken breast|chicken fillet/i, 174],
  [/chicken thigh/i, 90],
  [/chicken (leg|drumstick)/i, 105],
  [/chicken wing/i, 50],
  [/duck breast/i, 190],
  [/pork chop/i, 200],
  [/lamb chop|cutlet/i, 100],
  [/pork tenderloin/i, 450],
  [/salmon fillet|salmon/i, 170],
  [/cod|haddock|sea bass|tilapia|trout|white fish|fish fillet/i, 170],
  [/mackerel/i, 90],
  [/anchov/i, 4],
  [/sausages?\b/i, 60],
  [/meatball/i, 30],
  [/burger|patty/i, 120],
  [/bacon|rasher|pancetta slice|prosciutto slice/i, 28], // per slice
  [/egg yolk/i, 18],
  [/egg white/i, 33],
  // (whole eggs deliberately absent — eggs stay counts, see COUNT_RE)
  [/spring onions?|scallions?|green onions?/i, 15], // must precede plain onion
  [/red onion|white onion|onions?\b/i, 110],
  [/shallot|challot/i, 30],
  [/leek/i, 89],
  [/carrot/i, 61],
  [/celery (stalk|stick|rib)|stick of celery|celery/i, 40],
  [/sweet potato/i, 130],
  [/potato/i, 173],
  [/parsnip/i, 115],
  [/beetroot|beet\b/i, 82],
  [/plum tomato|roma tomato/i, 62],
  [/cherry tomato/i, 17],
  [/tomato/i, 123],
  [/(bell |red |green |yellow )pepper|capsicum/i, 119],
  [/jalape[nñ]o/i, 14],
  [/(red |green |bird'?s eye )?chill?i(es)?\b|serrano/i, 14],
  [/courgette|zucchini/i, 196],
  [/aubergine|eggplant/i, 458],
  [/cucumber/i, 201],
  [/avocado/i, 136], // flesh only
  [/apple|pear/i, 180],
  [/banana/i, 118], // peeled
  [/peach|nectarine/i, 150],
  [/mango/i, 336],
  [/mushroom|portobello/i, 18],
  [/corn on the cob|corn cob|ear of corn/i, 90], // kernels
  [/garlic clove|clove of garlic|garlic/i, 3],
  [/ginger/i, 15], // thumb-size knob
  [/cabbage/i, 900], // whole head
  [/cauliflower/i, 588], // head, florets
  [/broccoli/i, 225], // head
  [/(iceberg|romaine|little gem|lettuce)/i, 300], // head
  [/butternut( squash)?/i, 680], // flesh
  [/fennel bulb/i, 234],
  [/lime/i, 44],
  [/lemon/i, 58],
  [/orange/i, 131],
  [/(?:beef|rump|sirloin|ribeye|fillet) steak|steak/i, 225],
  [/tofu( block)?|block of tofu/i, 350],
  [/stock cube|bouillon/i, 10],
  [/tortilla|wrap/i, 45],
  [/bread slice|slice of bread|bread/i, 28], // per slice
  [/lasagn[ea] sheet/i, 18],
];

// Per-unit gram weights for count-ish units the parser produces.
const UNIT_EACH_G = {
  stick: { default: 113 }, // US butter stick [KA]
  slice: { default: 28 },
  can: { default: 400 }, // standard 400 g / 14 oz tin [USDA canned convention]
};

// Things that stay COUNTS even though we could weigh them. Eggs are the big
// one — every scale-first app (incl. Kitchen Stories) shows "2 eggs", and a
// recipe can't use 0.7 of an egg anyway. Citrus juiced/zested stays whole.
const COUNT_RE = /\beggs?\b(?!\s*(plant|noodle))|lemon|lime|orange\b|bay lea|cinnamon stick|star anise|cardamom pod|lasagn[ea] sheet|tortilla|wrap|pitt?a|naan|baguette|bun\b|roll\b|corn on the cob/i;

// ---------------------------------------------------------------------------
function densityFor(name) {
  const n = String(name || "");
  for (const [re, gPerCup] of DENSITY) if (re.test(n)) return gPerCup;
  return null;
}
function eachGramsFor(name) {
  const n = String(name || "");
  for (const [re, grams] of EACH_G) if (re.test(n)) return grams;
  return null;
}

// Embedded pack weight in the measure note: "1 can (400g)", "2 x 400g tins",
// "1 (12 oz.) package". The recipe already told us the weight — believe it.
function embeddedGrams(note) {
  const m = String(note || "").match(/(\d+(?:\.\d+)?)\s*(g|kg|oz|lb|ml|l)\b\.?/i);
  if (!m) return null;
  const value = parseFloat(m[1]);
  const u = m[2].toLowerCase();
  if (u === "ml" || u === "l") return { ml: value * (u === "l" ? 1000 : 1) };
  return { grams: value * MASS_G[u] };
}

// ---------------------------------------------------------------------------
// Core resolver: parsed measure + name → { kind, text }
//   kind: "weight" | "volume-ml" | "seasoning" | "count" | "asis" | "volume-us"
// Never throws; anything unresolvable passes through verbatim (kind "asis").
export function formatAmount({ qty, unit, name, note = "", servingScale = 1, mode = "weight" }) {
  const r = resolveAmount({ qty, unit, name, note, servingScale, mode });
  return r.text;
}

export function resolveAmount({ qty, unit, name, note = "", servingScale = 1, mode = "weight" }) {
  const n = String(name || "");
  const rawNote = String(note || "");

  // Unparseable / unmeasurable — verbatim, never scaled, never faked.
  if (qty == null) {
    const raw = rawNote || (unit ? unit : "");
    return { kind: "asis", text: raw.trim() || "to taste" };
  }
  if (AS_IS_RE.test(rawNote) && !/\d/.test(rawNote) && !unit) {
    return { kind: "asis", text: `${formatQty(qty)} ${rawNote}`.trim() };
  }
  if (unit === "pinch" || unit === "dash" || unit === "handful" || unit === "sprig" || unit === "bunch") {
    return countText(qty * servingScale, unit, "seasoning");
  }

  // uscups mode: the classic display — snap to kitchen fractions, keep cups.
  if (mode === "uscups") {
    const scaled = servingScale === 1 ? qty : snapQty(qty * servingScale);
    const conv = convertMeasure({ qty: scaled, unit }, "us");
    const label = conv.unit ? ` ${conv.unit}${conv.qty > 1 && ["cup", "clove", "can", "slice", "stick"].includes(conv.unit) ? "s" : ""}` : "";
    return { kind: "volume-us", text: `${formatQty(conv.qty)}${label}`.trim() };
  }

  // ---- weight mode ----
  const scaledQty = qty * servingScale;

  // Seasonings keep their spoons (locked decision #4) — regardless of amount.
  if (SEASONING_RE.test(n) && (!unit || unit === "tsp" || unit === "tbsp" || !MASS_G[unit])) {
    if (unit && MASS_G[unit]) {
      return { kind: "weight", text: `${scaleNum(scaledQty * MASS_G[unit])} g` };
    }
    return countText(scaledQty, unit, "seasoning");
  }

  // Already mass → exact conversion, no assumption.
  if (unit && MASS_G[unit]) {
    return { kind: "weight", text: `${scaleNum(scaledQty * MASS_G[unit])} g` };
  }

  const liquid = LIQUID_RE.test(n);

  // Volume unit → ml (liquids) or grams via density (solids).
  if (unit && VOLUME_ML[unit]) {
    const ml = scaledQty * VOLUME_ML[unit];
    if (liquid) {
      // Tiny liquid amounts (a tsp of vanilla) stay spoons — same instrument
      // logic as decision #4: a scale/jug can't read < 10 ml.
      if (ml < 10) return countText(scaledQty, unit, "seasoning");
      return { kind: "volume-ml", text: `${scaleNum(ml)} ml` };
    }
    const gPerCup = densityFor(n);
    if (gPerCup) {
      const grams = (ml / CUP_ML) * gPerCup;
      if (grams < 5) return countText(scaledQty, unit, "seasoning"); // decision #4
      return { kind: "weight", text: `${scaleNum(grams)} g` };
    }
    // Unknown density — honest fallback: keep the volume, scaled.
    return countText(scaledQty, unit, "volume-us");
  }

  // "1 can (400g)" — the label already printed the weight.
  if (unit === "can" || (!unit && /\(/.test(rawNote))) {
    const emb = embeddedGrams(rawNote);
    if (emb?.grams) return { kind: "weight", text: `${scaleNum(scaledQty * emb.grams)} g` };
    if (emb?.ml) return { kind: "volume-ml", text: `${scaleNum(scaledQty * emb.ml)} ml` };
    if (unit === "can") {
      if (liquid) return { kind: "volume-ml", text: `${scaleNum(scaledQty * 400)} ml` };
      return { kind: "weight", text: `${scaleNum(scaledQty * UNIT_EACH_G.can.default)} g` };
    }
  }

  // Count units with a known per-unit weight. The NAME's own piece-weight
  // wins ("2 sticks celery" is 2 stalks × 40 g, not 2 butter-sticks × 113 g);
  // the unit default only covers names we don't know.
  if (unit && UNIT_EACH_G[unit]) {
    if (COUNT_RE.test(n)) return countText(scaledQty, unit, "count");
    const per = eachGramsFor(n) ?? UNIT_EACH_G[unit].default;
    const grams = scaledQty * per;
    if (grams < 5) return countText(scaledQty, unit, "seasoning");
    return { kind: "weight", text: `${scaleNum(grams)} g` };
  }

  // Garlic cloves stay cloves — 3 g each is under any scale's honesty line.
  if (unit === "clove" || /garlic/i.test(n)) {
    const grams = scaledQty * 3;
    if (grams < 5) return countText(scaledQty, unit || "clove", "seasoning");
    return countText(scaledQty, unit || "clove", "count"); // "4 cloves", still countable
  }

  // Unitless count — eggs/citrus/bakery stay counts, produce & proteins weigh.
  if (!unit) {
    if (COUNT_RE.test(n)) return countText(scaledQty, null, "count");
    const each = eachGramsFor(n);
    if (each) {
      const grams = scaledQty * each;
      if (grams < 5) return countText(scaledQty, null, "seasoning");
      return { kind: "weight", text: `${scaleNum(grams)} g` };
    }
    return countText(scaledQty, null, "count");
  }

  // Remaining count-ish units (piece, etc.) — pass through scaled.
  return countText(scaledQty, unit, "count");
}

// Spoon/count text: kitchen-real fractions (a ¼-tsp measure exists; a
// "0.7 clove" does not). Fractions are allowed here ONLY — decision #2's
// no-fraction rule is about scale-read numbers (g/ml).
const PLURAL = new Set(["cup", "clove", "can", "slice", "stick", "pinch", "handful", "sprig", "bunch", "piece"]);
function countText(qty, unit, kind) {
  const snapped = snapQty(qty);
  const label = unit ? ` ${unit}${snapped > 1 && PLURAL.has(unit) ? (unit === "pinch" ? "es" : "s") : ""}` : "";
  return { kind, text: `${formatQty(snapped)}${label}`.trim() };
}

// ---------------------------------------------------------------------------
// Convenience: raw TheMealDB-style measure string → display string.
// Handles ranges ("1-2 tbsp" → midpoint) before delegating to formatAmount.
export function formatIngredientLine(measure, name, servingScale = 1, mode = "weight") {
  const raw = String(measure || "").trim();
  // Range "1-2", "1 to 2", "1–2": midpoint, then the normal pipeline.
  const range = raw.match(/^(\d+(?:\.\d+)?)\s*(?:-|–|—|to)\s*(\d+(?:\.\d+)?)\s*(.*)$/i);
  const parsed = range
    ? { ...parseMeasure(`${(parseFloat(range[1]) + parseFloat(range[2])) / 2} ${range[3]}`) }
    : parseMeasure(raw);
  if (parsed.qty == null) return { display: raw, kind: "asis" };
  const r = resolveAmount({ ...parsed, name, servingScale, mode });
  return { display: r.text, kind: r.kind };
}

// Shopping aggregation helper: parsed entries for ONE ingredient → total line.
// Sums everything resolvable to grams (or ml for liquids); rolls to kg/l.
// Returns null when nothing summed (caller falls back to honest raw listing).
export function shoppingTotal(entries, name) {
  let grams = 0, ml = 0, missed = false;
  for (const e of entries) {
    const r = resolveAmount({ qty: e.qty, unit: e.unit, name, note: e.note || "", servingScale: 1 });
    const numeric = parseFloat(r.text);
    if (r.kind === "weight") grams += numeric;
    else if (r.kind === "volume-ml") ml += numeric;
    else missed = true;
  }
  if (missed || (grams && ml)) return null;
  if (grams) return formatShoppingWeight(grams);
  if (ml) return formatShoppingVolume(ml);
  return null;
}
