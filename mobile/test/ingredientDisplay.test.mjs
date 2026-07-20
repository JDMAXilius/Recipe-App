// End-to-end display: the string a reader actually sees, in their own units.
// Otto's recipe data is mostly European (grams), so the US-mode conversion here
// is what stops an American user from reading "250 g flour".
import test from "node:test";
import assert from "node:assert/strict";
import { scaledIngredient, convertMeasure } from "../lib/ingredientParser.js";

test("US mode converts a metric recipe to familiar units", () => {
  // "250g flour" — a European recipe read by a US user
  assert.equal(convertMeasure({ qty: 250, unit: "g" }, "us").unit, "oz");
  assert.ok(convertMeasure({ qty: 250, unit: "g" }, "us").qty >= 8, "250g ≈ 8.8 oz");
  // large mass upgrades to pounds
  assert.equal(convertMeasure({ qty: 1000, unit: "g" }, "us").unit, "lb");
  // metric volume too
  assert.equal(convertMeasure({ qty: 500, unit: "ml" }, "us").unit, "cup");
});

test("metric mode still converts US recipes to grams/ml", () => {
  assert.equal(convertMeasure({ qty: 2, unit: "cup" }, "metric").unit, "ml");
  assert.equal(convertMeasure({ qty: 1, unit: "lb" }, "metric").unit, "g"); // via TO_METRIC
});

test("native units pass through untouched", () => {
  // a US recipe in US mode: cups stay cups
  assert.deepEqual(convertMeasure({ qty: 2, unit: "cup" }, "us"), { qty: 2, unit: "cup" });
  // a metric recipe in metric mode: grams stay grams
  assert.deepEqual(convertMeasure({ qty: 250, unit: "g" }, "metric"), { qty: 250, unit: "g" });
});

test("a European baking recipe reads sensibly in US mode", () => {
  // "250g flour" → US user sees oz for the measure AND the ≈ weight is skipped
  // (already mass), so no double weight
  const s = scaledIngredient({ measure: "250g", name: "all-purpose flour" }, 1, "us");
  assert.match(s.display, /oz/, "measure converted to oz");
  assert.equal(s.weight, "", "no redundant weight hint — the measure IS the weight");
});

test("a US baking recipe reads sensibly in metric mode", () => {
  // "2 cups flour" → metric user sees ml + an estimated gram weight
  const s = scaledIngredient({ measure: "2 cups", name: "all-purpose flour" }, 1, "metric");
  assert.match(s.display, /ml/, "measure converted to ml");
  assert.match(s.weight, /≈240 g/, "estimated weight for the scale");
});
