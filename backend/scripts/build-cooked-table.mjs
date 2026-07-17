// B1.8 — cooked-variant USDA records.
//
// usdaTable.json holds the RAW record for each ingredient, which is right when
// a recipe cooks the thing and wrong when it adds it already cooked. Brown rice
// is 360 kcal/100g raw and 123 cooked; dry black beans 341 vs ~91 drained. That
// single distinction was a 3x error on 52772 and 4x on one Arepa line.
//
// recipeFacts.json says WHICH lines are cooked (read from each recipe's own
// instructions). This fetches the cooked USDA record for those ingredients so
// the provider has something correct to swap in.
//
// Run from backend/:  USDA_API_KEY=... node scripts/build-cooked-table.mjs
import { writeFileSync } from "node:fs";
import cookedNames from "./cookedNames.json" with { type: "json" };
import rawQueries from "./usdaQueries.json" with { type: "json" };

// The facts agents wrote ingredient names as they appear in each recipe, so
// case drifts ("brown rice" vs the table's "Brown Rice"). A missed lookup fell
// back to the bare name, which made the identity word "brown" instead of
// "rice" — and let "Pork sausage rice links, brown and serve, cooked" win.
const queries = Object.fromEntries(
  Object.entries(rawQueries).map(([k, v]) => [k.toLowerCase(), v])
);
const queryFor = (name) => queries[String(name).toLowerCase()] || null;

const KEY = process.env.USDA_API_KEY;
if (!KEY) {
  console.log("USDA_API_KEY missing. Free key: https://fdc.nal.usda.gov/api-key-signup");
  process.exit(1);
}
const OUT = new URL("../src/lib/nutrition/usdaCookedTable.json", import.meta.url);

// USDA returns Energy TWICE under one nutrientName (KCAL + KJ). Reading the
// wrong one is a silent 4.184x error.
const nutrient = (food, name, unit) => {
  for (const n of food.foodNutrients || []) {
    if (n.nutrientName === name && (!unit || (n.unitName || "").toUpperCase() === unit)) {
      return typeof n.value === "number" ? n.value : null;
    }
  }
  return null;
};

// Reuse the curated raw query and swap its form word: the curated string already
// solved British→American and the identity of the food ("Aubergine" → eggplant).
// Only the state changes.
const cookedQuery = (name) => {
  const base = (queryFor(name) || name.toLowerCase()).replace(/\braw\b/g, "").trim();
  return `${base} cooked`;
};

const PROCESSED = ["oil", "pickled", "meatless", "cured", "spread", "juice", "powder", "infant", "baby food"];

const MODIFIERS = new Set([
  "raw", "cooked", "fresh", "dried", "ground", "whole", "all", "commercial",
  "varieties", "salad", "cooking", "table", "fluid", "mature", "seeds",
  "leaves", "prepared", "unenriched", "enriched", "regular", "plain", "canned",
  "long-grain", "boiled",
]);
const singular = (w) => (w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w);

function score(food, name) {
  const desc = (food.description || "").toLowerCase();
  const q = (queryFor(name) || name.toLowerCase()).replace(/\braw\b/g, "").trim();
  const terms = q.split(/\s+/).filter(Boolean);
  const core = singular(terms.find((w) => !MODIFIERS.has(w)) || terms[0] || "");
  if (!core || !desc.includes(core)) return -1000;

  const head = singular(desc.split(",")[0].trim());
  let s = 0;
  // Head match must dominate. Without it "rice brown long-grain cooked" chose
  // "Pork sausage rice links, brown and serve, cooked" (407 kcal) over real
  // cooked rice (123) — it matched rice+brown+cooked and won on comma count.
  if (head === core) s += 100;
  else if (head.includes(core)) s += 60;
  else s += 10; // merely mentioned — almost certainly the wrong food

  // The whole point: prefer a record that actually says cooked/boiled/canned.
  if (/\b(cooked|boiled|canned|drained)\b/.test(desc)) s += 60;
  if (/\braw\b/.test(desc)) s -= 80; // the raw row is what we are replacing

  // Corroboration: "rice white long-grain cooked" should pick white, not brown.
  for (const t of terms) {
    if (singular(t) !== core && t.length > 2 && desc.includes(singular(t))) s += 12;
  }
  for (const p of PROCESSED) if (desc.includes(p) && !q.includes(p)) s -= 40;
  s -= (desc.match(/,/g) || []).length * 2;
  return s;
}

const out = {};
const failed = [];
console.log(`resolving cooked records for ${cookedNames.length} ingredients\n`);

for (const name of cookedNames) {
  const url = new URL("https://api.nal.usda.gov/fdc/v1/foods/search");
  url.searchParams.set("query", cookedQuery(name));
  url.searchParams.set("dataType", "SR Legacy,Foundation");
  url.searchParams.set("pageSize", "20");
  url.searchParams.set("api_key", KEY);

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    const data = await res.json();
    const cands = (data.foods || []).filter((f) => nutrient(f, "Energy", "KCAL") != null);
    const best = cands.map((f) => ({ f, s: score(f, name) })).sort((a, b) => b.s - a.s)[0];
    // A negative winner means nothing credible said "cooked" — better to have no
    // row (the provider then drops the line) than to silently reuse the raw one.
    if (!best || best.s <= 0) {
      failed.push(name);
    } else {
      const f = best.f;
      out[name.toLowerCase()] = {
        fdcId: f.fdcId,
        usda: f.description,
        kcal: nutrient(f, "Energy", "KCAL"),
        protein_g: nutrient(f, "Protein"),
        fat_g: nutrient(f, "Total lipid (fat)"),
        carbs_g: nutrient(f, "Carbohydrate, by difference"),
        fiber_g: nutrient(f, "Fiber, total dietary"),
        sugar_g: nutrient(f, "Sugars, total including NLEA"),
        sodium_mg: nutrient(f, "Sodium, Na"),
      };
    }
  } catch {
    failed.push(name);
  }
  await new Promise((r) => setTimeout(r, 120));
}

writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
console.log(`resolved : ${Object.keys(out).length}/${cookedNames.length}`);
console.log(`unresolved: ${failed.length}${failed.length ? " → " + failed.join(", ") : ""}`);
console.log("written  : src/lib/nutrition/usdaCookedTable.json");
