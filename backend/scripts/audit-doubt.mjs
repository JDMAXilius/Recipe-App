// Throwaway audit — founder directive 2026-07-21: "confidence as high as
// possible". Replays the provider's confidence formula over the cached corpus
// DETERMINISTICALLY (no Claude, no network) to find which unmatched ingredient
// names cost the most confidence. Output: confidence distribution + ranked
// unmatched names. Delete when the framework ticket closes.
// Run from backend/:  node scripts/audit-doubt.mjs
// ponytail: cooked-state nuance skipped — cooked lines resolve via Claude at
// runtime and score "guessed" either way; this audit only ranks table gaps.
import { readdirSync, readFileSync } from "node:fs";
import { parseIngredientLine } from "../src/lib/nutrition/parseIngredient.js";
import { lookup, isNegligible } from "../src/lib/nutrition/usdaProvider.js";

const CORPUS = new URL("./corpus/", import.meta.url);
const recipes = [];
const seen = new Set();
for (const f of readdirSync(CORPUS).filter((f) => f.endsWith(".json"))) {
  const { meals } = JSON.parse(readFileSync(new URL(f, CORPUS), "utf8"));
  for (const meal of meals || []) {
    if (seen.has(meal.idMeal)) continue;
    seen.add(meal.idMeal);
    const lines = [];
    for (let i = 1; i <= 20; i++) {
      const name = (meal[`strIngredient${i}`] || "").trim();
      const measure = (meal[`strMeasure${i}`] || "").trim();
      if (name) lines.push({ name, measure });
    }
    recipes.push({ title: meal.strMeal, lines });
  }
}

const dist = { high: 0, medium: 0, low: 0 };
const missCount = new Map(); // unmatched name → # of lines
const missRecipes = new Map(); // unmatched name → # of distinct recipes

for (const r of recipes) {
  const rows = r.lines.map((l) => {
    const line = [l.measure, l.name].filter(Boolean).join(" ").trim();
    const parsed = parseIngredientLine(line);
    return { parsed, name: l.name, food: lookup(l.name, parsed.item, false) };
  });
  const scoredAll = rows.filter((x) => !isNegligible(x));
  const scored = scoredAll.length ? scoredAll : rows;
  const resolved = (x) => x.food && x.parsed.grams > 0;
  const unmatched = scored.filter((x) => !resolved(x));
  const guessed = scored.filter((x) => resolved(x) && x.parsed.confidence !== "high").length;
  const doubt = (unmatched.length + guessed * 0.5) / scored.length;
  dist[doubt <= 0.1 ? "high" : doubt <= 0.3 ? "medium" : "low"]++;
  const perRecipe = new Set();
  for (const u of unmatched) {
    // Two distinct diseases: no food row (table gap) vs no grams (parse gap).
    const k = `${u.food ? "GRAMS" : "TABLE"} ${u.name.toLowerCase()}${u.food ? ` [${r.lines.find((l) => l.name === u.name)?.measure ?? ""}]` : ""}`;
    missCount.set(k, (missCount.get(k) || 0) + 1);
    perRecipe.add(k);
  }
  for (const k of perRecipe) missRecipes.set(k, (missRecipes.get(k) || 0) + 1);
}

console.log(`deterministic confidence over ${recipes.length} recipes (no Claude):`);
console.log(dist);
console.log(`\ntop unmatched names (name · lines · recipes):`);
const top = [...missCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 50);
for (const [name, n] of top) console.log(`  ${name.padEnd(34)} ${String(n).padStart(3)}  ${missRecipes.get(name)}`);
console.log(`\ndistinct unmatched names: ${missCount.size}`);
