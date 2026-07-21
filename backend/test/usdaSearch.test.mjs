// USDA FoodData Central search adapter (nutrition Increment 2). The live HTTP
// call is dormant-gated (no key here) and verified on deploy; what we pin is
// the pure extraction — turning a USDA nutrient array into our per-100g shape
// on both API shapes — plus dormant behavior.
import test from "node:test";
import assert from "node:assert/strict";
import {
  extractPer100g,
  candidateToFoodRow,
  usdaSearchActive,
  searchUsdaFoods,
} from "../src/lib/nutrition/usdaSearch.js";

test("usdaSearch is dormant without USDA_API_KEY", async () => {
  assert.equal(usdaSearchActive(), false);
  assert.deepEqual(await searchUsdaFoods("eggplant"), []); // no key → no call, empty
});

test("extractPer100g reads the flat search-API shape", () => {
  const out = extractPer100g([
    { nutrientNumber: "208", value: 25 }, // kcal
    { nutrientNumber: "203", value: 0.98 }, // protein
    { nutrientNumber: "204", value: 0.18 }, // fat
    { nutrientNumber: "205", value: 5.88 }, // carbs
    { nutrientNumber: "291", value: 3 }, // fiber
    { nutrientNumber: "307", value: 2 }, // sodium
  ]);
  assert.deepEqual(out, {
    kcal: 25, protein_g: 0.98, fat_g: 0.18, carbs_g: 5.88,
    fiber_g: 3, sugar_g: null, sodium_mg: 2,
  });
});

test("extractPer100g reads the nested detail-API shape too", () => {
  const out = extractPer100g([
    { nutrient: { number: "208" }, amount: 143 },
    { nutrient: { number: "203" }, amount: 17.4 },
  ]);
  assert.equal(out.kcal, 143);
  assert.equal(out.protein_g, 17.4);
  assert.equal(out.fat_g, null); // absent stays null, never fabricated 0
});

test("candidateToFoodRow shapes a candidate like a bundled row; drops kcal-less ones", () => {
  const row = candidateToFoodRow({
    fdcId: 169228,
    description: "Eggplant, raw",
    per100g: { kcal: 25, protein_g: 0.98, fat_g: 0.18, carbs_g: 5.88, fiber_g: 3, sugar_g: null, sodium_mg: 2 },
  });
  assert.equal(row.fdcId, 169228);
  assert.equal(row.usda, "Eggplant, raw");
  assert.equal(row.kcal, 25);
  assert.equal(candidateToFoodRow({ fdcId: 1, per100g: { kcal: null } }), null);
  assert.equal(candidateToFoodRow(null), null);
});
