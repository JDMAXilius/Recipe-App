// Per-recipe nutrition breakdown — see WHY a recipe's calories land where they do.
//
// The nutrition total for a recipe is grams × per-100g / 100, summed, ÷ servings.
// When a total looks "too high", it is almost never the per-100g value — it is one
// ingredient over-weighted, a cooking medium (oil) counted whole, a wrong/fatty
// match, or a wrong serving count. This tool shows each ingredient's contribution
// so the culprit line is obvious. Feeds tickets T1/T2/T5 (docs/tickets/NUTRITION_ACCURACY.md).
//
// Run (needs the TS loader the test suite uses):
//   node --experimental-strip-types --import src/features/nutrition/engine/ts-ext-resolve.mjs \
//        tools/nutrition-breakdown.mjs "<recipe id or name>"
//   ...same... tools/nutrition-breakdown.mjs --sweep [--top N]     # rank every seed recipe by over-count suspicion
// Or via the npm script:
//   npm run nutrition:breakdown -- "Irish stew"
//   npm run nutrition:breakdown -- --sweep --top 20
import { parseIngredientLine } from "../src/features/nutrition/engine/parse.ts";
import { lookup } from "../src/features/nutrition/engine/lookup.ts";
import { computeNutrition } from "../src/features/nutrition/engine/compute.ts";
import facts from "../src/features/nutrition/engine/data/recipeFacts.json" with { type: "json" };

const API = "https://www.themealdb.com/api/json/v1/1";
const OIL = /\boils?\b|\bghee\b|\blard\b|\bshortening\b|\bbutter\b|\bmargarine\b|\bdripping\b/i;

const byId = async (id) => (await (await fetch(`${API}/lookup.php?i=${id}`)).json()).meals?.[0] ?? null;
const byName = async (n) => (await (await fetch(`${API}/search.php?s=${encodeURIComponent(n)}`)).json()).meals?.[0] ?? null;
async function allMeals() {
  // No "all" endpoint — iterate the first-letter search a–z.
  const out = [];
  for (const c of "abcdefghijklmnopqrstuvwxyz") {
    const j = await (await fetch(`${API}/search.php?f=${c}`)).json();
    for (const m of j.meals ?? []) out.push(m);
  }
  return out;
}

function ingredientsOf(meal) {
  const out = [];
  for (let i = 1; i <= 20; i++) {
    const name = (meal[`strIngredient${i}`] || "").trim();
    const measure = (meal[`strMeasure${i}`] || "").trim();
    if (name) out.push({ measure, name });
  }
  return out;
}

function breakdown(meal) {
  const id = meal.idMeal;
  const ingredients = ingredientsOf(meal);
  const servings = Number(facts[id]?.servings) || 4;
  const curated = facts[id]?.servings != null;
  let total = 0;
  const rows = ingredients.map((p) => {
    const line = [p.measure, p.name].filter(Boolean).join(" ");
    const parsed = parseIngredientLine(line);
    const food = lookup(p.name, parsed.item, false);
    const kcal = food && parsed.grams ? (food.kcal * parsed.grams) / 100 : 0;
    if (food && parsed.grams) total += kcal;
    return { line, name: p.name, grams: parsed.grams, conf: parsed.confidence, per100: food?.kcal ?? null, kcal, usda: food?.usda ?? "— NO MATCH —", isOil: OIL.test(p.name) };
  });
  rows.sort((a, b) => b.kcal - a.kcal);
  for (const r of rows) {
    const f = [];
    if (r.usda === "— NO MATCH —") f.push("NO-MATCH");
    if (r.isOil && (r.grams ?? 0) >= 40) f.push("OIL-WHOLE?");   // likely a browning/frying medium counted whole (T1)
    if (total > 0 && r.kcal / total > 0.5) f.push("DOMINATES");
    if (r.conf === "low") f.push("LOW-CONF");
    r.flags = f;
  }
  const perServing = servings ? Math.round(total / servings) : null;
  const oilMediumKcal = rows.filter((r) => r.flags.includes("OIL-WHOLE?")).reduce((a, r) => a + r.kcal, 0);
  const engine = computeNutrition({ ingredients, servings, recipeId: id });
  return { id, name: meal.strMeal, servings, curated, total: Math.round(total), perServing, rows, ingredients, oilMediumShare: total ? oilMediumKcal / total : 0, engine };
}

function printBreakdown(b) {
  console.log(`\n${b.name}  (id ${b.id})   servings=${b.servings}${b.curated ? "" : " [engine default — no recipeFacts]"}`);
  console.log("─".repeat(96));
  for (const r of b.rows) {
    const flag = r.flags.length ? "  ⚑ " + r.flags.join(",") : "";
    console.log(`  ${String(Math.round(r.kcal)).padStart(5)} kcal │ ${String(r.grams ?? "—").padStart(6)}g ${r.conf.padEnd(6)} │ /100=${String(r.per100 ?? "—").padStart(4)} │ ${r.line.slice(0, 30).padEnd(31)} → ${r.usda.slice(0, 42)}${flag}`);
  }
  console.log("─".repeat(96));
  console.log(`  RAW SUM ${b.total} kcal ÷ ${b.servings} = ${b.perServing} kcal/serving`);
  console.log(`  ENGINE (with guards: frying-medium, coverage, plausibility): ${b.engine ? b.engine.kcal + " kcal/serving, confidence=" + b.engine.confidence : "null (honestly refused)"}`);
  if (b.oilMediumShare > 0.1) console.log(`  ⚑ ${Math.round(b.oilMediumShare * 100)}% of raw calories are oil/butter counted WHOLE — likely over-counted (ticket T1).`);
}

const args = process.argv.slice(2);
if (args[0] === "--sweep") {
  const topN = Number(args[args.indexOf("--top") + 1]) || 25;
  console.error("fetching all TheMealDB recipes (a–z)…");
  const meals = await allMeals();
  const rows = meals.map(breakdown);
  console.log(`\nSwept ${rows.length} recipes. Ranked by over-count suspicion.\n`);
  console.log("=== TOP: most calories from OIL/BUTTER counted whole (ticket T1) ===");
  for (const b of rows.filter((r) => r.oilMediumShare > 0).sort((a, b) => b.oilMediumShare - a.oilMediumShare).slice(0, topN))
    console.log(`  ${String(Math.round(b.oilMediumShare * 100)).padStart(3)}% oil-whole │ ${String(b.perServing).padStart(5)} kcal/serv │ ${b.name} (${b.id})`);
  console.log("\n=== HIGHEST kcal/serving (check for a wrong grams/match/serving) ===");
  for (const b of [...rows].filter((r) => r.perServing != null).sort((a, b) => b.perServing - a.perServing).slice(0, topN))
    console.log(`  ${String(b.perServing).padStart(5)} kcal/serv │ ${b.rows[0]?.flags.join(",") || "-"} │ top line: ${Math.round(b.rows[0]?.kcal || 0)} kcal ${b.rows[0]?.name} │ ${b.name} (${b.id})`);
} else {
  const q = args.join(" ").trim();
  if (!q) { console.error('Usage: nutrition-breakdown.mjs "<recipe id or name>"   |   --sweep [--top N]'); process.exit(2); }
  const meal = /^\d+$/.test(q) ? await byId(q) : await byName(q);
  if (!meal) { console.error(`No recipe found for "${q}".`); process.exit(1); }
  printBreakdown(breakdown(meal));
}
