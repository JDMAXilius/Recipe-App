// Verify Otto's bare-count piece weights ("1 onion", "2 cloves garlic") against
// USDA FoodData Central's OWN foodPortions records, and emit pieceWeights.json
// with full provenance.
//
// Why this exists: the piece weights were sourced by hand and flagged "approx",
// which the confidence formula scores as a guess. But USDA publishes the very
// same measurement — "1 medium (2-1/2\" dia) = 110 g" for onion — so a weight
// that MATCHES a USDA portion record carries the same authority as the calories
// we already trust from that food. Verified rows earn high confidence; anything
// USDA can't confirm keeps its estimate flag. That distinction is the whole
// point: this file is provenance, not a rubber stamp.
//
//   USDA_API_KEY=... node scripts/build-piece-weights.mjs
//   ... --dry     # report only, don't write
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { portions, search, sleep } from "./usdaClient.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const nutritionDir = path.join(here, "..", "src", "lib", "nutrition");
const table = JSON.parse(fs.readFileSync(path.join(nutritionDir, "usdaTable.json"), "utf8"));
const KEY = process.env.USDA_API_KEY;
if (!KEY) throw new Error("USDA_API_KEY required");

// The count-vocabulary Otto actually meets, from the corpus audit. `portion`
// is the USDA foodPortion wording we expect to find; `unit` marks piece nouns
// ("clove", "stalk") vs a bare count of the whole item.
const TARGETS = [
  { name: "onion", key: "onions", portion: /^1 medium/i },
  { name: "red onion", key: "red onions", portion: /^1 medium/i, query: "Onions, raw" },
  { name: "spring onion", key: "spring onions", portion: /1 (medium|small|whole|stalk)/i },
  { name: "scallion", key: "scallions", portion: /1 (medium|small|whole|stalk)/i },
  // USDA publishes no whole-shallot portion (only "1 tbsp chopped", a volume).
  // Left out on purpose so the 30 g EACH_G estimate keeps saying it is an estimate.
  { name: "garlic", key: null, portion: /^1 clove$/i, unit: "clove", query: "Garlic, raw" },
  { name: "egg", key: "eggs", portion: /1 large/i },
  { name: "egg yolk", key: "egg yolks", portion: /1 large/i },
  { name: "egg white", key: "egg whites", portion: /1 large/i },
  { name: "carrot", key: "carrots", portion: /1 medium/i },
  { name: "potato", key: "potatoes", portion: /1 Potato medium/i },
  { name: "tomato", key: "tomatoes", portion: /1 medium/i },
  { name: "lemon", key: "lemon", portion: /1 (medium|fruit|each)/i },
  { name: "lime", key: "lime", portion: /1 (medium|fruit|each)/i },
  { name: "celery", key: "celery", portion: /1 stalk/i, unit: "stalk" },
  { name: "green pepper", key: "green pepper", portion: /1 medium/i },
  { name: "red pepper", key: "red pepper", portion: /1 medium/i },
  { name: "bacon", key: "bacon", portion: /1 slice/i, unit: "slice" },
  { name: "coriander", key: "coriander", portion: /^9 sprigs$/i, each: 9 },
  { name: "parsley", key: "parsley", portion: /^10 sprigs$/i, each: 10 },
  { name: "cucumber", key: "cucumber", portion: /1 (medium|large)/i },
  { name: "banana", key: "banana", portion: /1 medium/i },
  { name: "orange", key: "orange", portion: /1 (medium|fruit)/i },
  { name: "apple", key: "apples", portion: /1 medium/i },
  { name: "mushroom", key: "mushrooms", portion: /1 (medium|whole|piece)/i },
  { name: "leek", key: "leek", portion: /1 leek|1 medium/i },
  { name: "cabbage", key: "cabbage", portion: /1 head/i },
  { name: "lettuce", key: "lettuce", portion: /1 head/i },
  { name: "beetroot", key: "beetroot", portion: /1 beet/i },
  { name: "bread", key: "bread", portion: /1 slice/i, unit: "slice" },
  { name: "chilli", key: "chilli", portion: /1 pepper/i },
  { name: "jalapeno", key: "jalapeno", portion: /1 pepper/i },
  { name: "scotch bonnet", key: "scotch bonnet", portion: /1 pepper/i },
  { name: "zucchini", key: "zucchini", portion: /1 (medium|large)/i },
  { name: "courgette", key: "courgettes", portion: /1 (medium|large)/i },
  { name: "aubergine", key: "aubergine", portion: /1 eggplant|1 (medium|whole)/i },
  { name: "sweet potato", key: "sweet potatoes", portion: /1 (medium|sweetpotato|potato)/i },
];

const dest = path.join(nutritionDir, "pieceWeights.json");
// Merge, never clobber: build-item-weights.mjs writes whole-item rows into the
// same file and both scripts are re-runnable.
const out = fs.existsSync(dest) ? JSON.parse(fs.readFileSync(dest, "utf8")) : {};
const misses = [];
for (const t of TARGETS) {
  // Candidate records to try, in order: the table's own row first, then any
  // search hits. USDA often files the SAME food twice — a Foundation record
  // with only "1 RACC" and an SR Legacy one carrying the real cook's portions
  // ("1 clove = 3 g" for garlic). Taking the first hit silently loses the
  // portion, so we keep walking until a record actually HAS the measurement.
  const tried = [];
  const candidates = [];
  const tableRowFor = table[t.key] || table[t.name];
  if (tableRowFor?.fdcId) candidates.push({ fdcId: tableRowFor.fdcId, usda: tableRowFor.usda });
  if (t.query) {
    try {
      for (const f of await search(t.query)) candidates.push({ fdcId: f.fdcId, usda: f.description });
    } catch { /* table row may still work */ }
    await sleep(1100);
  }
  if (!candidates.length) {
    misses.push(`${t.name}: no fdcId in usdaTable (key "${t.key}") and no query given`);
    continue;
  }
  let row = null;
  let info = null;
  let hit = null;
  for (const cand of candidates.slice(0, 4)) {
    let got;
    try {
      got = await portions(cand.fdcId);
    } catch (e) {
      tried.push(`${cand.fdcId} fetch failed`);
      continue;
    }
    await sleep(1100);
    const found = got.list.find((p) => t.portion.test(p.label) && p.grams > 0);
    tried.push(`${cand.fdcId} [${got.list.map((p) => p.label).join(", ") || "no portions"}]`);
    if (found) {
      row = cand;
      info = got;
      hit = found;
      break;
    }
  }
  if (!row) {
    misses.push(`${t.name}: no portion matching ${t.portion} in any candidate — ${tried.join(" ;; ")}`);
    continue;
  }
  if (!hit) {
    misses.push(`${t.name}: no portion matching ${t.portion} — had [${info.list.map((p) => p.label).join(" | ")}]`);
  } else {
    out[t.name] = {
      grams: t.each ? Math.round((hit.grams / t.each) * 10) / 10 : hit.grams,
      unit: t.unit || null,
      fdcId: row.fdcId,
      usda: info.description,
      portion: hit.label,
      source: "usda-foodportion",
    };
    console.log(`✓ ${t.name.padEnd(20)} ${String(hit.grams).padStart(6)} g  (${hit.label} — ${info.description})`);
  }
  await sleep(1200);
}

console.log(`\nverified ${Object.keys(out).length}/${TARGETS.length}`);
if (misses.length) console.log("UNVERIFIED (keep estimate flag):\n  " + misses.join("\n  "));

if (!process.argv.includes("--dry")) {
  fs.writeFileSync(dest, JSON.stringify(out, null, 2) + "\n");
  console.log(`\nwrote ${dest}`);
}
