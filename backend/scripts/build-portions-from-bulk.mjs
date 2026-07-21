// Build the shipped portion tables from the USDA FDC **bulk CSV** download
// instead of one API call per ingredient.
//
// WHY: the hand-built pieceWeights.json cost ~50 API round trips and covered 50
// foods. The SR Legacy bulk file carries portion rows for 524 of our 554 fdcIds
// (94.6%) — the same CC0 data, offline, in one pass, with no rate limit. This is
// the "FNDDS/bulk import" step from BACKEND_ROADMAP A5, done against SR Legacy
// because our table's fdcIds ALREADY point there: a direct join, no name
// matching, so none of the 73-79% entity-linking error applies.
//
// Setup (the zip is ~6 MB, CC0, not committed):
//   curl -o /tmp/sr.zip https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip
//   unzip -q /tmp/sr.zip -d /tmp/fdc
//   node scripts/build-portions-from-bulk.mjs --dir /tmp/fdc/FoodData_Central_sr_legacy_food_csv_2018-04
//
// ⚠️ Writes a REVIEW FILE (portion-candidates.json), not the shipped table.
//
// This was originally written to emit pieceWeights.json directly. It should not:
// four successive tightening rounds took the bad-row rate from ~30% to ~8% and
// it plateaued there, because USDA portion labels are heterogeneous and many of
// our table keys are nutritional proxies. Surviving failure modes, all of which
// LOOK right in a diff: "cherry tomatoes" inheriting a generic tomato (182 g vs
// ~17 g), "habanero pepper" inheriting a generic green chilli (45 g vs ~8 g),
// "chopped tomatoes" (a 400 g can in British recipes) reading as one tomato.
//
// Measured trade: +20 recipes to high (48.2% -> 50.8%) in exchange for ~8%
// silently-wrong weights. That is the wrong side of the honesty law — a "high"
// badge is worth having only because it is earned. So: this generates
// CANDIDATES, a human promotes them into pieceWeights.json.
//
// Its real payoff turned out to be as a DETECTOR: the mismatches exposed corrupt
// table identities ("oysters" pointed at Emu meat, 141 kcal -> real oyster 51).
// Re-run it after table edits and read the skip list.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const nutritionDir = path.join(here, "..", "src", "lib", "nutrition");
const argDir = process.argv.indexOf("--dir");
const dir = argDir > -1 ? process.argv[argDir + 1] : "/tmp/fdc/FoodData_Central_sr_legacy_food_csv_2018-04";
if (!fs.existsSync(path.join(dir, "food_portion.csv"))) {
  throw new Error(`no food_portion.csv in ${dir} — see the header of this file for the download command`);
}

// The FDC CSVs are quoted but contain no embedded newlines, so a line-wise
// split is safe here and avoids a dependency.
const parseCsv = (text) =>
  text
    .trim()
    .split("\n")
    .map((line) => {
      const out = [];
      let cur = "";
      let inQuotes = false;
      for (const ch of line) {
        if (ch === '"') inQuotes = !inQuotes;
        else if (ch === "," && !inQuotes) {
          out.push(cur);
          cur = "";
        } else cur += ch;
      }
      out.push(cur);
      return out;
    });

const units = new Map(
  parseCsv(fs.readFileSync(path.join(dir, "measure_unit.csv"), "utf8")).slice(1).map((r) => [r[0], r[1]])
);

const portionsByFdc = new Map();
for (const r of parseCsv(fs.readFileSync(path.join(dir, "food_portion.csv"), "utf8")).slice(1)) {
  const [, fdc, , amount, unitId, desc, modifier, grams] = r;
  const g = Number(grams);
  if (!(g > 0)) continue;
  const unitName = units.get(unitId);
  const label = [amount, unitName && unitName !== "undetermined" ? unitName : "", desc, modifier]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  if (!portionsByFdc.has(fdc)) portionsByFdc.set(fdc, []);
  portionsByFdc.get(fdc).push({ label, grams: g });
}

// ── Honesty guards, every one of which caught a real bad row when this data was
// pulled via the API (REDESIGN_NOTES Phase 19) ────────────────────────────────
// A volume/mass word means the portion is NOT one whole item: "1 cup" chopped
// onion is not an onion, and "1 tsp" ginger is not a ginger root.
const MEASURE =
  /\b(cups?|tsp|teaspoons?|tbsp|tablespoons?|oz|ounces?|lbs?|pounds?|g|grams?|kg|ml|l|liters?|litres?|serving|servings|racc|quarts?|pints?|block|dash|pinch|package|container|bottle|can|jar|box)\b/i;
// A state word changes what the measure means ("1 cup sifted" ≠ "1 cup").
const STATE = /sifted|whipped|melted|packed|pureed|mashed|cooked|drained|chopped|sliced|diced|grated|shredded|crumbled|ground|yield|prepared/i;
// The food itself is not the food we think it is.
const REJECT_FOOD = /substitute|imitation|artificial/i;

// ── The guard that matters most here ─────────────────────────────────────────
// Many usdaTable keys are NUTRITIONAL PROXIES: "almond flour" borrows the
// per-100g numbers of "Nuts, almonds", "morning glory" borrows spinach's.
// That is legitimate for nutrition — and WRONG for a portion. "1 almond" is not
// "1 almond flour"; "1 bunch" of spinach is not a bunch of morning glory; a
// fresh "1 pepper" (45 g) is not a dried chilli (0.5 g). Nutrition transfers by
// proxy, piece weight does not.
//
// So a bulk portion is only accepted when the key and the USDA description name
// the same physical object: the key's head noun must appear in the description.
// Processed-form words disqualify outright — a flour/powder/extract/jam has no
// countable piece even when its parent food does.
const PROCESSED = /\b(flour|powder|extract|essence|paste|jam|jelly|salt|sauce|puree|pur[ée]e|oil|milk|butter|meal|crumbs?|granules?|dried|ground|flaked|minced|shredded|desiccated|miniature|mini|wash|cube|stock|broth|rolled|ready)\b/i;
const STOPWORDS = new Set(["raw","fresh","whole","the","and","with","without","red","green","white","black","baby","large","small","medium","free","range","organic","plain","unsalted","salted","mixed","species","commercially","prepared","all","types","includes","seeds"]);
const headNouns = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
    .map((w) => (w.endsWith("es") ? w.slice(0, -2) : w.endsWith("s") ? w.slice(0, -1) : w));

function namesSamePhysicalThing(key, usdaDesc) {
  if (PROCESSED.test(key)) return false;
  const k = headNouns(key);
  const d = new Set(headNouns(usdaDesc));
  if (!k.length) return false;
  // The key's head noun must match the USDA description's PRIMARY food — its
  // first two significant words — not merely appear somewhere in it. USDA
  // descriptions are "primary, qualifier, qualifier": "Emu, oyster, raw" is emu
  // meat, not an oyster, and "Fast foods, taco with beef, cheese" is a whole
  // taco, not a shell. Matching a trailing word shipped both.
  const primary = new Set(headNouns(usdaDesc).slice(0, 2));
  return primary.has(k[k.length - 1]);
}

// Whole-item portion wordings, strongest preference first.
// A CLOSED vocabulary. The old catch-all /^1 [a-z]+$/ accepted "1 leaf" as a
// whole cabbage (23 g instead of ~900 g) and "1 kernel" as a whole pistachio.
// If USDA words a portion in a way not listed here, we do not guess.
const WHOLE = [
  /^1 (medium|large|small)\b/i,
  /^1 (fruit|each|whole)\b/i,
  /^1 (fillet|chop|leg|thigh|breast|wing|drumstick|steak|link|patty|shank|roast|liver|bird)\b/i,
  /^1 (potato|tomato|onion|carrot|pepper|beet|leek|avocado|banana|apple|orange|lemon|lime|mango|pomegranate|cucumber|eggplant|artichoke|parsnip|turnip|radish|shallot|sausage|tortilla|muffin|roll|bagel|pita)\b/i,
];
// Size-variant keys must not inherit the generic food's weight: "cherry
// tomatoes" (~17 g) shares a head noun with "Tomatoes, red, ripe" (182 g), a
// 10x error. If the key says small and the USDA record does not, reject.
const SIZE_VARIANT = /\b(cherry|baby|mini|miniature|little|small|dwarf|petite|new)\b/i;
// Piece nouns → the unit id parseIngredient canonicalises to.
const PIECE_UNITS = [
  [/^1 clove\b/i, "clove"],
  [/^1 (stalk|stick)\b/i, "stalk"],
  [/^1 slice\b/i, "slice"],
  [/^1 (head|bunch)\b/i, "head"],
];

const table = JSON.parse(fs.readFileSync(path.join(nutritionDir, "usdaTable.json"), "utf8"));
const shipped = path.join(nutritionDir, "pieceWeights.json");
const dest = path.join(here, "portion-candidates.json");
const existing = fs.existsSync(shipped) ? JSON.parse(fs.readFileSync(shipped, "utf8")) : {};
const out = { ...existing };

let added = 0;
let kept = 0;
const skipped = [];

for (const [name, row] of Object.entries(table)) {
  if (!row?.fdcId) continue;
  const list = portionsByFdc.get(String(row.fdcId));
  if (!list) continue;
  if (REJECT_FOOD.test(row.usda || "")) {
    skipped.push(`${name}: food rejected (${row.usda})`);
    continue;
  }
  if (SIZE_VARIANT.test(name) && !SIZE_VARIANT.test(row.usda || "")) {
    skipped.push(`${name}: size-variant key against a generic record ("${row.usda}") — weight would be off by multiples`);
    continue;
  }
  if (!namesSamePhysicalThing(name, row.usda || "")) {
    skipped.push(`${name}: proxy row, not the same object as "${row.usda}" — portion NOT transferable`);
    continue;
  }
  const clean = list.filter((p) => !MEASURE.test(p.label) && !STATE.test(p.label));
  if (!clean.length) continue;

  // A piece-noun row and a whole-item row are different facts; take both.
  let pieceHit = null;
  let pieceUnit = null;
  for (const [re, unit] of PIECE_UNITS) {
    const hit = clean.find((p) => re.test(p.label));
    if (hit) {
      pieceHit = hit;
      pieceUnit = unit;
      break;
    }
  }
  let wholeHit = null;
  for (const re of WHOLE) {
    wholeHit = clean.find((p) => re.test(p.label));
    if (wholeHit) break;
  }

  for (const [hit, unit] of [
    [wholeHit, null],
    [pieceHit, pieceUnit],
  ]) {
    if (!hit) continue;
    const key = unit ? `${name}::${unit}` : name;
    // Hand-verified rows win: they were checked against USDA's wording one at a
    // time and several encode a judgement the regexes above cannot make.
    if (existing[key] || (unit === null && existing[name])) {
      kept += 1;
      continue;
    }
    out[key] = {
      grams: hit.grams,
      unit,
      fdcId: row.fdcId,
      usda: row.usda,
      portion: hit.label,
      source: "usda-foodportion-bulk",
    };
    added += 1;
  }
}

// Keys are the food name, with a `name::unit` suffix when the same food also
// carries a piece-noun weight (celery: a whole head AND a stalk). verifiedPiece()
// splits on "::" when matching.
// Only the NEW rows are candidates; the shipped ones are already trusted.
const candidates = Object.fromEntries(
  Object.entries(out).filter(([, v]) => v.source === "usda-foodportion-bulk")
);
console.log(`${Object.keys(candidates).length} candidates for review (${kept} already shipped & hand-verified)`);
console.log("REVIEW EACH before promoting into pieceWeights.json — see this file's header for the known failure modes.");
if (skipped.length) console.log(`\nskipped (these often reveal corrupt table rows):\n  ${skipped.slice(0, 12).join("\n  ")}`);

if (!process.argv.includes("--dry")) {
  fs.writeFileSync(dest, JSON.stringify(candidates, null, 2) + "\n");
  console.log(`\nwrote ${dest} (review file — NOT shipped)`);
}
