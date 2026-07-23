// Resolver-override seam (query layer wires the fetch; this pins the engine
// side). Covers the three pure bits the fallback rests on: which names the local
// table reports as unmatched, merging a resolved row back in, and a resolver
// miss (null) staying a miss.
import test from "node:test";
import assert from "node:assert/strict";
import { computeNutrition, unmatchedNames } from "./compute";

// "Zorblax" is not in the bundled table; "Butter" is (717 kcal/100g). 2 servings
// keeps the with-override total under the plausibility ceiling. Salt is
// negligible — it must never be asked of the resolver.
const input = {
  ingredients: [
    { measure: "200g", name: "Butter" },
    { measure: "200g", name: "Zorblax" },
    { measure: "To taste", name: "Salt" },
  ],
  servings: 2,
};

// A per-100g FoodRow shaped exactly like the resolver returns.
const zorblaxRow = {
  fdcId: 1,
  usda: "Zorblax, raw",
  kcal: 100,
  protein_g: 5,
  fat_g: 2,
  carbs_g: 10,
  fiber_g: 1,
  sugar_g: 3,
  sodium_mg: 50,
};

test("unmatchedNames reports table misses and excludes negligible lines", () => {
  const missing = unmatchedNames(input);
  assert.deepEqual(missing, ["Zorblax"]); // Butter matched, Salt is negligible
});

test("without the missing main ingredient the recipe honestly refuses (coverage floor)", () => {
  // 200g of 400g countable mass resolves (0.5 < 0.7 COVERAGE_MIN) → null.
  assert.equal(computeNutrition(input), null);
});

test("feeding the resolved row back in produces a figure and clears the miss", () => {
  const resolved = new Map([["zorblax", zorblaxRow]]);
  const out = computeNutrition(input, resolved);
  assert.ok(out, "recompute with the override yields a result");
  // 200g butter (1434 kcal) + 200g zorblax (200 kcal) = 1634, / 2 servings.
  assert.equal(out.kcal, 817);
  // and nothing is left to ask the resolver a second time
  assert.deepEqual(unmatchedNames(input, resolved), []);
});

test("a resolver miss (null) stays a miss — no number invented", () => {
  const resolved = new Map([["zorblax", null]]);
  assert.equal(computeNutrition(input, resolved), null); // still refuses
  assert.deepEqual(unmatchedNames(input, resolved), ["Zorblax"]); // still unmatched
});
