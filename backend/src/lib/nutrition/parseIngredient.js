// B1.1 — ingredient line → structure. "2 1/2 cups plain flour" →
// { qty: 2.5, unit: "cup", item: "plain flour", grams: ~312, confidence }.
// Deterministic, no LLM. Grams are ESTIMATES (density fallbacks) and every
// unresolved qty/unit/density is flagged via confidence — honesty first.
import VERIFIED_PIECE from "./pieceWeights.json" with { type: "json" };

export const UNIT_WORDS =
  "cups?|cup|tablespoons?|tbsps?|tbsp|tbls?p?|tbs|teaspoons?|tsps?|tsp|grams?|g|kgs?|kg|milliliters?|mls?|ml|liters?|litres?|l|ounces?|oz|pounds?|lbs?|lb|quarts?|qts?|pints?|pts?|cloves?|cans?|tins?|slices?|rashers?|sticks?|pinch(?:es)?|dash(?:es)?|handfuls?|pieces?|sprigs?|bunch(?:es)?|packets?|packages?|jars?|heads?|stalks?|fillets?|knobs?|drops?|splash(?:es)?";

// canonical unit ids
const UNIT_ALIASES = [
  [/^cups?$/i, "cup"],
  [/^(tablespoons?|tbsps?|tbs|tbls|tblsp)$/i, "tbsp"], // TheMealDB spellings
  [/^(teaspoons?|tsps?)$/i, "tsp"],
  [/^(grams?|g)$/i, "g"],
  [/^(kgs?|kilograms?)$/i, "kg"],
  [/^(milliliters?|mls?)$/i, "ml"],
  [/^(liters?|litres?|l)$/i, "l"],
  [/^(quarts?|qts?)$/i, "quart"],
  [/^(pints?|pts?)$/i, "pint"],
  [/^(ounces?|oz)$/i, "oz"],
  [/^(pounds?|lbs?)$/i, "lb"],
  [/^cloves?$/i, "clove"],
  [/^(cans?|tins?)$/i, "can"],
  [/^(slices?|rashers?)$/i, "slice"],
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
  [/^splash(es)?$/i, "splash"],
];

const UNICODE_FRACTIONS = {
  "¼": 0.25, "½": 0.5, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3,
  "⅛": 0.125, "⅜": 0.375, "⅝": 0.625, "⅞": 0.875,
};

// mass → grams, exact
const MASS_G = { g: 1, kg: 1000, oz: 28.35, lb: 453.6 };
// volume → milliliters, exact (US customary)
// US liquid quart/pint (the corpus is US-and-UK mixed; US is the commoner
// written form and the two differ ~20%, so this is a documented choice).
const VOLUME_ML = { cup: 240, tbsp: 15, tsp: 5, ml: 1, l: 1000, quart: 946, pint: 473 };
// small/approximate units → grams, rough by nature
const APPROX_G = { pinch: 0.4, dash: 0.6, drop: 0.05, knob: 15, handful: 30, splash: 10 };

// per-item density (g/ml) for volume→grams. Water-like default when unknown.
const DENSITY = [
  [/flour|cornstarch|corn starch/i, 0.53],
  [/cocoa|cacao/i, 0.35],
  [/sugar, powdered|powdered sugar|icing sugar|confectioner/i, 0.56],
  [/brown sugar/i, 0.85],
  [/sugar/i, 0.85],
  [/butter|shortening|lard/i, 0.91],
  [/oil/i, 0.92],
  [/honey|syrup|molasses|condensed/i, 1.4],
  [/rice(?!\s*vinegar)/i, 0.85],
  [/oats|oatmeal/i, 0.4],
  [/parmesan|parmigiano|pecorino|grated cheese/i, 0.42],
  [/tomato (pur[eé]e|paste)/i, 1.09],
  [/cheddar|mozzarella|gruy[eè]re|monterey|colby|halloumi|emmental|feta|stilton/i, 0.47],
  [/cheese/i, 0.47],
  [/breadcrumbs|panko/i, 0.25],
  [/nuts?|almond|walnut|pecan|peanut|cashew/i, 0.55],
  [/spinach|greens|kale|rocket|watercress|\bchard\b|lettuce|arugula|pak (choi|koi)|bok cho[iy]|chinese leaf|callaloo|mulukhiyah|vine leaves|grape leaves|morning glory/i, 0.12],
  [/herbs|parsley|cilantro|basil|mint|dill|chives?|tarragon|marjoram|coriander|savoury/i, 0.17],
  [/aubergine|egg ?plant/i, 0.34],
  [/cabbage|slaw|brussels? sprout/i, 0.37],
  [/cauliflower/i, 0.42],
  [/broccoli/i, 0.38],
  [/fennel/i, 0.36],
  [/pasta|macaroni|spaghetti|penne|fusilli|farfalle|rigatoni|linguine|fettuc+ine|tagliatelle|orzo|noodle|vermicelli/i, 0.42],
  [/berr|currant|cherr|raisin|sultana|dried (fruit|apricot|fig)|\bdates?\b/i, 0.6],
  [/\bpeas?\b|sweetcorn|corn kernel/i, 0.62],
  [/marshmallow/i, 0.21],
  [/ginger|galangal/i, 0.4],
  [/digestive|graham cracker|biscuit crumb|cookie crumb/i, 0.42],
  [/pretzel|popcorn/i, 0.25],
  [/onion|carrot|celery|pepper|tomato|mushroom|zucchini|broccoli/i, 0.6],
  [/yogurt|sour cream|cream cheese|mayo/i, 1.03],
  [/milk|cream|broth|stock|water|juice|wine|vinegar|sauce/i, 1.0],
  [/salt/i, 1.2],
  [/baking (soda|powder)|yeast|spice|cinnamon|paprika|cumin|pepper$/i, 0.55],
];
const DEFAULT_DENSITY = 1.0;

// count-unit piece weights (grams per item). Rough — flagged lower confidence.
const PIECE_G = [
  [/^clove$/, /garlic/i, 3],
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
  [/^packet$/, /stevia|sweetener|splenda|saccharin|erythritol|monk fruit/i, 1],
  [/^packet$/, /./, 100],
  [/^jar$/, /./, 350],
  [/^piece$/, /./, 50],
];

// bare-count items ("2 eggs", "3 bananas") — grams per each
const EACH_G = [
  [/shortcrust|puff pastry/i, 320],
  [/lasagn[ea] sheet/i, 18],
  [/egg yolk/i, 17],
  [/egg white/i, 33],
  [/egg/i, 50],
  [/banana/i, 118],
  [/spring onion|scallion|green onion/i, 15],
  [/potatoe? buns?/i, 60],
  [/onion/i, 110],
  [/potato/i, 210],
  [/carrot/i, 60],
  [/cherry tomato/i, 17],
  [/tomato/i, 120],
  [/apple/i, 180],
  [/lemon|lime/i, 70],
  [/orange/i, 130],
  [/avocado/i, 200],
  [/chicken breast/i, 170],
  [/chicken thigh/i, 130],
  [/chill?i|jalape[nñ]o|habanero|serrano|scotch bonnet/i, 12],
  [/(bell )?pepper|capsicum/i, 120],
  [/zucchini|courgette/i, 200],
  [/(sh|ch)allot/i, 30], // "Challots" is TheMealDB's own spelling of shallots
  [/tortilla|wrap/i, 45],
  [/bun|roll/i, 55],
  // 2026-07-21 confidence sweep (audit-doubt.mjs): the corpus' most frequent
  // bare-count lines that resolved to no grams. Estimates, flagged approx.
  [/garlic/i, 3],
  [/cucumber/i, 300],
  [/celery/i, 40],
  [/cinnamon stick/i, 3],
  [/bacon|rasher/i, 28],
  [/cabbage/i, 900],
  [/leek/i, 90],
  [/baguette/i, 250],
  [/pita|flatbread|naan/i, 60],
  [/\bbread\b/i, 30],
  [/sausage/i, 75],
  [/stock cube|bouillon cube/i, 10],
  [/lettuce/i, 300],
  [/whole (chicken|duck)/i, 1400],
  [/chicken leg/i, 150],
  [/mushroom/i, 20],
  [/beetroot|beet\b/i, 80],
  [/chorizo/i, 60],
  [/fennel/i, 230],
  [/squash|pumpkin/i, 900],
  [/aubergine|eggplant/i, 450],
];

// "Juice of 1 lemon" / "Juice of 1/2 lime" — grams of juice yielded per fruit.
const JUICE_G = [
  [/lemon/i, 47],
  [/lime/i, 30],
  [/orange/i, 85],
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
    // "1½", "1 ½", "1-⅓" (TheMealDB writes all three) or a standalone "½"
    s = s.replace(new RegExp(`(\\d+)\\s*[-–—]?\\s*${ch}`), (_, n) => String(Number(n) + val));
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

// A piece weight VERIFIED against USDA's own foodPortions record for that food
// ("1 medium onion = 110 g"). These are not our estimates — they carry the same
// authority as the per-100g numbers we already trust from the same record, so
// they resolve at "good" (high confidence) rather than "approx". Provenance for
// every row (fdcId + the USDA portion wording) is in pieceWeights.json; a weight
// USDA could not confirm is deliberately NOT in that file and keeps its estimate
// flag via the tables below.
// English plurals the corpus actually writes: potatoes/tomatoes (not "potatos"),
// berries→berry, plus the plain -s. Without this "2 Potatoes" missed its own
// verified row and scored as a guess.
function singulars(word) {
  const out = [word];
  if (/oes$/.test(word)) out.push(word.slice(0, -2));
  if (/ies$/.test(word)) out.push(word.slice(0, -3) + "y");
  if (/ves$/.test(word)) out.push(word.slice(0, -3) + "f");
  if (/s$/.test(word) && !/ss$/.test(word)) out.push(word.slice(0, -1));
  return out;
}

const SIZE_QUALIFIER =
  // "dried", not "dry" — "dry-cured bacon" is still an ordinary rasher.
  /\b(cherry|baby|mini|miniature|dwarf|king|tiger|jumbo|plum|pearl|dried|frozen|canned|tinned|smoked|pickled)\b/i;

function verifiedPiece(item, unit) {
  let t = String(item || "").toLowerCase().trim();
  // "stick" is the only piece word canonicalUnit doesn't already fold into the
  // noun USDA uses (rasher→slice is a UNIT_ALIAS). Celery is the one that matters.
  let effUnit = unit === "stick" ? "stalk" : unit;
  // The piece noun sometimes rides in the NAME, not the measure: TheMealDB's
  // "Garlic Clove" with measure "1". Lift it into the unit so the verified
  // per-clove row applies.
  const embedded = t.match(/^(.*?)\s+(clove|stalk|slice)s?$/);
  if (embedded && !effUnit) {
    t = embedded[1].trim();
    effUnit = embedded[2];
  }
  // Match on the full item and on its last word, so "new potatoes" finds the
  // "potato" row — UNLESS the name carries a qualifier that changes the size or
  // state of the piece. A cherry tomato is not a 123 g tomato, a king prawn is
  // not a medium shrimp, a dried fig is not a fresh one: those must fall through
  // to their own estimate rather than inherit the generic weight AND its high
  // confidence. Then only a key naming the whole thing counts.
  const sized = SIZE_QUALIFIER.test(t);
  const forms = sized ? singulars(t) : [...singulars(t), ...singulars(t.split(/\s+/).pop() || "")];

  let best = null;
  for (const [name, row] of Object.entries(VERIFIED_PIECE)) {
    // A piece-noun row ("clove", "stalk") only applies when that noun is the unit.
    if ((row.unit || null) !== (effUnit || null)) continue;
    // Suffix only, never prefix: a key that PREFIXES the item names a different
    // food — "lemon grass" is not a lemon (it was resolving to 84 g of one),
    // "coconut milk" is not a coconut, "chicken stock" is not a chicken.
    const hit = forms.some((f) => f === name || (!sized && f.endsWith(" " + name)));
    if (hit && (!best || name.length > best.name.length)) best = { name, row }; // most specific wins
  }
  return best?.row ?? null;
}

// "For frying" / "for deep frying" oil: the recipe never states an amount, but
// the food does absorb some and counting ZERO understates every fried dish.
// Published absorption spans 8–25% of food weight (some studies 10–60%), which
// is far too wide to ever call exact — so we count a conservative single
// tablespoon of oil retained and flag the line "approx" (medium), never high.
// Under-counting beats over-claiming on a health-adjacent number.
const FRY_ABSORBED_G = 14; // 1 tbsp of oil
const FRY_RE = /\bfor (?:deep[- ])?frying\b/i;
const OIL_RE = /\boils?\b|\bghee\b|\blard\b|\bshortening\b|\bdripping\b|\bbutter\b|\bmargarine\b/i;

function gramsFor(qty, unit, item) {
  if (qty == null) return { grams: null, level: "none" };
  if (unit && MASS_G[unit]) return { grams: qty * MASS_G[unit], level: "exact" };
  if (unit && VOLUME_ML[unit]) {
    const { density, matched } = densityFor(item);
    return { grams: qty * VOLUME_ML[unit] * density, level: matched ? "good" : "default-density" };
  }
  if (unit && APPROX_G[unit]) return { grams: qty * APPROX_G[unit], level: "approx" };
  const verified = verifiedPiece(item, unit);
  if (verified) return { grams: qty * verified.grams, level: "good" };
  if (unit) {
    for (const [unitRe, itemRe, g] of PIECE_G) {
      if (unitRe.test(unit) && itemRe.test(item)) return { grams: qty * g, level: "approx" };
    }
    return { grams: null, level: "none" };
  }
  for (const [re, g] of EACH_G) if (re.test(item)) return { grams: qty * g, level: "approx" };
  return { grams: null, level: "none" };
}

// TheMealDB writes pack sizes as a parenthetical: "1 (12 oz.) stir-fry
// vegetables", "2 (8 oz) packages cream cheese". The main pattern below reads
// the leading count and then treats "(12 oz.)" as part of the item name, so the
// line resolves to no grams at all — the ingredient silently contributes zero
// and drags the whole recipe's confidence to "low". Multiply the count by the
// pack size and hand the parser a plain "12 oz …" instead.
export function expandPackSize(text) {
  const m = text.match(
    new RegExp(
      `^(\\d+(?:[.,]\\d+)?)?\\s*\\(\\s*(\\d+(?:[.,]\\d+)?)\\s*(${UNIT_WORDS})\\.?\\s*\\)\\s*(.+)$`,
      "i"
    )
  );
  if (!m) return text;
  const count = m[1] ? parseFloat(m[1].replace(",", ".")) : 1;
  const size = parseFloat(m[2].replace(",", "."));
  if (!Number.isFinite(count) || !Number.isFinite(size)) return text;
  const total = Math.round(count * size * 1000) / 1000;
  return `${total} ${m[3]} ${m[4]}`;
}

// Line → { qty, unit, item, grams, confidence, raw }.
// Accepts a string ("2 cups flour") or the app's { measure, name } pair.
export function parseIngredientLine(input) {
  const raw =
    typeof input === "string"
      ? input
      : [input?.measure, input?.name].filter(Boolean).join(" ");
  // TheMealDB dual-unit idiom "50g/1¾oz", "175g/6oz" — the slashed imperial
  // half defeats the qty pattern. Keep the metric side, drop the alternative.
  const text = expandPackSize(
    String(raw)
      .replace(/(\d+(?:\.\d+)?\s*(?:g|kg|ml|l)\b)\s*\/\s*[\d¼½¾⅓⅔⅛\s.\/]+(?:fl ?oz|oz|lb|pint)s?\b/i, "$1")
      .replace(/\s+/g, " ")
      .trim()
  );

  // "Juice of 1 lemon" / "Juice of 1/2 lime" — TheMealDB's citrus idiom. The
  // main pattern is digit-anchored so these resolved to no grams and dragged
  // confidence. Grams = fruits × typical juice yield; the fruit's own food row
  // carries the (very similar) nutrition.
  const juice = text.match(/^juice of (\d+(?:[\/⁄]\d+)?|[¼½¾⅓⅔])\s*(?:an?\s+)?(.+)$/i);
  if (juice) {
    const jQty = parseQty(juice[1]);
    const jItem = juice[2].trim();
    const yieldG = JUICE_G.find(([re]) => re.test(jItem))?.[1];
    if (jQty != null && yieldG) {
      return {
        qty: jQty, unit: null, item: jItem,
        grams: Math.round(jQty * yieldG * 10) / 10,
        confidence: "medium", raw: text,
      };
    }
  }

  const m = text.match(
    new RegExp(
      // The mixed-unicode form ("1 ½ tbsp", "1-⅓ cups") must come FIRST or the
      // bare-integer branch matches "1" and strips the fraction silently — the
      // line then reads 1 tbsp instead of 1.5, or drops out entirely.
      `^((?:\\d+\\s*[-–—]?\\s*[¼½¾⅓⅔⅛⅜⅝⅞]|\\d+\\s+\\d+[\\/⁄]\\d+|\\d+[\\/⁄]\\d+|\\d+(?:[.,]\\d+)?|[¼½¾⅓⅔⅛⅜⅝⅞])(?:\\s*(?:[-–—]|to)\\s*\\d+(?:[.,]\\d+)?)?)\\s*(${UNIT_WORDS})?\\.?\\s+(?:of\\s+)?(.+)$`,
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
  } else {
    // A bare unit with no number — "Pinch Salt", "Handful Parsley", "Dash
    // Pepper". TheMealDB writes a lot of measures this way. The pattern above
    // is anchored on a leading digit, so these resolved to NO grams: the line
    // was dropped from the nutrition sum AND counted as doubt, dragging the
    // recipe to "low" — when "one pinch" is the only sensible reading.
    // Requires something after the unit, so an ingredient that IS a unit word
    // ("Cloves" the spice, alone) still falls through unmatched.
    const bare = text.match(new RegExp(`^(${UNIT_WORDS})\\.?\\s+(?:of\\s+)?(.+)$`, "i"));
    if (bare) {
      qty = 1;
      unit = canonicalUnit(bare[1]);
      item = bare[2].trim();
    }
  }

  let { grams, level } = gramsFor(qty, unit, item);
  // Unquantified frying oil — see FRY_ABSORBED_G. Only when nothing else
  // resolved a weight, so an explicit "2 tbsp oil for frying" still wins.
  if (grams == null && FRY_RE.test(text) && OIL_RE.test(text)) {
    grams = FRY_ABSORBED_G;
    level = "approx";
    item = item || text;
  }
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
  // >25% unreadable → low; >25% of lines carrying any approximation → medium.
  // "high" means the numbers are genuinely mostly measured, not mostly guessed.
  const confidence = lowShare > 0.25 ? "low" : lowShare + medShare > 0.25 ? "medium" : "high";
  return { lines, totalGrams: Math.round(totalGrams), confidence };
}
