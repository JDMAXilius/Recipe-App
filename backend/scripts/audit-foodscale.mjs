// Line-level audit of the weight-first display against the REAL seed corpus
// (TERMINAL_TICKET_WEIGHT_FIRST Tasks 1 + 3). Reads the cached TheMealDB
// dump in scripts/corpus/*.json — no network — and runs every
// strMeasureN/strIngredientN pair through mobile/lib/foodScale.js.
//
//   node backend/scripts/audit-foodscale.mjs            # both reports
//   node backend/scripts/audit-foodscale.mjs --cross    # density cross-check only
//
// Report 1: kind distribution, fall-through lines, sanity outliers, heaviest.
// Report 2: display grams vs the nutrition pipeline's grams (two density
//           tables that must not drift — see ticket Task 3).
import { readdirSync, readFileSync } from "node:fs";
import { formatIngredientLine, resolveAmount } from "../../mobile/lib/foodScale.js";
import { parseMeasure } from "../../mobile/lib/ingredientParser.js";
import { parseIngredientLine } from "../src/lib/nutrition/parseIngredient.js";

const CORPUS = new URL("./corpus/", import.meta.url);
const files = readdirSync(CORPUS).filter((f) => f.endsWith(".json"));
if (!files.length) {
  console.error("No corpus. Fetch it first:\n  for l in {a..z}; do curl -s \\\n    \"https://www.themealdb.com/api/json/v1/1/search.php?f=$l\" > backend/scripts/corpus/$l.json; sleep 1; done");
  process.exit(1);
}

const lines = [];
const seenMeals = new Set();
for (const f of files) {
  const { meals } = JSON.parse(readFileSync(new URL(f, CORPUS), "utf8"));
  for (const meal of meals || []) {
    if (seenMeals.has(meal.idMeal)) continue;
    seenMeals.add(meal.idMeal);
    for (let i = 1; i <= 20; i++) {
      const name = (meal[`strIngredient${i}`] || "").trim();
      const measure = (meal[`strMeasure${i}`] || "").trim();
      if (!name) continue;
      lines.push({ meal: meal.strMeal, name, measure });
    }
  }
}

const grams = (r) => (r.kind === "weight" ? parseFloat(r.display) : null);
const ml = (r) => (r.kind === "volume-ml" ? parseFloat(r.display) : null);

for (const l of lines) l.r = formatIngredientLine(l.measure, l.name);

// ---------------------------------------------------------------------------
// Report 1 — coverage + sanity
function coverage() {
  const byKind = {};
  for (const l of lines) byKind[l.r.kind] = (byKind[l.r.kind] || 0) + 1;
  const pct = (n) => `${((n / lines.length) * 100).toFixed(1)}%`;

  console.log(`\n=== LINE-LEVEL COVERAGE — ${seenMeals.size} recipes, ${lines.length} ingredient lines ===`);
  for (const [k, n] of Object.entries(byKind).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(11)} ${String(n).padStart(5)}  ${pct(n)}`);
  }
  const measured = (byKind.weight || 0) + (byKind["volume-ml"] || 0);
  console.log(`  → measured (g/ml): ${measured} / ${lines.length} = ${pct(measured)}`);

  // Fall-throughs: kept their raw count/volume. Not wrong, just unweighed.
  for (const kind of ["count", "volume-us"]) {
    const group = {};
    for (const l of lines.filter((x) => x.r.kind === kind)) {
      (group[l.name] ||= []).push(l.measure || "(blank)");
    }
    const rows = Object.entries(group).sort((a, b) => b[1].length - a[1].length);
    console.log(`\n--- fell through as "${kind}": ${rows.length} distinct names, ${(byKind[kind] || 0)} lines ---`);
    for (const [name, ms] of rows.slice(0, 25)) {
      console.log(`  ${String(ms.length).padStart(4)}x ${name.padEnd(28)} e.g. "${ms[0]}"`);
    }
    if (rows.length > 25) console.log(`  … ${rows.length - 25} more`);
  }

  // Sanity outliers — a confident wrong number is worse than no number.
  const heavy = lines.filter((l) => grams(l.r) > 2000);
  const wet = lines.filter((l) => ml(l.r) > 2000);
  console.log(`\n--- outliers: ${heavy.length} lines > 2 kg, ${wet.length} lines > 2 l ---`);
  for (const l of [...heavy, ...wet].sort((a, b) => parseFloat(b.r.display) - parseFloat(a.r.display)).slice(0, 30)) {
    console.log(`  ${l.r.display.padStart(10)}  "${l.measure}" ${l.name}   [${l.meal}]`);
  }

  // Heaviest per distinct ingredient — eyeball against reality.
  const maxByName = {};
  for (const l of lines) {
    const g = grams(l.r);
    if (g != null && g > (maxByName[l.name]?.g ?? -1)) maxByName[l.name] = { g, l };
  }
  console.log(`\n--- heaviest single line per ingredient (top 30) ---`);
  for (const [, { g, l }] of Object.entries(maxByName).sort((a, b) => b[1].g - a[1].g).slice(0, 30)) {
    console.log(`  ${String(g).padStart(8)} g  "${l.measure}" ${l.name}   [${l.meal}]`);
  }
}

// ---------------------------------------------------------------------------
// Report 2 — the two density tables, compared on real lines (ticket Task 3).
// foodScale.js powers the DISPLAY, parseIngredient.js powers the CALORIES.
// Where they disagree, one of the two is lying to the user.
function crossCheck() {
  const diffs = [];
  for (const l of lines) {
    const mine = grams(l.r);
    if (mine == null) continue;
    const theirs = parseIngredientLine({ measure: l.measure, name: l.name }).grams;
    if (theirs == null) continue;
    const delta = Math.abs(mine - theirs) / Math.max(mine, theirs);
    if (delta > 0.25) diffs.push({ ...l, mine, theirs, delta });
  }
  // Group by ingredient: one table row is usually behind many lines.
  const group = {};
  for (const d of diffs) (group[d.name] ||= []).push(d);
  const rows = Object.entries(group).sort((a, b) => b[1].length - a[1].length);

  console.log(`\n=== DENSITY CROSS-CHECK — display vs nutrition, >25% apart ===`);
  console.log(`  ${diffs.length} lines across ${rows.length} ingredients`);
  for (const [name, ds] of rows) {
    const w = ds[0];
    console.log(
      `  ${String(ds.length).padStart(4)}x ${name.padEnd(26)} "${w.measure}" → display ${w.mine} g vs nutrition ${w.theirs} g  (${(w.delta * 100).toFixed(0)}%)`
    );
  }
}

const only = process.argv[2];
if (only !== "--cross") coverage();
if (only !== "--coverage") crossCheck();
