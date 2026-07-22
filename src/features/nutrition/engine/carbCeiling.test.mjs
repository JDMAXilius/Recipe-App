// Ported v1 suite: mobile/test/carbCeiling.test.mjs, run against guards.ts —
// the ceiling now lives INSIDE the engine (engine.md Laws §4). Expected
// values are LAW. The category templates themselves stay feature-layer, so
// the two v1 templates these tests exercised are inlined verbatim
// (mobile/constants/nutritionEstimates.js Chicken and Beef rows).
import test from "node:test";
import assert from "node:assert/strict";
import { applyCarbCeiling } from "./guards";

const chicken = { calories: 400, protein: 38, carbs: 20, fat: 18 };
const beef = { calories: 450, protein: 35, carbs: 22, fat: 24 };

test("carb-free list caps the template's carbs at a trace", () => {
  const capped = applyCarbCeiling(chicken, [
    "chicken breast, sliced thin",
    "butter",
    "olive oil",
    "garlic, minced",
    "paprika",
    "salt",
    "black pepper",
    "fresh parsley, chopped",
    "lemon juice", // trace-only — must NOT count as a carb source
  ]);
  assert.ok(capped.carbs <= 3, `carbs ${capped.carbs} should be trace`);
  assert.equal(capped.calories, chicken.calories); // only carbs are touched
  assert.equal(capped.protein, chicken.protein);
});

test("one real carb source keeps the template untouched", () => {
  const kept = applyCarbCeiling(chicken, ["chicken thighs", "basmati rice", "olive oil"]);
  assert.equal(kept.carbs, chicken.carbs);
});

test("naan and beetroot count as carb sources", () => {
  const kept = applyCarbCeiling(beef, [
    "Lean Minced Steak",
    "Cooked Beetroot",
    "Naan Bread",
    "Rocket",
    "Soured cream and chive dip",
  ]);
  assert.equal(kept.carbs, beef.carbs);
});

test("no ingredient list means no judgement — template unchanged", () => {
  assert.equal(applyCarbCeiling(chicken, []).carbs, chicken.carbs);
  assert.equal(applyCarbCeiling(chicken, undefined).carbs, chicken.carbs);
});
