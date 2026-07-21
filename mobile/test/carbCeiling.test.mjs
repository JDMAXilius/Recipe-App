// Carb ceiling on the category-estimate fallback (TestFlight QA 2026-07-21).
//
// The Chicken template carries 20 g carbs — right for a typical chicken
// dinner, fabricated for garlic butter chicken (whose only "carbs" are a
// clove of garlic and a squeeze of lemon). When the ingredient list is
// known and nothing in it can supply carbs, the template is capped at a
// trace. One-way: the ceiling only ever lowers a number.
import test from "node:test";
import assert from "node:assert/strict";
import { getNutritionEstimate, applyCarbCeiling } from "../constants/nutritionEstimates.js";

const chicken = getNutritionEstimate("Chicken");

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
  const beef = getNutritionEstimate("Beef");
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
