// Find usdaTable rows whose KEY and USDA RECORD describe different foods.
//
// The provenance audit (audit-table-provenance.mjs) checks that an fdcId
// resolves and that the stored numbers match the live record. It cannot catch a
// row that is internally consistent but simply WRONG: "red chilli powder"
// pointing at "Sugars, powdered" has a valid id and correct sugar numbers.
//
// This audit compares meanings instead. It emerged from the bulk-portion work
// (REDESIGN_NOTES Phase 21), which kept surfacing these as a side effect, and
// it found: green chilli → BEET GREENS, red chilli → RED CABBAGE, red chilli
// powder → POWDERED SUGAR, oysters → EMU, cherry → Surinam cherry.
//
// It is a DETECTOR, not a fixer — many mismatches are legitimate proxies
// ("morning glory" honestly borrows spinach's numbers). Output is ranked so a
// human reads the worst first.
//
//   node scripts/audit-key-vs-record.mjs [--all]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const table = JSON.parse(
  fs.readFileSync(path.join(here, "..", "src", "lib", "nutrition", "usdaTable.json"), "utf8")
);

// Words that carry no identity, so their presence/absence proves nothing.
const STOP = new Set([
  "raw","fresh","whole","the","and","with","without","year","round","average","all","commercial",
  "varieties","includes","commercially","prepared","plain","unprepared","type","types","food","foods",
  "usda","distribution","program","nfs","ns","from","for","into","cut","new","large","small","medium",
  "baby","free","range","organic","unsalted","salted","mixed","species","seeds","seed","dry","dried",
  "ground","chopped","sliced","canned","frozen","cooked","boiled","drained","added","salt","water",
]);
const words = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w))
    .map((w) => (w.endsWith("ies") ? w.slice(0, -3) + "y" : w.endsWith("es") ? w.slice(0, -2) : w.endsWith("s") ? w.slice(0, -1) : w));

const findings = [];
for (const [key, row] of Object.entries(table)) {
  if (!row?.usda) continue;
  const k = words(key);
  const d = words(row.usda);
  if (!k.length || !d.length) continue;
  const dSet = new Set(d);
  const shared = k.filter((w) => dSet.has(w));
  if (shared.length) continue; // some identity word in common — plausible

  // Nothing in common at all. Rank by how load-bearing the row is: a wildly
  // different calorie count is a louder signal than a near-miss.
  findings.push({ key, usda: row.usda, kcal: row.kcal, primary: d.slice(0, 2).join(" ") });
}

findings.sort((a, b) => (b.kcal ?? 0) - (a.kcal ?? 0));
const show = process.argv.includes("--all") ? findings : findings.slice(0, 40);

console.log(`${findings.length} of ${Object.keys(table).length} rows share NO identity word with their USDA record.`);
console.log("Many are legitimate proxies (morning glory → spinach). Read for genuine mismatches.\n");
for (const f of show) {
  console.log(`  ${f.key.padEnd(30)} → ${f.usda} (${f.kcal} kcal)`);
}
if (show.length < findings.length) console.log(`\n…and ${findings.length - show.length} more (--all)`);
