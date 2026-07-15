// B1.5 — prove the nutrition pipeline against trusted vendor numbers.
// Pulls recipes WITH known-good nutrition from Spoonacular, runs OUR pipeline
// (Edamam) on the same ingredient lines, and prints a per-recipe delta report.
// This is the acceptance test for B1 — not a launch dependency.
//
// Run from backend/:  node --env-file=.env scripts/nutrition-test-batch.mjs [count]
// Needs: SPOONACULAR_KEY (vendor truth) + EDAMAM_APP_ID/EDAMAM_APP_KEY (our pipeline).
import postgres from "postgres";
import { edamamProvider } from "../src/lib/nutrition/edamamProvider.js";
import { ENV } from "../src/config/env.js";

const COUNT = Math.min(Number(process.argv[2]) || 50, 100);

if (!ENV.SPOONACULAR_KEY) {
  console.log("SPOONACULAR_KEY missing — founder input (free tier is fine). Nothing run.");
  process.exit(0);
}
if (!ENV.EDAMAM_APP_ID || !ENV.EDAMAM_APP_KEY) {
  console.log("EDAMAM keys missing — founder input. Nothing run.");
  process.exit(0);
}

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

const url =
  `https://api.spoonacular.com/recipes/complexSearch?number=${COUNT}` +
  `&addRecipeNutrition=true&fillIngredients=true&apiKey=${ENV.SPOONACULAR_KEY}`;
const { results = [] } = await (await fetch(url)).json();
console.log(`pulled ${results.length} spoonacular recipes`);

const pct = (ours, theirs) =>
  theirs ? Math.round(Math.abs(ours - theirs) / theirs / 0.01) : null;
const report = [];

for (const r of results) {
  const ingredients = (r.extendedIngredients || []).map((i) => ({
    measure: "",
    name: i.original || i.name,
  }));
  const servings = r.servings || 1;
  const vendorPerServing = Object.fromEntries(
    (r.nutrition?.nutrients || []).map((n) => [n.name, n.amount])
  );
  const ours = await edamamProvider.computeNutrition(ingredients, servings).catch(() => null);
  if (!ours) {
    report.push({ id: r.id, title: r.title, skipped: "our pipeline returned null" });
    continue;
  }
  const row = {
    id: r.id,
    title: r.title.slice(0, 40),
    kcal_delta_pct: pct(ours.kcal, vendorPerServing["Calories"]),
    protein_delta_pct: pct(ours.protein_g, vendorPerServing["Protein"]),
    carbs_delta_pct: pct(ours.carbs_g, vendorPerServing["Carbohydrates"]),
    fat_delta_pct: pct(ours.fat_g, vendorPerServing["Fat"]),
    confidence: ours.confidence,
  };
  report.push(row);
  // cache the vendor-truth batch, flagged by source, for NutritionCard eyeballing
  await sql`
    insert into seed_nutrition (recipe_id, nutrition)
    values (${"spoonacular-test-" + r.id}, ${sql.json({
      kcal: Math.round((vendorPerServing["Calories"] || 0)),
      protein_g: vendorPerServing["Protein"] ?? null,
      carbs_g: vendorPerServing["Carbohydrates"] ?? null,
      fat_g: vendorPerServing["Fat"] ?? null,
      per: "serving",
      source: "spoonacular_test",
      confidence: "high",
      computed_at: new Date().toISOString(),
    })})
    on conflict (recipe_id) do nothing`;
}

console.table(report);
const scored = report.filter((r) => r.kcal_delta_pct != null);
const median = (xs) => xs.sort((a, b) => a - b)[Math.floor(xs.length / 2)];
if (scored.length) {
  console.log(
    `kcal delta median: ${median(scored.map((r) => r.kcal_delta_pct))}% over ${scored.length} recipes ` +
    `(sane tolerance per ticket: ~within 15-20% median; investigate outliers above 40%)`
  );
}
await sql.end();
