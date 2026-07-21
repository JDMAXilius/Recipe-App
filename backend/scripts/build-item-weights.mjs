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
// A STATE word means the portion was measured after a preparation that changes
// the mass ("1 cup sifted", "1 chicken, bone removed") — a different thing from
// the whole raw item the corpus counts.
const STATE = /\b(sifted|packed|cooked|chopped|diced|sliced|shredded|crumbled|stewed|drained|melted|removed)\b/i;
const WHOLE = [
  /^1 (medium|large|small)\b/i,
  /^1 (fruit|each|whole)\b/i,
  /^1 (fillet|chop|leg|thigh|breast|wing|drumstick|steak|link|patty|shank|lobster|muffin|pomegranate|avocado|beet|leek)\b/i,
  /^1 (piece|slice|leaf|stalk|clove|head|ear|sheet|almond|nut)\b/i,
  /^1 [a-z]+(?:\s*\(.*\))?$/i, // "1 beet", "1 pomegranate (4\" dia)"
];

// name = the pieceWeights key. verifiedPiece() singularises the ingredient text
// before matching, so keys are SINGULAR ("pork chop" matches "4 Pork Chops").
// key   = usdaTable key to take the fdcId from, when it differs from name.
// query = direct USDA search when the table has no usable row.
// fdcId = pinned record. Needed whenever the table's row is a nutrition PROXY
//         rather than the same physical object — the table's "chicken" is
//         ground chicken, which has no bird to weigh, and its "prunes" is prune
//         puree. Nutrition transfers by proxy; a piece weight does not.
// portion = required USDA wording, when the default WHOLE walk would pick the
//         wrong one. USDA lists sizes in arbitrary order, so without this a fig
//         silently became "1 large" (64 g) instead of the medium (50 g).
// each  = the portion covers N items ("6 medium" oysters); grams are divided.
const TARGETS = [
  { name: "ginger", query: "Ginger root, raw" },
  { name: "corn on the cob", key: "sweetcorn", query: "Corn, sweet, yellow, raw" },
  { name: "salmon" },
  { name: "cod" },
  { name: "mackerel" },
  { name: "herring" },
  { name: "trout" },
  { name: "sardines" },
  { name: "lobster" },
  { name: "radish" },
  { name: "mango" },
  { name: "strawberries" },
  { name: "pomegranate" },
  { name: "almonds" },
  { name: "swede", query: "Rutabagas, raw" },
  { name: "broccoli" },
  { name: "chicken wings", query: "Chicken, broilers or fryers, wing, meat and skin, raw" },
  { name: "coconut", query: "Nuts, coconut meat, raw" },

  // 2026-07-21 bare-count sweep. Each of these is a corpus line that resolved
  // to NO grams ("4 Pork Chops", "8 Oysters") — dropped from the sum AND
  // counted as doubt, so it hit the recipe's confidence twice.
  { name: "chicken", fdcId: 171047, portion: /^1 chicken$/i }, // whole bird
  { name: "pork chop", key: "pork chops", portion: /^1 chop without refuse/i },
  { name: "chicken drumstick", fdcId: 172373, portion: /^1 drumstick$/i },
  { name: "sweetcorn", fdcId: 169998, portion: /^1 ear, medium/i },
  { name: "dried apricot", key: "dried apricots", portion: /^1 half$/i },
  { name: "filo pastry", fdcId: 172791, portion: /^1 sheet dough$/i },
  { name: "phyllo dough", fdcId: 172791, portion: /^1 sheet dough$/i },
  // USDA's shrimp sizes stop at "large" (7 g). King/tiger prawns are a size
  // variant above that, so they are deliberately absent — see the report.
  { name: "prawn", fdcId: 174210, portion: /^1 medium$/i },
  { name: "shrimp", fdcId: 174210, portion: /^1 medium$/i },
  { name: "oyster", fdcId: 171978, portion: /^6 medium$/i, each: 6 },
  { name: "fig", key: "figs", portion: /^1 medium/i },
  { name: "prune", fdcId: 168162, portion: /^1 prune, pitted$/i },
  { name: "turnip", key: "turnips", portion: /^1 medium$/i },
  { name: "black olive", fdcId: 169094, portion: /^1 large$/i },
  { name: "english muffin", fdcId: 172828, portion: /^1 muffin$/i },
  { name: "taco shell", fdcId: 172800, portion: /^1 shell$/i },
  { name: "peaches", fdcId: 325415, portion: /^1 medium/i },
  { name: "pear", fdcId: 167776, portion: /^1 medium$/i },
];

// DELIBERATELY ABSENT (checked, USDA publishes no usable whole-item portion —
// the line keeps its estimate and its honest "medium" flag rather than a guess):
//   lamb leg / lamb loin chops / lamb shanks / lamb kidney / pigs trotters /
//     beef brisket — oz, lb, "1 serving", or a per-pound cooked yield only.
//   duck legs — only "1 leg, bone removed (yield after cooking)", a cooked mass.
//   sirloin steak — "1 steak" is 608 g (a whole retail top sirloin); the corpus
//     means a sandwich slice ("8 Sirloin steak"), so the record is the wrong
//     physical object, not just the wrong size.
//   beef cutlet — the table's proxy is a 344 g top round steak, not a cutlet.
//   king/tiger prawns — USDA's largest shrimp portion is "4 large" (7 g each);
//     a king prawn is a size ABOVE the record, so it must not inherit it.
//   salmon / pork — "0.5 fillet" (a whole side) and "1 roast"; the corpus
//     count ("2 Salmon", "2 Pork") means neither.
//   walnuts / parsnips / celeriac / bay leaf / cloves / cardamom / star anise —
//     cup or tsp/tbsp only. Bay leaf alone is 60 corpus lines; USDA publishes
//     only "1 tsp, crumbled", so it stays unresolved.
//   tofu — "0.25 block"; block size is not a defined quantity.
//   asparagus — "1 spear, medium" exists, but "1 Asparagus" in the corpus is
//     as likely to mean a bunch as a spear.
//   breadfruit — only "0.25 fruit, small"; scaling a quarter of a SMALL fruit
//     up to a generic one compounds two assumptions.
//   gelatine leafs / rice paper sheets / meringue nests — no USDA portion.

const out = { ...existing };
const unresolved = [];

for (const t of TARGETS) {
  const { name, key: tableKey, query } = t;
  if (out[name]) continue;
  let fdcId = t.fdcId ?? table[tableKey || name]?.fdcId;
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
  const candidates = info.list.filter((p) => !MEASURE.test(p.label) && !STATE.test(p.label));
  let hit = null;
  if (t.portion) {
    hit = candidates.find((p) => t.portion.test(p.label));
  } else {
    for (const pat of WHOLE) {
      hit = candidates.find((p) => pat.test(p.label));
      if (hit) break;
    }
  }
  if (!hit) {
    unresolved.push(`${name}: no whole-item portion — had [${info.list.map((p) => p.label).join(" | ") || "none"}]`);
  } else {
    out[name] = {
      grams: t.each ? Math.round((hit.grams / t.each) * 10) / 10 : hit.grams,
      unit: null,
      fdcId,
      usda: info.description || desc,
      portion: hit.label,
      source: "usda-foodportion",
    };
    console.log(`✓ ${name.padEnd(22)} ${String(out[name].grams).padStart(6)} g  (${hit.label} — ${info.description})`);
  }
  await sleep(1100);
}

console.log(`\nresolved ${Object.keys(out).length - Object.keys(existing).length} new (${Object.keys(out).length} total)`);
if (unresolved.length) console.log(`\nUNRESOLVED — need a decision, not a guess (${unresolved.length}):\n  ` + unresolved.join("\n  "));

if (!process.argv.includes("--dry")) {
  fs.writeFileSync(dest, JSON.stringify(out, null, 2) + "\n");
  console.log(`\nwrote ${dest}`);
}
