// Resolve "1 <thing>" weights for the bare-count vocabulary TheMealDB actually
// uses, from USDA's own foodPortions where a whole-item portion exists.
//
// These are the lines that previously resolved to NO grams at all: "1 Chicken",
// "4 Pork Chops", "8 Prawns", "3 Lamb Leg". They were dropped from the calorie
// sum AND scored as doubt, so they hit the recipe twice.
//
// Only USDA-confirmed portions are written. Anything USDA can't confirm is
// reported for a human/Claude decision rather than guessed here.
//
//   USDA_API_KEY=... node scripts/build-item-weights.mjs [--dry]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { portions, search, sleep } from "./usdaClient.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const nutritionDir = path.join(here, "..", "src", "lib", "nutrition");
const table = JSON.parse(fs.readFileSync(path.join(nutritionDir, "usdaTable.json"), "utf8"));
const dest = path.join(nutritionDir, "pieceWeights.json");
const existing = fs.existsSync(dest) ? JSON.parse(fs.readFileSync(dest, "utf8")) : {};

// A whole-item portion, in USDA's wording. Ordered: the earlier a pattern, the
// stronger the preference (a "medium" beats a "cup, chopped").
// A MEASURE word here means the portion is a volume/mass, not one whole item —
// "1 cup", "1 tsp", "1 oz". Accepting those produced a 2 g ginger ("1 tsp") and
// a 134 g asparagus ("1 cup") on the first run. Checked before anything else.
const MEASURE =
  /\b(cups?|tsp|teaspoons?|tbsp|tablespoons?|oz|ounces?|lbs?|pounds?|g|grams?|kg|ml|l|liters?|litres?|serving|servings|racc|quarts?|pints?|block|dash|pinch)\b/i;
const WHOLE = [
  /^1 (medium|large|small)\b/i,
  /^1 (fruit|each|whole)\b/i,
  /^1 (fillet|chop|leg|thigh|breast|wing|drumstick|steak|link|patty|shank|lobster|muffin|pomegranate|avocado|beet|leek)\b/i,
  /^1 (piece|slice|leaf|stalk|clove|head|ear|sheet|almond|nut)\b/i,
  /^1 [a-z]+(?:\s*\(.*\))?$/i, // "1 beet", "1 pomegranate (4\" dia)"
];

// name in the corpus → the usdaTable key to read the fdcId from (when different),
// plus an optional direct USDA query when the table has no usable row.
const TARGETS = [
  ["ginger", null, "Ginger root, raw"],
  ["dried apricots", "apricots", null],
  ["chicken", null, "Chicken, broilers or fryers, whole, raw"],
  ["pork chops", "pork", "Pork, fresh, loin, chop, raw"],
  ["corn on the cob", "sweetcorn", "Corn, sweet, yellow, raw"],
  ["prawns", "prawns", "Crustaceans, shrimp, raw"],
  ["king prawns", "prawns", "Crustaceans, shrimp, raw"],
  ["salmon", null, null],
  ["cod", null, null],
  ["mackerel", null, null],
  ["herring", null, null],
  ["trout", null, null],
  ["sardines", null, null],
  ["oysters", null, null],
  ["lobster", null, null],
  ["radish", null, null],
  ["mango", null, null],
  ["peaches", "peach", null],
  ["pears", "pear", null],
  ["figs", "fig", null],
  ["prunes", "prunes", null],
  ["strawberries", "strawberries", null],
  ["pomegranate", null, null],
  ["walnuts", null, null],
  ["almonds", null, null],
  ["parsnips", "parsnip", null],
  ["turnips", "turnip", null],
  ["celeriac", null, null],
  ["swede", null, "Rutabagas, raw"],
  ["asparagus", null, null],
  ["broccoli", null, null],
  ["tofu", null, null],
  ["english muffins", null, "Muffins, English, plain"],
  ["chicken wings", null, "Chicken, broilers or fryers, wing, meat and skin, raw"],
  ["chicken drumsticks", null, "Chicken, broilers or fryers, drumstick, meat and skin, raw"],
  ["duck legs", null, "Duck, domesticated, meat and skin, raw"],
  ["black olives", "olives", null],
  ["coconut", null, "Nuts, coconut meat, raw"],
];

const out = { ...existing };
const unresolved = [];

for (const [name, tableKey, query] of TARGETS) {
  if (out[name]) continue;
  let fdcId = table[tableKey || name]?.fdcId;
  let desc = table[tableKey || name]?.usda;
  if (!fdcId && query) {
    try {
      const foods = await search(query);
      if (foods[0]) {
        fdcId = foods[0].fdcId;
        desc = foods[0].description;
      }
    } catch {
      /* fall through to unresolved */
    }
    await sleep(1100);
  }
  if (!fdcId) {
    unresolved.push(`${name}: no fdcId (table key "${tableKey || name}" absent, query ${query ? "failed" : "not given"})`);
    continue;
  }
  let info;
  try {
    info = await portions(fdcId);
  } catch (e) {
    unresolved.push(`${name}: portions fetch failed (${e.message})`);
    continue;
  }
  const candidates = info.list.filter((p) => !MEASURE.test(p.label));
  let hit = null;
  for (const pat of WHOLE) {
    hit = candidates.find((p) => pat.test(p.label));
    if (hit) break;
  }
  if (!hit) {
    unresolved.push(`${name}: no whole-item portion — had [${info.list.map((p) => p.label).join(" | ") || "none"}]`);
  } else {
    out[name] = {
      grams: hit.grams,
      unit: null,
      fdcId,
      usda: info.description || desc,
      portion: hit.label,
      source: "usda-foodportion",
    };
    console.log(`✓ ${name.padEnd(22)} ${String(hit.grams).padStart(6)} g  (${hit.label} — ${info.description})`);
  }
  await sleep(1100);
}

console.log(`\nresolved ${Object.keys(out).length - Object.keys(existing).length} new (${Object.keys(out).length} total)`);
if (unresolved.length) console.log(`\nUNRESOLVED — need a decision, not a guess (${unresolved.length}):\n  ` + unresolved.join("\n  "));

if (!process.argv.includes("--dry")) {
  fs.writeFileSync(dest, JSON.stringify(out, null, 2) + "\n");
  console.log(`\nwrote ${dest}`);
}
