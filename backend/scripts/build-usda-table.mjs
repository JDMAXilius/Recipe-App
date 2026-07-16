// B1.7 — build the USDA ingredient table.
//
// Why USDA: FoodData Central is public domain (CC0 1.0). Unlike Edamam, whose
// Enterprise Basic plan permits caching "FoodId, Food Label" only and forbids
// "automated programatic requests with the goal to collect, scrape or save
// data", USDA data can be stored, shipped and redistributed freely. Attribution
// is requested, not required — Otto credits FoodData Central in the UI.
//
// Why a TABLE and not a live API: TheMealDB's whole catalogue uses 961 distinct
// ingredients. Resolve each ONCE here, commit the result, and every recipe —
// seed or user-created — is then parseIngredientLine() grams x this table.
// Zero API calls at runtime, forever. No vendor, no rate limit, no bill.
//
// Provenance: every row records fdcId + the USDA description, so any number on
// screen traces to a real food record. That is the point; a number we cannot
// source is a number we should not show.
//
// Run from backend/:  USDA_API_KEY=... node scripts/build-usda-table.mjs [limit]
import { writeFileSync } from "node:fs";

const KEY = process.env.USDA_API_KEY;
if (!KEY) {
  console.log("USDA_API_KEY missing. Free key: https://fdc.nal.usda.gov/api-key-signup");
  process.exit(1);
}
const LIMIT = Number(process.argv[2]) || Infinity;
const OUT = new URL("../src/lib/nutrition/usdaTable.json", import.meta.url);

// Curated ingredient → USDA query map (usdaQueries.json). Heuristics plateaued
// badly here: USDA ranks on text relevance, so "Avocado" resolved to "Oil,
// avocado" (884 vs 160 kcal), "Bacon" to "Bacon, meatless", "Baking Powder" to
// "Baobab powder", "Basmati Rice" to "Rice crackers". 700 of the 961 names are
// compounds and English compounds are head-final, except when they are not
// ("Basil Leaves" is basil, "Bay Leaf" is a spice) — which no scoring function
// was going to untangle.
//
// So the mapping is curated once, by hand/LLM, and committed. It only ever
// chooses WHICH USDA food a name means. Every number still comes from USDA and
// every row keeps its fdcId, so nothing here is invented.
let CURATED = {};
try {
  const mod = await import("./usdaQueries.json", { with: { type: "json" } });
  CURATED = mod.default;
} catch {
  console.log("note: scripts/usdaQueries.json not found — falling back to heuristics\n");
}

// TheMealDB is British; USDA is American. Without this, "Aubergine" simply does
// not exist in FoodData Central and the ingredient is silently dropped.
const BRITISH_TO_US = {
  aubergine: "eggplant",
  courgette: "zucchini",
  coriander: "cilantro",
  rocket: "arugula",
  prawns: "shrimp",
  prawn: "shrimp",
  swede: "rutabaga",
  beetroot: "beets",
  "spring onions": "scallions",
  "spring onion": "scallions",
  chilli: "chili peppers",
  "chilli powder": "chili powder",
  "plain flour": "wheat flour white all-purpose",
  "self-raising flour": "wheat flour white all-purpose self-rising",
  "double cream": "cream heavy whipping",
  "single cream": "cream light",
  "caster sugar": "sugars granulated",
  "icing sugar": "sugars powdered",
  cornflour: "cornstarch",
  "bicarbonate of soda": "leavening agents baking soda",
  sultanas: "raisins",
  mangetout: "peas edible-podded",
  gammon: "ham",
  rashers: "bacon",
  "minced beef": "beef ground",
  mince: "beef ground",
  "natural yogurt": "yogurt plain",
  "greek yogurt": "yogurt greek plain",
  "tomato puree": "tomato paste",
  "red lentils": "lentils",
  "digestive biscuits": "cookies graham crackers",
  treacle: "molasses",
  "mixed spice": "spices allspice ground",
  "swiss chard": "chard swiss",
};

// Nudge the search toward a whole raw ingredient. Bare "Salmon" ranks "Fish oil,
// salmon" (902 kcal/100g) first — a 4x error on any salmon recipe.
// "raw" steers the query toward the whole ingredient for anything that has a
// cooked/processed form — which is most whole foods, not just meat.
const RAW_HINT =
  /^(chicken|beef|pork|lamb|salmon|tuna|cod|haddock|prawns?|shrimp|turkey|duck|mince|steak|eggplant|zucchini|potato|carrot|onion|spinach|broccoli|cauliflower|mushroom|pepper|tomato|avocado|apple|banana|cabbage|leek|celery|pea|bean|rice|lentil)/i;

const normalize = (name) => {
  const key = name.trim().toLowerCase();
  return BRITISH_TO_US[key] || key;
};

// Curated query wins; heuristics are only the fallback for anything unmapped.
// A curated null means "no sensible USDA whole-food equivalent" (Knafeh, Hail,
// Christmas Pudding) — those stay out of the table and fall back to the
// ~category estimate, which is the honest answer rather than a bad match.
const queryFor = (name) => {
  if (name in CURATED) return CURATED[name]; // may be null = deliberately skipped
  const us = normalize(name);
  return RAW_HINT.test(us) ? `${us} raw` : us;
};

// USDA returns Energy TWICE — once KCAL, once KJ — under the same nutrientName.
// Taking the wrong one is a silent 4.184x error (eggplant: 25 kcal vs 104 kJ).
const nutrient = (food, name, unit) => {
  for (const n of food.foodNutrients || []) {
    if (n.nutrientName === name && (!unit || (n.unitName || "").toUpperCase() === unit)) {
      return typeof n.value === "number" ? n.value : null;
    }
  }
  return null;
};

// USDA ranks by text relevance, not by "the plain whole raw ingredient", so
// position 1 is routinely a processed form: avocado → "Oil, avocado" (884 vs
// 160 kcal), bacon → "Bacon, meatless", eggplant → "Eggplant, pickled".
// Taking the top hit put 5 of 7 spot-checks badly wrong. Rank instead.
const PROCESSED = [
  "oil", "pickled", "meatless", "cured", "canned", "dried", "spread",
  "juice", "powder", "dehydrated", "smoked", "sauce", "paste", "freeze-dried",
  "infant", "baby food", "fast food", "restaurant",
];

// Words that describe FORM, not identity. They must never make a candidate
// count as "naming" the ingredient — treating "raw" as a name-word let any raw
// food qualify, which is how "bananas raw" landed on "Pepper, banana, raw".
const MODIFIERS = new Set([
  "raw", "fresh", "dried", "ground", "whole", "all", "commercial", "varieties",
  "salad", "cooking", "table", "fluid", "mature", "seeds", "leaves", "prepared",
  "unenriched", "enriched", "regular", "plain", "unsweetened", "canned",
]);

const singular = (w) => (w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w);

function score(food, name) {
  const desc = (food.description || "").toLowerCase();
  const us = normalize(name) || "";
  const terms = us.split(/\s+/).filter(Boolean);
  // The identity word is the first non-modifier term: "oil olive" → oil,
  // "bananas raw" → banana, "cheese cheddar" → cheese.
  const core = singular(terms.find((w) => !MODIFIERS.has(w)) || terms[0] || "");
  if (!core) return -1000;

  const head = singular(desc.split(",")[0].trim());

  // The candidate MUST name the ingredient itself. Without this, "salmon raw"
  // scored "Abiyuch, raw" (an obscure fruit) above every real salmon: USDA
  // files salmon under "Fish, salmon, ..." so the head is "fish", and the only
  // thing scoring was the word "raw".
  if (!desc.includes(core)) return -1000;

  let s = 0;
  // Head match must ALWAYS outrank a mere mention. Previously the "filed under
  // a category" fallback scored 60 vs 50 for a partial head match, so NOT
  // matching the head beat matching it — "Mayonnaise, ... with olive oil" beat
  // "Oil, olive" for the query "oil olive".
  if (head === core) s += 100;
  else if (head.includes(core)) s += 80;
  else s += 40; // named somewhere in the description only

  // Each additional curated term found is corroboration: "milk whole fluid"
  // should prefer "Milk, whole, 3.25% milkfat" over "Milk, sheep, fluid".
  for (const t of terms) {
    if (t !== core && t.length > 2 && desc.includes(singular(t))) s += 10;
  }

  if (/\braw\b/.test(desc)) s += 15; // recipe lines mean raw ingredients

  // Penalise processed forms — unless the ingredient IS that thing
  // ("Olive Oil" must still be allowed to match an oil).
  for (const p of PROCESSED) {
    if (desc.includes(p) && !us.includes(p)) s -= 40;
  }

  // Fewer qualifiers = more generic. "Beef, ground, raw" beats
  // "Beef, cured, corned beef, brisket, raw".
  s -= (desc.match(/,/g) || []).length * 3;
  return s;
}

async function lookup(name) {
  const url = new URL("https://api.nal.usda.gov/fdc/v1/foods/search");
  url.searchParams.set("query", queryFor(name));
  // SR Legacy + Foundation are whole-food reference data. Branded is
  // manufacturer packaging — wrong shape for recipe ingredients.
  url.searchParams.set("dataType", "SR Legacy,Foundation");
  url.searchParams.set("pageSize", "20"); // rank these ourselves
  url.searchParams.set("api_key", KEY);

  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) return { error: `HTTP ${res.status}` };
  const data = await res.json();
  const candidates = (data.foods || []).filter((f) => nutrient(f, "Energy", "KCAL") != null);
  if (!candidates.length) return { error: "no match" };
  const food = candidates
    .map((f) => ({ f, s: score(f, name) }))
    .sort((a, b) => b.s - a.s)[0].f;

  const kcal = nutrient(food, "Energy", "KCAL");
  if (kcal == null) return { error: "no kcal" };

  return {
    fdcId: food.fdcId,
    usda: food.description,
    kcal,
    protein_g: nutrient(food, "Protein"),
    fat_g: nutrient(food, "Total lipid (fat)"),
    carbs_g: nutrient(food, "Carbohydrate, by difference"),
    fiber_g: nutrient(food, "Fiber, total dietary"),
    sugar_g: nutrient(food, "Sugars, total including NLEA"),
    sodium_mg: nutrient(food, "Sodium, Na"),
  };
}

const list = await (
  await fetch("https://www.themealdb.com/api/json/v1/1/list.php?i=list")
).json();
const ingredients = (list.meals || []).map((m) => m.strIngredient).filter(Boolean).slice(0, LIMIT);
console.log(`resolving ${ingredients.length} ingredients against USDA\n`);

const table = {};
const failed = [];
for (const [i, name] of ingredients.entries()) {
  const row = await lookup(name);
  if (row.error) {
    failed.push({ name, error: row.error });
  } else {
    table[name.toLowerCase()] = row;
  }
  if ((i + 1) % 50 === 0) console.log(`  ${i + 1}/${ingredients.length}...`);
  await new Promise((r) => setTimeout(r, 120)); // ~500/min, well under 3600/hr
}

writeFileSync(OUT, JSON.stringify(table, null, 2) + "\n");
console.log(`\nmatched  : ${Object.keys(table).length}/${ingredients.length}`);
console.log(`unmatched: ${failed.length}`);
console.log(`written  : src/lib/nutrition/usdaTable.json`);
if (failed.length) {
  console.log("\nunmatched (these fall back to the category estimate):");
  failed.slice(0, 30).forEach((f) => console.log(`  ${f.name} — ${f.error}`));
}
