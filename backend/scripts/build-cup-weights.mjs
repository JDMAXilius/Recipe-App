// Derive grams-per-US-cup from USDA FoodData Central's own portion records, so
// the display density table stops depending on a copyrighted third-party chart.
//
// WHY: mobile/lib/foodScale.js sourced most of its densities from the King
// Arthur Baking ingredient weight chart, which is "All rights reserved" with no
// reuse grant. Individual facts are not copyrightable, but a compiled table's
// selection and arrangement plausibly is — and our comments documented the
// copying row by row. USDA FDC is CC0 public domain ("no permission is needed
// for their use, but we request that users list FoodData Central as the
// source"), so every row we can re-derive there is both legally clean AND
// verified provenance we can show.
//
// Output: cupWeights.json — { name: { gramsPerCup, fdcId, usda, portion } }.
// Anything USDA cannot supply is REPORTED, not guessed: those rows stay in the
// hand-written table and must be re-sourced or dropped by a human.
//
//   USDA_API_KEY=... node scripts/build-cup-weights.mjs [--dry]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { portions, search, sleep } from "./usdaClient.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const nutritionDir = path.join(here, "..", "src", "lib", "nutrition");
const table = JSON.parse(fs.readFileSync(path.join(nutritionDir, "usdaTable.json"), "utf8"));
const dest = path.join(nutritionDir, "cupWeights.json");
const out = fs.existsSync(dest) ? JSON.parse(fs.readFileSync(dest, "utf8")) : {};

// A cup portion, in USDA's wording. We accept only WHOLE-cup rows so the maths
// stays a straight read — no scaling a "1/4 cup, sliced" up by four, which
// silently changes the packing state of the food.
const CUP_RE = /^1 cup\b/i;
// State words that make a cup mean something else. "1 cup, sifted" is not the
// same measurement as "1 cup" and mixing them is how density tables go wrong.
const REJECT = /sifted|whipped|melted|packed|pureed|mashed|cooked|drained|liquid|juice|syrup|frozen/i;
// Food-level rejects: a "sugar substitute" is not brown sugar and "imitation
// cheddar" is not cheddar. Both slipped through on the first run and would have
// shipped a 23 g/cup brown sugar.
const REJECT_FOOD = /substitute|imitation|artificial|reduced|low[- ]fat|fat[- ]free|nonfat|dietetic/i;

// The vocabulary foodScale.js actually prices, mapped to the usdaTable key that
// names the same food. `query` is a direct USDA search for rows the table lacks.
const TARGETS = [
  ["flour", "plain flour", "Wheat flour, white, all-purpose, enriched, bleached"],
  ["whole wheat flour", "wholemeal flour", "Wheat flour, whole-grain"],
  ["bread flour", "bread flour", null],
  ["cornstarch", "cornflour", "Cornstarch"],
  ["cocoa", "cocoa", "Cocoa, dry powder, unsweetened"],
  ["sugar", "sugar", "Sugars, granulated"],
  // Cooks measure these in a specific state by convention — "packed" IS how a
  // cup of brown sugar is defined, and nobody sifts icing sugar unless told.
  ["icing sugar", "icing sugar", "Sugars, powdered", /^1 cup unsifted$/i],
  ["brown sugar", "brown sugar", "Sugars, brown", /^1 cup packed$/i],
  ["butter", "butter", "Butter, salted"],
  ["oil", "vegetable oil", "Oil, vegetable, canola"],
  ["honey", "honey", "Honey"],
  ["maple syrup", "maple syrup", "Syrups, maple"],
  ["milk", "milk", "Milk, whole, 3.25% milkfat, without added vitamin A and vitamin D"],
  ["yogurt", "yogurt", "Yogurt, plain, whole milk"],
  ["sour cream", "sour cream", "Cream, sour, cultured"],
  ["rice", "rice", "Rice, white, long-grain, regular, raw, unenriched"],
  ["oats", "oats", "Oats, whole grain, rolled, old fashioned"],
  ["breadcrumbs", "breadcrumbs", "Bread crumbs, dry, grated, plain"],
  ["parmesan", "parmesan cheese", "Cheese, parmesan, grated"],
  ["cheddar", "cheddar cheese", "Cheese, cheddar", /^1 cup, (shredded|diced)$/i],
  ["almonds", "almonds", "Nuts, almonds"],
  ["walnuts", "walnuts", "Nuts, walnuts, english"],
  ["peanuts", "peanuts", "Peanuts, all types, raw"],
  ["raisins", "raisins", "Raisins, seedless", /^1 cup \(not packed\)$/i],
  ["peas", "peas", "Peas, green, raw"],
  ["sweetcorn", "sweetcorn", "Corn, sweet, yellow, raw"],
  ["mushrooms", "mushrooms", "Mushrooms, white, raw"],
  ["spinach", "spinach", "Spinach, raw"],
  ["onion", "onions", "Onions, raw"],
  ["carrot", "carrots", "Carrots, raw"],
  ["celery", "celery", "Celery, raw"],
  ["tomato", "tomatoes", "Tomatoes, red, ripe, raw, year round average"],
  ["cabbage", "cabbage", "Cabbage, raw"],
  ["broccoli", "broccoli", "Broccoli, raw"],
  ["cauliflower", "cauliflower", "Cauliflower, raw"],
  ["lentils", "lentils", "Lentils, raw"],
  ["chickpeas", "chickpeas", "Chickpeas (garbanzo beans, bengal gram), mature seeds, raw"],
  ["water", "water", "Water, tap, drinking"],
];

const misses = [];
for (const [name, tableKey, query, portionOverride] of TARGETS) {
  if (out[name]) continue;
  const candidates = [];
  const row = table[tableKey] || table[name];
  if (row?.fdcId) candidates.push({ fdcId: row.fdcId, usda: row.usda });
  if (query) {
    try {
      for (const f of await search(query)) candidates.push({ fdcId: f.fdcId, usda: f.description });
    } catch {
      /* the table row may still carry it */
    }
    await sleep(1100);
  }
  if (!candidates.length) {
    misses.push(`${name}: no candidate record`);
    continue;
  }

  let found = null;
  const seen = [];
  for (const cand of candidates.slice(0, 4)) {
    let info;
    try {
      info = await portions(cand.fdcId);
    } catch (e) {
      seen.push(`${cand.fdcId} fetch failed`);
      continue;
    }
    await sleep(1100);
    if (REJECT_FOOD.test(info.description || "")) {
      seen.push(`${cand.fdcId} rejected: ${info.description}`);
      continue;
    }
    const hit = portionOverride
      ? info.list.find((p) => portionOverride.test(p.label))
      : info.list.find((p) => CUP_RE.test(p.label) && !REJECT.test(p.label));
    seen.push(`${cand.fdcId} [${info.list.map((p) => p.label).join(", ") || "no portions"}]`);
    if (hit) {
      found = { cand, info, hit };
      break;
    }
  }
  if (!found) {
    misses.push(`${name}: no clean "1 cup" portion — ${seen.join(" ;; ")}`);
    continue;
  }
  out[name] = {
    gramsPerCup: found.hit.grams,
    fdcId: found.cand.fdcId,
    usda: found.info.description,
    portion: found.hit.label,
    source: "usda-foodportion",
  };
  console.log(`✓ ${name.padEnd(20)} ${String(found.hit.grams).padStart(6)} g/cup  (${found.hit.label} — ${found.info.description})`);
}

console.log(`\nderived ${Object.keys(out).length}/${TARGETS.length} from USDA`);
if (misses.length) console.log(`\nNOT IN USDA — re-source or drop by hand (${misses.length}):\n  ${misses.join("\n  ")}`);
if (!process.argv.includes("--dry")) {
  fs.writeFileSync(dest, JSON.stringify(out, null, 2) + "\n");
  console.log(`\nwrote ${dest}`);
}
