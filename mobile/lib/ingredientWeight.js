// Scale-friendly weights for ingredients where volume is a bad instrument.
//
// The rule that matters (and the reason most rows show nothing): weight helps
// when a VOLUME measurement is unreliable, not merely when the amount is large.
// Flour varies 20–30% by how you scoop it, so "1 cup" is genuinely ambiguous and
// grams fix it. A cup of stock is a cup of stock — "(227 g)" there is noise, and
// a recipe where every line carries a parenthetical is one nobody can scan.
//
// Sources: King Arthur Baking ingredient weight chart for baking staples (the
// convention printed recipes actually use), USDA FoodData Central for produce
// and whole-item weights.
//
// KA treats 1 cup = 8 oz = 227 g for water-like liquids; USDA's physically
// correct figure is 236.6 ml/242 g. We follow KA throughout rather than mixing
// conventions — mixing is the only real correctness risk in this table, and
// liquids don't display a weight anyway.

const CUP_ML = 240;

// Categories decide DISPLAY, not just density. Only the first group ever shows
// a weight; the rest are volume-only no matter how large the amount.
const SHOWS_WEIGHT = new Set(["flour", "sugar", "fat", "dairySolid", "nut", "grain", "protein"]);

// Below this, a home scale is the worse instrument — most are ±1 g and unreliable
// under ~5 g, so "1 tsp salt (6 g)" invites a 17% error a spoon wouldn't make.
const MIN_GRAMS = 20;

// name → [category, grams per US cup]. Order matters: first match wins, so
// specific patterns precede general ones.
const INGREDIENTS = [
  // — flours & starches (the entire justification for this feature) —
  [/almond flour|ground almond/i, "flour", 96],
  [/whole wheat flour|wholemeal flour/i, "flour", 113],
  [/bread flour|strong flour/i, "flour", 120],
  [/cornflour|cornstarch|corn starch|potato starch|tapioca/i, "flour", 113],
  [/cocoa/i, "flour", 85],
  [/flour/i, "flour", 120], // AP: KA's fluff-and-sweep figure

  // — sugars (brown especially: "packed" is undefined without a weight) —
  [/icing sugar|powdered sugar|confectioner|caster sugar/i, "sugar", 113],
  [/brown sugar|muscovado|demerara/i, "sugar", 213],
  [/honey|maple syrup|golden syrup|treacle|molasses/i, "sugar", 336],
  [/sugar/i, "sugar", 198],

  // — fats & dairy solids (sold by weight, so grams are EASIER than cups) —
  [/butter|margarine|shortening|lard/i, "fat", 227],
  [/cream cheese|mascarpone/i, "dairySolid", 227],
  [/parmesan|pecorino|grated cheese/i, "dairySolid", 100],
  [/cheese|cheddar|mozzarella|gruyere|feta/i, "dairySolid", 113],
  [/chocolate|chocolate chips|cacao/i, "dairySolid", 170],

  // — coconut is a LIQUID/produce, not a nut — must precede the nut pattern,
  //   because "cocoNUT" would otherwise false-match /nuts?\b/ and get weighed.
  [/coconut (milk|cream|water)/i, "liquid", 227],
  [/coconut/i, "produce", 80],

  // — nuts, seeds, crumbs —
  [/panko/i, "nut", 50],
  [/breadcrumb|bread crumb/i, "nut", 113],
  [/almond|walnut|pecan|peanut|cashew|pistachio|hazelnut|\bnuts?\b/i, "nut", 142],
  [/sesame|sunflower seed|pumpkin seed|chia|flax/i, "nut", 140],

  // — grains & legumes (dry) —
  [/rolled oats|oatmeal|porridge oats/i, "grain", 89],
  [/cornmeal|polenta|semolina/i, "grain", 160],
  [/buckwheat|millet|barley|farro|spelt/i, "grain", 170],
  [/quinoa|couscous|bulgur/i, "grain", 177],
  [/lentil/i, "grain", 192],
  [/chickpea|bean(?!\s*sprout)|pulse/i, "grain", 190],
  [/rice(?!\s*(vinegar|wine))/i, "grain", 185],
  [/pasta|macaroni|spaghetti|penne|noodle/i, "grain", 100],

  // — dried fruit (sold and baked by weight; a cup varies a lot by packing) —
  [/raisin|sultana|currant(?!\s|s?$)|dried cranberr|dried cherr/i, "grain", 145],
  [/\bcurrants?\b/i, "grain", 145],
  [/date(?!\s|d\b)|medjool|dried apricot|dried fig|dried mango|prune/i, "grain", 150],
  [/desiccated coconut|shredded coconut|coconut flake/i, "nut", 80],
  [/poppy seed/i, "nut", 145],
  [/digestive biscuit|graham cracker|biscuit crumb|cookie crumb/i, "nut", 100],

  // — soft cheeses by weight —
  [/ricotta|paneer|cottage cheese/i, "dairySolid", 246],

  // — liquids: VOLUME-ONLY. A measuring cup is already exact and faster. —
  [/oil/i, "liquid", 198],
  [/milk|cream|buttermilk|yoghurt|yogurt|sour cream/i, "liquid", 227],
  [/stock|broth|water|wine|juice|vinegar|sauce|passata/i, "liquid", 227],

  // — aromatics/produce: ±20% by dice size, and soup doesn't fail on it —
  [/spinach|kale|lettuce|rocket|arugula|greens/i, "produce", 30],
  [/mushroom/i, "produce", 70],
  [/celery/i, "produce", 101],
  [/carrot/i, "produce", 128],
  [/pepper(?!corn)|capsicum/i, "produce", 149],
  [/potato/i, "produce", 150],
  [/onion|shallot|leek/i, "produce", 160],
  [/tomato/i, "produce", 180],

  // — salt: a brand note beats a weight. Diamond Crystal vs Morton is ~2x. —
  [/salt/i, "salt", 288],
  // — spices & leaveners: always far under threshold —
  [/baking powder|baking soda|bicarbonate|yeast/i, "leavener", 192],
  [/pepper|paprika|cumin|cinnamon|spice|herb|thyme|oregano|basil|parsley|coriander|allspice/i, "spice", 120],
];

// Whole countable things → grams each (USDA). Used when a recipe says
// "1 whole chicken" or "2 onions" and there is no unit to convert at all —
// which is most of TheMealDB.
const EACH_G = [
  [/whole chicken|chicken, whole/i, "protein", 1400],
  [/chicken (breast|fillet)/i, "protein", 174],
  [/chicken (thigh|drumstick)/i, "protein", 90],
  [/egg yolk/i, "protein", 18],
  [/egg white/i, "protein", 33],
  [/egg/i, "protein", 50],
  [/garlic clove|clove of garlic|garlic/i, "spice", 3],
  [/onion|shallot/i, "produce", 110],
  [/carrot/i, "produce", 61],
  [/potato/i, "produce", 173],
  [/banana/i, "produce", 100],
  [/tomato/i, "produce", 180],
  [/lemon|lime/i, "produce", 70],
  [/bacon/i, "protein", 28],
  [/bread/i, "grain", 28],
];

// Cuts of meat and fish are sold by weight — grams are the natural unit even
// when the recipe writes a count.
const PROTEIN_RE =
  /chicken|beef|pork|lamb|turkey|duck|steak|mince|ground (beef|pork|lamb|turkey)|sausage|bacon|ham|fish|salmon|cod|tuna|prawn|shrimp|tofu/i;

// Direct mass units — these convert EXACTLY, no density assumption involved.
const MASS_G = { g: 1, kg: 1000, oz: 28.35, lb: 453.6 };
const VOLUME_ML = { cup: 240, tbsp: 15, tsp: 5, ml: 1, l: 1000, pint: 473, quart: 946 };

function lookup(name) {
  const n = String(name || "");
  for (const [re, category, gPerCup] of INGREDIENTS) {
    if (re.test(n)) return { category, gPerCup };
  }
  if (PROTEIN_RE.test(n)) return { category: "protein", gPerCup: 225 };
  return { category: "other", gPerCup: null };
}

// Per-item fallback for unitless counts ("2 Onions"). Deliberately does NOT
// guess a weight for a bare protein: "1 whole Chicken" ranges 1–2 kg and the
// specific-cut rows above (breast, thigh) already cover the cases we can call.
// A confident-wrong "≈225 g" on a whole bird is worse than no number.
function eachWeight(name) {
  const n = String(name || "");
  for (const [re, category, grams] of EACH_G) {
    if (re.test(n)) return { category, grams };
  }
  return null;
}

// Grams for a parsed measure, or null when we genuinely cannot say.
// `exact` is true ONLY for mass→mass conversion; everything else rests on a
// density or a piece-weight assumption and must be shown as an estimate.
export function gramsFor({ qty, unit, name }) {
  if (qty == null) return null;

  if (unit && MASS_G[unit]) {
    return { grams: qty * MASS_G[unit], exact: true, category: lookup(name).category };
  }

  if (unit && VOLUME_ML[unit]) {
    const { category, gPerCup } = lookup(name);
    if (!gPerCup) return null; // unknown ingredient — never invent a density
    const ml = qty * VOLUME_ML[unit];
    return { grams: (ml / CUP_ML) * gPerCup, exact: false, category };
  }

  // No unit ("1 whole Chicken", "2 Onions") — fall back to piece weights.
  if (!unit) {
    const each = eachWeight(name);
    if (each) return { grams: qty * each.grams, exact: false, category: each.category };
  }
  return null;
}

// Is a weight worth showing here? Three conditions, all required.
export function worthWeighing(category, grams, unit) {
  if (grams == null) return false;
  if (!SHOWS_WEIGHT.has(category)) return false; // liquids, spices, salt, produce
  if (grams < MIN_GRAMS) return false; // below a home scale's useful range
  // A recipe already written in mass says everything it needs to.
  if (unit && MASS_G[unit]) return false;
  return true;
}

// grams → the reader's system. Metric gets g/kg, US gets oz/lb.
export function formatWeight(grams, system = "metric") {
  if (grams == null) return "";
  if (system === "us") {
    const oz = grams / 28.35;
    if (oz >= 16) {
      const lb = oz / 16;
      return `${lb >= 10 ? Math.round(lb) : Math.round(lb * 10) / 10} lb`;
    }
    return `${oz >= 10 ? Math.round(oz) : Math.round(oz * 2) / 2} oz`;
  }
  if (grams >= 1000) return `${Math.round(grams / 100) / 10} kg`;
  // Round to a step the scale can actually resolve.
  const step = grams >= 200 ? 10 : grams >= 50 ? 5 : 1;
  return `${Math.round(grams / step) * step} g`;
}

// The whole pipeline: parsed measure + name → "≈120 g" or "" when not useful.
// The ≈ is not decoration — these rest on density and piece-weight assumptions,
// and Otto does not state estimates as facts.
export function weightHint({ qty, unit, name }, system = "metric") {
  const info = gramsFor({ qty, unit, name });
  if (!info) return "";
  if (!worthWeighing(info.category, info.grams, unit)) return "";
  return `≈${formatWeight(info.grams, system)}`;
}
