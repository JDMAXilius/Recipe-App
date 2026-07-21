// Regression tests for the deterministic ingredient parser (B1.1).
// Run: npm test (node --test). No network, no DB.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseQty,
  parseIngredientLine,
  parseIngredients,
} from "../src/lib/nutrition/parseIngredient.js";

test("parseQty handles plain, decimal, comma-decimal", () => {
  assert.equal(parseQty("2"), 2);
  assert.equal(parseQty("2.5"), 2.5);
  assert.equal(parseQty("2,5"), 2.5);
});

test("parseQty handles fractions, mixed numbers, unicode", () => {
  assert.equal(parseQty("1/2"), 0.5);
  assert.equal(parseQty("2 1/2"), 2.5);
  assert.equal(parseQty("½"), 0.5);
  assert.equal(parseQty("1½"), 1.5);
});

test("parseQty resolves ranges to the midpoint (C20)", () => {
  assert.equal(parseQty("2-3"), 2.5);
  assert.equal(parseQty("2 to 3"), 2.5);
  assert.equal(parseQty("2–3"), 2.5); // en dash
});

test("mass units convert exactly, high confidence", () => {
  const lb = parseIngredientLine("1 lb ground beef");
  assert.equal(lb.grams, 453.6);
  assert.equal(lb.confidence, "high");
  const kg = parseIngredientLine("1.5 kg chicken thighs");
  assert.equal(kg.grams, 1500);
});

test("volume converts via density (flour ≠ water)", () => {
  const flour = parseIngredientLine("2 1/2 cups plain flour");
  assert.ok(Math.abs(flour.grams - 318) < 1, `got ${flour.grams}`);
  const water = parseIngredientLine("1 cup water");
  assert.equal(water.grams, 240);
});

test("USDA-verified piece weights are high; unverified ones stay medium", () => {
  // Verified against USDA's own foodPortions ("1 large egg = 50 g") →
  // pieceWeights.json → the same authority as the food's per-100g numbers.
  const eggs = parseIngredientLine("2 eggs");
  assert.equal(eggs.grams, 100);
  assert.equal(eggs.confidence, "high");
  // Garlic: USDA's SR Legacy record publishes "1 clove = 3 g" (the Foundation
  // record carries only "1 RACC" — hence the candidate walk in
  // build-piece-weights.mjs). Verified, so high.
  const garlic = parseIngredientLine("3 cloves garlic");
  assert.equal(garlic.grams, 9);
  assert.equal(garlic.confidence, "high");
  // Shallot: USDA publishes NO whole-shallot portion, only "1 tbsp chopped",
  // which is a volume. Our 30 g/each stays an estimate and must say so — this
  // is the case that proves the file is provenance and not a rubber stamp.
  const shallot = parseIngredientLine("2 shallots");
  assert.equal(shallot.grams, 60);
  assert.equal(shallot.confidence, "medium");
});

test("unresolvable lines are honest: null grams, low confidence", () => {
  const salt = parseIngredientLine("salt to taste");
  assert.equal(salt.grams, null);
  assert.equal(salt.confidence, "low");
  assert.equal(salt.item, "salt to taste");
});

test("accepts the app-wide { measure, name } pair shape", () => {
  const butter = parseIngredientLine({ measure: "2 tbsp", name: "butter" });
  assert.equal(butter.unit, "tbsp");
  assert.ok(butter.grams > 20 && butter.grams < 35);
});

test("parseIngredients aggregates totals and worst-weights confidence", () => {
  const all = parseIngredients(["2 cups flour", "1 cup milk", "2 eggs"]);
  assert.equal(all.lines.length, 3);
  assert.ok(all.totalGrams > 550 && all.totalGrams < 650);
  // Eggs no longer drag the aggregate down: the 50 g/large-egg weight is USDA's
  // own published portion, not our guess, so all three lines are high.
  assert.equal(all.confidence, "high");
  const mostlyUnknown = parseIngredients(["salt to taste", "a splash of love", "1 cup milk"]);
  assert.equal(mostlyUnknown.confidence, "low");
});

test("confidence sweep 2026-07-21: juice-of, dual-unit, splash, bare counts", () => {
  const lime = parseIngredientLine({ measure: "Juice of 1", name: "Lime" });
  assert.equal(lime.grams, 30);
  const halfLemon = parseIngredientLine({ measure: "Juice of 1/2", name: "Lemon" });
  assert.equal(halfLemon.grams, 23.5);
  const dual = parseIngredientLine({ measure: "50g/1¾oz", name: "Flaked Almonds" });
  assert.equal(dual.grams, 50); // metric side wins, imperial alternative dropped
  const splash = parseIngredientLine({ measure: "Splash", name: "Water" });
  assert.equal(splash.grams, 10);
  // 280 g = USDA "1 large (8-1/4\" long)" — replaced the hand-set 300 g estimate.
  const cukes = parseIngredientLine({ measure: "1", name: "Cucumber" });
  assert.equal(cukes.grams, 280);
  assert.equal(cukes.confidence, "high");
});

test("sweetener packet weighs ~1 g, not the 100 g generic packet", () => {
  const stevia = parseIngredientLine({ measure: "1 packet", name: "stevia sweetener" });
  assert.equal(stevia.grams, 1);
  const yeast = parseIngredientLine({ measure: "1 packet", name: "dried yeast" });
  assert.equal(yeast.grams, 7); // existing rows untouched
});

test("unquantified frying oil counts a conservative tbsp, flagged as an estimate", () => {
  // Counting zero understated every fried dish; published absorption is 8-25%
  // of food weight, far too wide to claim exactness. One tbsp, medium.
  const fry = parseIngredientLine({ measure: "For frying", name: "Vegetable Oil" });
  assert.equal(fry.grams, 14);
  assert.equal(fry.confidence, "medium");
  // An explicit amount still wins over the fallback.
  const explicit = parseIngredientLine({ measure: "2 tbsp", name: "Olive Oil" });
  assert.ok(explicit.grams > 25 && explicit.confidence === "high");
  // Non-fat lines are untouched — "To serve, Rice" is not a hidden tbsp of oil.
  assert.equal(parseIngredientLine({ measure: "To serve", name: "Rice" }).grams, null);
});
