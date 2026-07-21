// Why is a recipe's nutrition confidence low? Decomposes the doubt score the
// way usdaProvider does — deterministic path only (no Claude, no network) —
// over the cached TheMealDB corpus, and ranks the ingredient lines actually
// responsible. Answers "what would it take to move recipes to high".
//
//   node scripts/audit-confidence.mjs            # summary + top offenders
//   node scripts/audit-confidence.mjs --lines    # also dump the worst raw lines
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseIngredientLine } from "../src/lib/nutrition/parseIngredient.js";
import { lookup, isNegligible } from "../src/lib/nutrition/usdaProvider.js";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "corpus");
const recipes = [];
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
  const j = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  recipes.push(...(j.meals || []));
}

const unmatchedNames = new Map(); // name → count (dropped from the sum entirely)
const guessedNames = new Map(); // name → count (in the sum, grams estimated)
const buckets = { high: 0, medium: 0, low: 0 };
// If every "guessed" line became a direct high-confidence hit, where would we land?
const bucketsIfGuessFixed = { high: 0, medium: 0, low: 0 };
const bucketsIfMatchFixed = { high: 0, medium: 0, low: 0 };
const lowRecipes = [];

const band = (d) => (d <= 0.1 ? "high" : d <= 0.3 ? "medium" : "low");

for (const m of recipes) {
  const rows = [];
  for (let i = 1; i <= 20; i++) {
    const measure = (m["strMeasure" + i] || "").trim();
    const name = (m["strIngredient" + i] || "").trim();
    if (!name) continue;
    const parsed = parseIngredientLine({ measure, name });
    const food = lookup(name, parsed.item, false);
    rows.push({ name, measure, parsed, food });
  }
  if (!rows.length) continue;
  const counted = rows.filter((r) => !isNegligible(r));
  const scored = counted.length ? counted : rows;
  const resolved = (r) => r.food && r.parsed.grams > 0;

  const unmatched = scored.filter((r) => !resolved(r));
  const guessed = scored.filter((r) => resolved(r) && r.parsed.confidence !== "high");
  for (const r of unmatched) unmatchedNames.set(r.name, (unmatchedNames.get(r.name) || 0) + 1);
  for (const r of guessed) guessedNames.set(r.name, (guessedNames.get(r.name) || 0) + 1);

  const doubt = (unmatched.length + guessed.length * 0.5) / scored.length;
  const b = band(doubt);
  buckets[b] += 1;
  // counterfactuals: what each class of fix alone would buy
  bucketsIfGuessFixed[band(unmatched.length / scored.length)] += 1;
  bucketsIfMatchFixed[band((guessed.length * 0.5) / scored.length)] += 1;
  if (b === "low") {
    lowRecipes.push({
      meal: m.strMeal,
      doubt: +doubt.toFixed(2),
      unmatched: unmatched.map((r) => r.name),
      guessed: guessed.map((r) => `${r.measure} ${r.name}`),
    });
  }
}

const pct = (n) => ((n / recipes.length) * 100).toFixed(1) + "%";
console.log(`corpus: ${recipes.length} recipes (deterministic path, no Claude)\n`);
console.log("current:", JSON.stringify(buckets), `→ high ${pct(buckets.high)}`);
console.log(
  "if EVERY guessed-gram line became exact:",
  JSON.stringify(bucketsIfGuessFixed),
  `→ high ${pct(bucketsIfGuessFixed.high)}`
);
console.log(
  "if EVERY unmatched line found a food:  ",
  JSON.stringify(bucketsIfMatchFixed),
  `→ high ${pct(bucketsIfMatchFixed.high)}`
);

const top = (map, n) =>
  [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${v}× ${k}`);
console.log("\ntop UNMATCHED ingredients (line dropped, total understated):");
console.log("  " + top(unmatchedNames, 25).join("\n  "));
console.log("\ntop GUESSED-GRAM ingredients (in the sum, weight estimated):");
console.log("  " + top(guessedNames, 25).join("\n  "));

if (process.argv.includes("--lines")) {
  console.log("\nworst low-confidence recipes:");
  for (const r of lowRecipes.sort((a, b) => b.doubt - a.doubt).slice(0, 15)) {
    console.log(`  ${r.doubt} ${r.meal}`);
    if (r.unmatched.length) console.log(`      unmatched: ${r.unmatched.join(", ")}`);
    if (r.guessed.length) console.log(`      guessed:   ${r.guessed.join(", ")}`);
  }
}
