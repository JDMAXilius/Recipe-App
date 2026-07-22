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
// A search result must be the food we ASKED for. USDA's search is fuzzy enough
// to answer "Capers, canned" with "Butterbur, canned" — same packaging, a wholly
// different plant — and that row shipped a capers weight taken from butterbur.
// It also answered "grits" with plain white cornmeal. So require one real word
// in common between the record's description and either the key or the query,
// ignoring the packaging/state vocabulary every USDA description shares.
const STOP =
  /^(canned|raw|cooked|boiled|dried|fresh|frozen|mature|immature|seeds?|with|without|salt|salted|unsalted|added|solids|liquids|whole|grain|regular|quick|plain|unenriched|enriched|includes|foods?|program|distribution|style|prepared|commercial|varieties|year|round|average|types|drained|sweetened|unsweetened|generic|bottled|pieces|chopped|sliced|cubes)$/;
const words = (s) =>
  new Set((String(s).toLowerCase().match(/[a-z]{3,}/g) || []).filter((w) => !STOP.test(w)));
function relatesTo(description, ...targets) {
  const d = words(description);
  return targets.some((t) => [...words(t)].some((w) => d.has(w)));
}

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

  // ── 2026-07-21: the nutrition parser now reads this file too (GAP 2). ──────
  // Everything below is a food the CORPUS measures in cups and that neither
  // this table nor parseIngredient's DENSITY list covered — so the line fell to
  // the 1.0 g/ml water default. A cup of diced potato is 150 g, not 240; a cup
  // of chocolate chips is 168 g, not 240. Ranked by the doubt-mass each name
  // contributed across scripts/corpus (see report), biggest first.
  //
  // Keys are matched by FULL NAME or LAST WORD (same rule as pieceWeights), so
  // "cannellini beans" needs its own key while "white cornmeal" rides on
  // "cornmeal". Nothing here is hand-typed: the guards above still reject a
  // "1 cup sifted"-style portion and any substitute/imitation record.
  ["potato", "potatoes", "Potatoes, flesh and skin, raw"],
  ["sweet potato", "sweet potatoes", "Sweet potato, raw, unprepared"],
  // NOT chocolate chips, deliberately. usdaTable.json keys "chocolate chips" to
  // fdcId 173770 "SILK Chocolate, soymilk" — a chocolate soy DRINK, 58 kcal/100g
  // against real chips at ~490 — so the builder took that record's "1 cup" and
  // shipped 243 g/cup of soy milk as the weight of chocolate chips. Blocked here
  // until the table's identity is fixed; see the report. Candies, semisweet
  // chocolate (169592) publishes only bar/block portions, so USDA cannot answer
  // this one directly either, and a cup of chips stays honestly unsourced.
  ["chocolate", "dark chocolate", "Candies, dark chocolate"],
  ["bean sprouts", "bean sprouts", "Mung beans, mature seeds, sprouted, raw"],
  ["broad beans", "broad beans", "Broad beans (fava beans), mature seeds, raw"],
  ["green beans", "green beans", "Beans, snap, green, raw"],
  ["kidney beans", "kidney beans", "Beans, kidney, red, mature seeds, raw"],
  ["cannellini beans", "cannellini beans", "Beans, white, mature seeds, raw"],
  ["navy beans", "navy beans", "Beans, navy, mature seeds, raw"],
  ["black beans", "black beans", "Beans, black, mature seeds, raw"],
  ["lima beans", "lima beans", "Lima beans, large, mature seeds, raw"],
  ["cornmeal", "cornmeal", "Cornmeal, whole-grain, yellow"],
  ["jam", "jam", "Jams and preserves"],
  ["banana", "banana", "Bananas, raw"],
  ["mango", "mango", "Mangos, raw"],
  ["avocado", "avocado", "Avocados, raw, all commercial varieties"],
  ["pumpkin puree", "pumpkin puree", "Pumpkin, canned, without salt"],
  ["sauerkraut", "sauerkraut", "Sauerkraut, canned, solids and liquids"],
  ["olives", "black olives", "Olives, ripe, canned (small-extra large)"],
  ["capers", "capers", "Capers, canned"],
  ["tofu", "tofu", "Tofu, raw, firm, prepared with calcium sulfate"],
  ["quinoa", "quinoa", "Quinoa, uncooked"],
  ["buckwheat", "buckwheat", "Buckwheat"],
  ["shrimp", "prawns", "Crustaceans, shrimp, mixed species, raw"],
  ["cucumber", "cucumber", "Cucumber, with peel, raw"],
  ["scallions", "spring onions", "Onions, spring or scallions (includes tops and bulb), raw"],
  ["prunes", "prunes", "Plums, dried (prunes), uncooked"],
  ["tahini", "tahini", "Seeds, sesame butter, tahini"],
  ["mustard", "mustard", "Mustard, prepared, yellow"],
  ["sun-dried tomatoes", "sun-dried tomatoes", "Tomatoes, sun-dried"],
  ["yucca", "cassava", "Cassava, raw"],
  ["celeriac", "celeriac", "Celeriac, raw"],
  ["swede", "swede", "Rutabagas, raw"],
  ["radish", "radish", "Radishes, oriental, raw"],
  ["grits", "grits", "Cereals, corn grits, yellow, regular and quick, unenriched, dry"],
  ["tapioca", "tapioca", "Tapioca, pearl, dry"],
  ["queso fresco", "queso fresco", "Cheese, queso fresco"],
  ["beer", "beer", "Alcoholic beverage, beer, regular, all"],

  // Names the nutrition parser matches by SUFFIX, which the existing keys did
  // not cover — each was caught by diffing every corpus line old-vs-new, and
  // each was landing on a wrong-but-plausible row:
  //   "powdered sugar"  → "sugar" (188 g/cup granulated) instead of 120
  //   "condensed milk"  → "milk"  (244 g/cup) instead of 306
  //   "coconut milk"    → "milk"  (244 g/cup) instead of 226
  //   "peanut butter"   → "butter" (227 g/cup) instead of 258
  // Same USDA records as their synonyms above where one already existed; a key
  // is an alias, never a second opinion.
  ["powdered sugar", "icing sugar", "Sugars, powdered", /^1 cup unsifted$/i],
  ["confectioners sugar", "icing sugar", "Sugars, powdered", /^1 cup unsifted$/i],
  ["condensed milk", "condensed milk", "Milk, canned, condensed, sweetened"],
  ["evaporated milk", "evaporated milk", "Milk, canned, evaporated"],
  ["coconut milk", "coconut milk", "Nuts, coconut milk, canned (liquid expressed from grated meat and water)"],
  ["coconut cream", "coconut cream", "Nuts, coconut cream, canned, sweetened"],
  ["peanut butter", "peanut butter", "Peanut butter, smooth style, with salt"],
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
    if (!relatesTo(info.description, name, query || "")) {
      seen.push(`${cand.fdcId} unrelated: ${info.description}`);
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
