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

test("count units and bare counts are medium confidence", () => {
  const garlic = parseIngredientLine("3 cloves garlic");
  assert.equal(garlic.grams, 9); // 3 g/clove [USDA] — aligned with the app's table
  assert.equal(garlic.confidence, "medium");
  const eggs = parseIngredientLine("2 eggs");
  assert.equal(eggs.grams, 100);
  assert.equal(eggs.confidence, "medium");
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
  assert.equal(all.confidence, "medium"); // eggs line drags high → medium
  const mostlyUnknown = parseIngredients(["salt to taste", "a splash of love", "1 cup milk"]);
  assert.equal(mostlyUnknown.confidence, "low");
});
