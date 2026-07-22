// Property tests per engine.md §Laws 5 (new in v2):
//   1. parse round-trips: scale a line's qty by k → grams scale by k
//   2. compute monotonicity: more of an ingredient never lowers its contribution
//   3. guard idempotence: applying a guard twice equals applying it once
// No property-testing dep (none allowed): a deterministic case sweep.
import test from "node:test";
import assert from "node:assert/strict";
import { parseIngredientLine } from "./parse";
import { computeNutrition } from "./compute";
import { applyCarbCeiling, applyFryingMedium, applyBatchCondiment } from "./guards";

test("law: parse round-trip — qty scaled by k scales grams by k", () => {
  const lines = [
    (q) => `${q} g flour`,
    (q) => `${q} kg chicken thighs`,
    (q) => `${q} oz cheddar cheese`,
    (q) => `${q} cups plain flour`,
    (q) => `${q} tbsp olive oil`,
    (q) => `${q} ml milk`,
    (q) => `${q} eggs`,
    (q) => `${q} cloves garlic`,
  ];
  for (const make of lines) {
    const base = parseIngredientLine(make(1));
    assert.ok(base.grams != null && base.grams > 0, `${make(1)} must resolve grams`);
    for (const k of [2, 3, 5, 8, 13]) {
      const scaled = parseIngredientLine(make(k));
      // grams are rounded to 0.1 per line, so allow only that rounding slack
      assert.ok(
        Math.abs(scaled.grams - k * base.grams) <= 0.05 * k + 0.1,
        `${make(k)}: ${scaled.grams} != ${k} x ${base.grams}`
      );
    }
  }
});

test("law: compute monotonicity — more butter never lowers kcal (until the guards refuse)", () => {
  let prev = 0;
  let refused = false;
  for (let g = 20; g <= 800; g += 20) {
    const out = computeNutrition({
      ingredients: [{ measure: `${g} g`, name: "Butter" }],
      servings: 1,
    });
    if (out == null) {
      refused = true; // plausibility cap — allowed, but it must never un-refuse
      continue;
    }
    assert.ok(!refused, `computed again after refusing at a lower amount (${g} g)`);
    assert.ok(out.kcal >= prev, `${g} g butter: kcal ${out.kcal} < previous ${prev}`);
    prev = out.kcal;
  }
  assert.ok(prev > 0, "the sweep must have computed at least once");
});

test("law: compute monotonicity — adding an ingredient never lowers the total", () => {
  const base = computeNutrition({
    ingredients: [{ measure: "200 g", name: "Chicken" }],
    servings: 1,
  });
  const withRice = computeNutrition({
    ingredients: [
      { measure: "200 g", name: "Chicken" },
      { measure: "100 g", name: "White Rice" },
    ],
    servings: 1,
  });
  assert.ok(base && withRice);
  assert.ok(withRice.kcal >= base.kcal, `${withRice.kcal} < ${base.kcal}`);
  assert.ok(withRice.carbs_g >= base.carbs_g, "rice must add carbs, not remove them");
});

test("law: guard idempotence — carb ceiling", () => {
  const cases = [
    [{ calories: 400, protein: 38, carbs: 20, fat: 18 }, ["chicken breast", "butter", "salt"]],
    [{ calories: 400, protein: 38, carbs: 20, fat: 18 }, ["chicken", "basmati rice"]],
    [{ calories: 390, protein: 6, carbs: 52, fat: 17 }, ["flour", "sugar", "eggs"]],
    [{ calories: 350, protein: 32, carbs: 18, fat: 14 }, []],
  ];
  for (const [estimate, names] of cases) {
    const once = applyCarbCeiling(estimate, names);
    const twice = applyCarbCeiling(once, names);
    assert.deepEqual(twice, once, `carb ceiling not idempotent for ${JSON.stringify(names)}`);
  }
});

test("law: guard idempotence — frying medium and batch condiment", () => {
  const mkRows = () => [
    { parsed: parseIngredientLine("1000 g chicken"), food: {}, name: "chicken", resolved: false },
    { parsed: parseIngredientLine("2 quarts oil"), food: {}, name: "Oil", resolved: false },
    { parsed: parseIngredientLine("1 cup mayonnaise"), food: {}, name: "Mayonnaise", resolved: false },
  ];
  const once = mkRows();
  applyFryingMedium(once, 2);
  applyBatchCondiment(once, 2);
  const twice = mkRows();
  applyFryingMedium(twice, 2);
  applyBatchCondiment(twice, 2);
  applyFryingMedium(twice, 2);
  applyBatchCondiment(twice, 2);
  assert.deepEqual(
    twice.map((r) => r.parsed.grams),
    once.map((r) => r.parsed.grams),
    "guarded grams must be stable under re-application"
  );
});
