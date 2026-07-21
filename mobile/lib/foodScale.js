// PROTOTYPE — weight-first ("food scale") ingredient display, Kitchen Stories
// style. Locked product decisions (founder, 2026-07):
//
//   1. EVERYTHING with a known weight → grams: produce, eggs, citrus, cans,
//      honey/syrups, lasagne sheets, tortillas — no count exceptions.
//      Thin pourable liquids (milk, stock, wine, oil) → ml.
//   2. Numbers read like a digital kitchen scale and are NEVER fractions —
//      "166.7 g", "0.5 tsp", never "166⅔" or "½". One decimal place,
//      trailing ".0" stripped. Applies to every unit in weight mode,
//      spoons included.
//   3. Shopping totals roll grams → kg above 1000 g ("1.2 kg", 1 dp).
//   4. Sub-5 g amounts (salt, spices, leaveners, a lone garlic clove) keep
//      tsp / tbsp / count — a home scale can't read them. Displayed as
//      decimals per #2 ("0.5 tsp").
//   5. No "≈"/"~" marks. Clean numbers.
//   6. Weight-first is the default; `mode: "uscups"` keeps the classic
//      cups/fractions display for the account-screen toggle (fractions are
//      the point of that mode).
//
// This module deliberately does NOT reuse ingredientWeight.js's gating
// (MIN_GRAMS=20, produce excluded, ≈ prefix) — those encode the opposite
// product decision. It shares the parser so measures tokenize identically.
//
// Density sources: King Arthur Baking ingredient weight chart (baking staples),
// USDA FoodData Central household-measure conventions (produce, proteins,
// canned goods). Each row is tagged with its source category in a comment.

import { parseMeasure, convertMeasure, formatQty, snapQty, scaledIngredient } from "./ingredientParser.js";

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
  /\b(salt|black pepper|white pepper|peppercorns?|cayenne|paprika|cumin|coriander seeds?|ground coriander|cinnamon|nutmeg|clove(s)? \(ground\)|ground clove|(?<!garlic\s)\bcloves\b(?!\s*(of\s)?garlic)|allspice|turmeric|curry powder|garam masala|masala|spice mix|seasoning|cajun|\bjerk\b|pul biber|panch poran|annatto|chin(?:ese)? five spice|five[- ]spice|chil(?:l)?i (powder|flakes)|red pepper flakes|oregano|thyme|rosemary|sage|dried (basil|parsley|dill|mint|herb)|italian seasoning|mixed spice|herbes? de provence|bay lea(f|ves)|mustard powder|onion powder|garlic powder|garlic granules|ginger \(ground\)|ground ginger|cardamom|cardomom|star anise|saffron|sumac|za'?atar|fenugreek|caraway|celery salt|fennel seeds?|mustard seeds?|cumin seeds?|achiote seeds?|nigella|khus khus|juniper berr|vanilla( extract| essence)?|almond (extract|essence)|baking powder|baking soda|bicarbonate|cream of tartar|yeast|msg|stock cube|bouillon cube|zest|food colou?ring|liquid smoke|worcestershire|tabasco|tobasco|hot ?sauce|sriracha|fish sauce|sesame( seed)? oil|egg wash)\b/i;

// Phrases that are honestly unmeasurable — pass through verbatim.
const AS_IS_RE = /to taste|to serve|for (frying|greasing|garnish|dusting|the)|garnish|as needed|optional|dash|pinch|drizzle|splash|handful|sprinkling/i;

// Liquids display in ml (locked decision #1). Matched against the NAME.
const LIQUID_RE =
  /\b(water|milk(?!\s*powder)|buttermilk|cream(?!\s*cheese| of tartar|ed)|double cream|single cream|half[- ]and[- ]half|stock|broth|wine(?!\s*leaves)|beer|stout|ale\b|cider|brandy|rum|sherry|marsala|vermouth|sake|mirin|liqueur|grand marnier|cointreau|kirsch|juice|vinegar|oil(?!ive)|olive oil|vegetable oil|sunflower oil|coconut milk|coconut cream|coconut water|passata|soy sauce|tamari|oyster sauce|hoisin|teriyaki|evaporated milk|millk|kefir|espresso|coffee|tea\b)\b/i;
// Honey/syrups/molasses/condensed milk are NOT here — they're viscous, cling
// to the spoon, and weigh cleanly, so they take the density path → grams
// (matches Kitchen Stories). Thin pourables above stay ml.

// ---------------------------------------------------------------------------
// name → grams per US cup. First match wins; specific before general.
// [KA] = King Arthur chart figure, [USDA] = FoodData Central household measure.
const DENSITY = [
  // — flours & starches [KA] —
  [/almond flour|ground almond/i, 96],
  [/whole ?wheat flour|wholemeal/i, 113],
  [/bread flour|strong flour/i, 120],
  [/self[- ]raising flour|self[- ]rising/i, 113],
  [/cornflour|cornstarch|corn starch|potato starch|tapioca|arrowroot|\bstarch\b/i, 113],
  [/cocoa|cacao/i, 85],
  [/masarepa|whole wheat\b|semolina flour/i, 120],
  [/flour/i, 120],
  // — sugars [KA] —
  [/icing sugar|powdered sugar|confectioner/i, 113],
  [/caster sugar|superfine sugar/i, 198],
  [/brown sugar|muscovado|demerara|coco sugar/i, 213],
  [/sugar/i, 198],
  // — viscous sweeteners: weigh, don't pour [KA] —
  [/honey/i, 336],
  [/maple syrup|golden syrup|corn syrup|agave/i, 322],
  [/molasses|treacle/i, 337],
  [/condensed milk/i, 306],
  // — fats [KA] —
  [/butter|margarine|shortening|lard|ghee|suet|goose fat|duck fat|dripping/i, 227],
  [/peanut butter|almond butter|tahini/i, 258],
  // — dairy solids & cheeses [KA/USDA] —
  [/cream cheese|mascarpone/i, 227],
  [/ricotta|cottage cheese|paneer|quark/i, 246],
  [/cr[eè]me fra[iî]che|sour cream|greek yog(h)?urt|yog(h)?urt|fromage frais|strained yoghurt/i, 245],
  [/parmesan|parmigiano|pecorino|grated cheese|v\u00e4sterbottensost/i, 100],
  [/feta|goat'?s? cheese|blue cheese|stilton|gorgonzola/i, 150],
  [/cheese|cheddar|mozzarella|gruy[eè]re|monterey|colby|halloumi|emmental|brie\b|manchego|queso|bryndza|panquehue|camembert|tempeh/i, 113],
  [/chocolate chip|chocolate|cacao nib/i, 170],
  // — coconut before nut (coconut ≠ nut density) [USDA] —
  [/coconut (milk|cream|water)/i, 227],
  [/desiccated coconut|shredded coconut|coconut flake/i, 80],
  [/coconut/i, 80],
  // — nuts, seeds, crumbs [KA] —
  [/panko/i, 50],
  [/breadcrumb|bread crumb/i, 113],
  [/flaked almond|sliced almond/i, 86],
  [/almond|walnut|pecan|peanut|cashew|pistachio|hazelnut|hazlenut|macadamia|pine nut|\bnuts?\b/i, 142],
  [/sesame|sunflower seed|pumpkin seed|chia|flax|poppy seed/i, 140],
  [/digestive biscuit|graham cracker|biscuit crumb|cookie crumb/i, 100],
  // — grains, legumes, pasta (dry) [KA/USDA] —
  [/rolled oats|oatmeal|porridge oats|\boats\b/i, 89],
  [/cornmeal|polenta|semolina|grits/i, 160],
  [/buckwheat|millet|barley|farro|spelt|freekeh|mixed grain|\brye\b|grits\b/i, 170],
  [/quinoa|couscous|bulgur/i, 177],
  [/lentil/i, 192],
  [/split pea/i, 197],
  [/chickpea|garbanzo|cannellini|borlotti|kidney bean|black bean|butter bean|haricot|pinto|bean(?!\s*sprout)/i, 190],
  [/basmati|jasmine|arborio|risotto rice|long[- ]grain|rice(?!\s*(vinegar|wine|paper))/i, 185],
  [/pasta|macaroni|spaghetti|penne|fusilli|farfalle|rigatoni|orzo|linguine|fettuc+ine|tagliatelle|noodle|vermicelli|fideo|sevaiiya|paccheri|pappardelle/i, 100],
  // — dried fruit [KA] —
  [/raisin|sultana|\bcurrants?\b|dried cranberr|dried cherr|goji/i, 145],
  [/\bdates?\b|medjool|dried apricot|dried fig|dried mango|prune/i, 150],
  // — condiments & canned [USDA] —
  [/tomato (pur[eé]e|paste)/i, 262],
  [/passata|crushed tomato|chopped tomato|canned tomato|tinned tomato|diced tomato|plum tomato(es)? \(canned\)/i, 242],
  [/ketchup|barbecue sauce|barbeque sauce|bbq sauce/i, 274],
  [/mayonnaise|mayo/i, 232],
  [/mustard(?!\s*(powder|seed))/i, 249],
  [/pesto/i, 232],
  [/hummus/i, 246],
  [/salsa|pico de gallo|enchilada sauce/i, 259],
  [/jam|marmalade|preserves|curd|dulce de leche|stroop|sirop/i, 320],
  // — flavor pastes: thick, spoon-measured, weigh cleanly [USDA] —
  [/curry paste|madras paste|harissa|gochujang|prahok|shrimp paste|galangal paste|tamarind (paste|ball|pulp)|miso/i, 250],
  [/horseradish|relish|vinaigrette|a[iï]oli|duck sauce|plum sauce|chilli sauce|caramel( sauce)?|custard(?!\s*powder)|creamed corn|malai|fruit pulp|passion fruit/i, 260],
  [/custard powder/i, 128],
  [/marzipan|almond paste|nougatine/i, 290],
  [/marshmallow/i, 50],
  [/pretzel|popcorn/i, 60],
  [/ice cream|sorbet/i, 140],
  [/sauerkraut|kimchi/i, 140],
  [/dal\b|toor|split pea/i, 192],
  [/\bolives?\b/i, 135],
  [/capers?/i, 137],
  [/sweetcorn|corn kernel|frozen corn|canned corn|dried (white )?corn/i, 165],
  [/frozen pea|garden pea|petits? pois|\bpeas\b/i, 145],
  // — produce, prepped (chopped/sliced unless noted) [USDA] —
  [/spinach|kale|rocket|arugula|watercress|salad leaves|lettuce|greens|bok cho[iy]|pak (choi|koi)|chinese leaf|morning glory|callaloo|mulukhiyah|vine leaves|grape leaves|\bchard\b/i, 30],
  // — fresh herbs, chopped [USDA] — most lines are handful/bunch (pass through);
  //   this covers the "1 cup basil" shape.
  [/\b(basil|cilantro|coriander( leaves)?|parsley|mint|dill|chives?|tarragon|marjoram|savoury|sorrel)\b/i, 40],
  [/bean ?sprout/i, 104],
  [/cabbage|slaw/i, 89],
  [/brussels? sprout/i, 88],
  [/rhubarb/i, 122],
  [/radish/i, 116],
  [/sauerkraut/i, 140],
  [/asparagus/i, 134],
  [/fennel/i, 87],
  [/chestnut/i, 145],
  [/currant|berry|berries/i, 145],
  [/stir[- ]?fry vegetables|roasted vegetables|mixed vegetables|frozen vegetables|\bvegetables\b|seafood mix/i, 140],
  [/dried fruit|fruit mix|mixed peel|candied peel/i, 145],
  [/broccoli/i, 91],
  [/cauliflower/i, 100],
  [/mushroom/i, 70],
  [/celery/i, 101],
  [/carrot/i, 128],
  [/courgette|zucchini/i, 124],
  [/aubergine|egg ?plants?/i, 82],
  [/cucumber/i, 119],
  [/(bell |red |green |yellow )?pepper(?!corn)|capsicum/i, 149],
  [/potato|swede|turnip|parsnip|celeriac|beetroot|beets?\b|squash|pumpkin(?!\s*seed)|taro|cassava|\byam\b|yautia|artichoke|plantain|breadfruit|daikon/i, 150],
  [/onion|shallot|leek|spring onion|scallion/i, 160],
  [/tomato/i, 180],
  [/green bean|runner bean|mangetout|snow pea|sugar ?snap/i, 110],
  [/avacado|avocado/i, 150],
  [/apple|pear/i, 125],
  [/banana/i, 150],
  [/strawberr|raspberr|blackberr|blueberr|cherr|berry|berries/i, 145],
  [/mango|pineapple|peach|nectarine|apricot|plum|melon|grape\b|grapes/i, 165],
  [/ginger(?!\s*(ale|beer))|galangal/i, 96],
  // — proteins by volume (diced/ground, for "1 cup cooked chicken") [USDA] —
  [/chicken|beef|pork|lamb|turkey|mince|sausage meat|veal|venison|goat|oxtail|tripe|doner|shredded meat|chuck|shank|ham\b|gammon|chorizo|kidney\b|liver\b|crab|conch|tuna|salmon|mackerel|monkfish|hake|snapper|herring|sardine|pilchard|barramundi|white fish|fish fillet|smoked haddock|haddock|duck\b|squid|lobster|frozen seafood/i, 225],
  [/prawn|shrimp/i, 145],
  [/tofu/i, 252],
  // — milk powder & misc dry [KA] —
  [/milk powder|powdered milk/i, 128],
  [/gelatin(e)?/i, 150],
  // — corpus mop-up: rare single-recipe items [USDA approx] —
  [/ackee|bamboo shoot|palm heart|longan|cassaba|\bfries\b/i, 150],
  [/papelon|panela|piloncillo|jaggery/i, 218],
  [/casabe/i, 60],
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
  [/\beggs?\b(?!\s*(noodle|plant|wash))/i, 50], // whole, without shell
  [/pitt?a/i, 60],
  [/naan/i, 90],
  [/baguette/i, 250],
  [/\b(buns?|rolls?)\b/i, 50],
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
  // — fish & seafood, per fillet/piece [USDA] —
  [/mackerel|herring|sardine|pilchard/i, 90],
  [/monkfish|hake|barramundi|red snapper|snapper|sea bream|halibut|tuna steak|swordfish/i, 170],
  [/smoked salmon slice/i, 20],
  [/baby squid/i, 40],
  [/squid|calamari/i, 100],
  [/mussel/i, 20], // in shell
  [/clam/i, 15],
  [/oyster/i, 45],
  [/lobster/i, 500],
  [/king prawn|tiger prawn|jumbo shrimp/i, 15],
  [/prawn|shrimp(?!\s*paste)/i, 8],
  [/crab (claw|stick)/i, 20],
  [/scallop/i, 25],
  // — cured & sausage-like, per piece/slice [USDA] —
  [/kielbasa|kabanos|polish sausage|german sausage|bratwurst/i, 85],
  [/morcilla|black pudding|chorizo ring/i, 200],
  [/frankfurter|hot ?dog/i, 50],
  [/parma ham|prosciutto|serrano ham|jam[oó]n/i, 15], // per slice
  [/ham slice|slice of ham/i, 25],
  [/duck leg/i, 200],
  [/\bduck\b/i, 1800], // whole
  [/lamb shank/i, 350],
  [/pig'?s? trotter/i, 350],
  [/frog'?s? leg/i, 25],
  [/chicken liver/i, 30],
  [/quail/i, 120],
  // — breads, pastry, wrappers [USDA] —
  [/english muffin|muffin/i, 60],
  [/ciabatta/i, 270],
  [/crusty bread|white bread|wholegrain bread|rye bread|stale bread|toast\b/i, 28], // per slice
  [/taco shell/i, 13],
  [/wonton (skin|wrapper)/i, 8],
  [/rice paper/i, 10],
  [/egg roll wrapper|spring roll wrapper/i, 12],
  [/filo|phyllo/i, 20], // per sheet
  [/puff pastry|shortcrust|pie crust|pastry (sheet|block)/i, 320], // rolled sheet/block
  [/rice flour pancake|pancake/i, 40],
  [/crumpet/i, 55],
  [/croissant/i, 60],
  [/falafel/i, 17],
  // — produce & fruit, per item [USDA] —
  [/asparagus( spear)?s?\b/i, 16],
  [/brussels? sprout/i, 20],
  [/radish/i, 5],
  [/rhubarb (stalk|stick)|rhubarb/i, 50],
  [/fig\b|figs\b/i, 50],
  [/dill pickle|gherkin/i, 65],
  [/grapefruit/i, 230],
  [/pomegranate/i, 280],
  [/plantain/i, 180],
  [/passion fruit/i, 18],
  [/kiwi/i, 75],
  [/date\b|dates\b|medjool/i, 24],
  [/apricot/i, 35],
  [/plum\b/i, 66],
  [/jerusalem artichoke/i, 60],
  [/beets?\b/i, 82],
  [/scotch bonnet|habanero/i, 10],
  [/chestnut/i, 10],
  [/fennel/i, 234], // bulb
  [/marrow\b/i, 800],
  [/artichoke/i, 128],
  [/spring roll|egg roll/i, 60],
];

// Per-unit gram weights for count-ish units the parser produces.
const UNIT_EACH_G = {
  stick: { default: 113 }, // US butter stick [KA]
  slice: { default: 28 },
  can: { default: 400 }, // standard 400 g / 14 oz tin [USDA canned convention]
};

// (No count exceptions — founder decision: everything with a known weight
// shows grams, eggs and citrus included. The only count survivors are items
// under the 5 g scale floor, e.g. a lone garlic clove.)

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
    return { kind: "asis", text: `${scaleNum(qty)} ${rawNote}`.trim() };
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
    const per = eachGramsFor(n) ?? UNIT_EACH_G[unit].default;
    const grams = scaledQty * per;
    if (grams < 5) return countText(scaledQty, unit, "seasoning");
    return { kind: "weight", text: `${scaleNum(grams)} g` };
  }

  // Garlic cloves: 3 g each — weigh when it clears the scale floor
  // ("6 g" for 2 cloves, like the reference), cloves below it.
  if (unit === "clove" || /garlic/i.test(n)) {
    const grams = scaledQty * 3;
    if (grams < 5) return countText(scaledQty, unit || "clove", "seasoning");
    return { kind: "weight", text: `${scaleNum(grams)} g` };
  }

  // Unitless count — weigh via per-item table (eggs, citrus, produce, all).
  if (!unit) {
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

// Spoon/count text — decimals here too (decision #2 applies to EVERY number
// in weight mode): "0.5 tsp", "1.3 tbsp", "0.7 cloves". Never "½".
const PLURAL = new Set(["cup", "clove", "can", "slice", "stick", "pinch", "handful", "sprig", "bunch", "piece"]);
function countText(qty, unit, kind) {
  const r = Math.round(qty * 10) / 10;
  const label = unit ? ` ${unit}${r !== 1 && PLURAL.has(unit) ? (unit === "pinch" ? "es" : "s") : ""}` : "";
  return { kind, text: `${scaleNum(r)}${label}`.trim() };
}

// ---------------------------------------------------------------------------
// Screen-facing seam: same shape scaledIngredient returns, so the recipe
// detail / cook screens swap one import and keep their render untouched.
// system "weight" (the default) → food-scale amounts; "us"/"metric" → the
// classic cups/fractions pipeline (the account-screen alternative).
export function displayIngredient(pair, factor = 1, system = "weight") {
  if (system !== "weight") return scaledIngredient(pair, factor, system);
  const r = formatIngredientLine(pair.measure, pair.name, factor, "weight");
  return {
    display: r.display,
    name: pair.name,
    scalable: r.kind !== "asis",
    weight: "", // grams ARE the display — no parenthetical hint needed
  };
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
