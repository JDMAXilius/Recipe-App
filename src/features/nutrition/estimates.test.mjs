// Feature-layer nutrition estimates: category fallback ranges + the carb
// ceiling (imported from the engine, exercised here). Testing rule: every
// nutrition assertion covers the P/C/F macro split, never kcal alone.
import test from "node:test";
import assert from "node:assert/strict";
import {
  getNutritionEstimate,
  applyCarbCeiling,
  estimateCaption,
} from "./estimates.ts";

const assertMacros = (est, { calories, protein, carbs, fat }, label) => {
  assert.equal(est.calories, calories, `${label}: kcal`);
  assert.equal(est.protein, protein, `${label}: protein`);
  assert.equal(est.carbs, carbs, `${label}: carbs`);
  assert.equal(est.fat, fat, `${label}: fat`);
};

test("category fallback ranges — exact P/C/F per template", () => {
  assertMacros(getNutritionEstimate("Chicken"), { calories: 400, protein: 38, carbs: 20, fat: 18 }, "Chicken");
  assertMacros(getNutritionEstimate("Seafood"), { calories: 350, protein: 32, carbs: 18, fat: 14 }, "Seafood");
  assertMacros(getNutritionEstimate("Pasta"), { calories: 480, protein: 18, carbs: 62, fat: 16 }, "Pasta");
  assertMacros(getNutritionEstimate("Dessert"), { calories: 390, protein: 6, carbs: 52, fat: 17 }, "Dessert");
});

test("normalization: case + trailing-s + synonyms hit the same template", () => {
  const chicken = getNutritionEstimate("Chicken");
  assertMacros(getNutritionEstimate("CHICKEN"), chicken, "CHICKEN");
  assertMacros(getNutritionEstimate("chickens"), chicken, "chickens");
  // a drink synonym must NOT fall through to the dinner default
  assertMacros(getNutritionEstimate("Beverage"), getNutritionEstimate("Drink"), "Beverage→Drink");
  assertMacros(getNutritionEstimate("Milkshake"), getNutritionEstimate("Smoothie"), "Milkshake→Smoothie");
});

test("unknown category → the dinner DEFAULT, full P/C/F", () => {
  assertMacros(getNutritionEstimate("Nonsense"), { calories: 420, protein: 24, carbs: 36, fat: 18 }, "default");
  assertMacros(getNutritionEstimate(null), { calories: 420, protein: 24, carbs: 36, fat: 18 }, "null default");
});

test("carb ceiling caps phantom carbs when nothing can supply them", () => {
  // garlic butter chicken: chicken template carries 20g carbs the dish can't
  // have (no rice/tortilla/sauce). Ceiling drops carbs to a trace; P and F
  // are untouched — a one-way lower, never a raise.
  const names = ["chicken breast", "butter", "olive oil", "garlic", "paprika", "salt", "lemon juice"];
  const capped = applyCarbCeiling(getNutritionEstimate("Chicken"), names);
  assertMacros(capped, { calories: 400, protein: 38, carbs: 3, fat: 18 }, "carb-capped chicken");
});

test("carb ceiling leaves a genuinely carb-bearing dish alone", () => {
  const names = ["chicken breast", "white rice", "onion"];
  const kept = applyCarbCeiling(getNutritionEstimate("Chicken"), names);
  assertMacros(kept, { calories: 400, protein: 38, carbs: 20, fat: 18 }, "rice keeps carbs");
});

test("estimates are always flagged as estimates", () => {
  // the proof of the honesty flag: category templates never read as fact.
  assert.match(estimateCaption("category"), /estimate/i);
  assert.match(estimateCaption("computed"), /estimate/i);
  assert.match(estimateCaption("computed-low"), /rough guide/i);
  assert.match(estimateCaption("none"), /no nutrition estimate/i);
});
