// Scale-friendly weight hints. The interesting logic is NOT the arithmetic —
// it's the rule for which ingredients earn a weight at all. The whole feature
// is worthless if every row sprouts a parenthetical, so these lock the "when to
// show" decision, using the user's own example as the spec:
//   chicken 6oz ✓, 1 tsp salt ✗, 1 tsp pepper ✗, ¼ cup milk ✗, ¼ cup flour ✓
import test from "node:test";
import assert from "node:assert/strict";
import { gramsFor, worthWeighing, weightHint, formatWeight } from "../lib/ingredientWeight.js";

const near = (a, b, tol = 0.06) => Math.abs(a - b) / b <= tol;

test("flour by volume gets a weight — the entire point", () => {
  const g = gramsFor({ qty: 1, unit: "cup", name: "all-purpose flour" });
  assert.ok(near(g.grams, 120), `1 cup flour ≈120g, got ${g.grams}`);
  assert.equal(g.exact, false, "density-based, so an estimate");
  assert.ok(weightHint({ qty: 0.25, unit: "cup", name: "flour" }).startsWith("≈"), "¼ cup flour shows a weight");
});

test("the user's example line renders as intended", () => {
  // chicken by weight, salt/pepper/milk/flour by the rule
  assert.ok(weightHint({ qty: 6, unit: "oz", name: "chicken breast" }, "us") === "", "6oz chicken is already mass — no redundant hint");
  assert.equal(weightHint({ qty: 1, unit: "tsp", name: "salt" }), "", "1 tsp salt: never");
  assert.equal(weightHint({ qty: 1, unit: "tsp", name: "black pepper" }), "", "1 tsp pepper: never");
  assert.equal(weightHint({ qty: 0.25, unit: "cup", name: "milk" }), "", "¼ cup milk: liquid, never");
  assert.ok(weightHint({ qty: 0.25, unit: "cup", name: "all purpose flour" }).startsWith("≈"), "¼ cup flour: yes");
});

test("liquids never show weight, however large", () => {
  for (const name of ["milk", "chicken stock", "water", "red wine", "olive oil"]) {
    assert.equal(weightHint({ qty: 4, unit: "cup", name }), "", `${name} stays volume-only`);
  }
});

test("tiny amounts never show weight even for weighable categories", () => {
  // 1 tsp flour is ~2.5g — a scale is the wrong tool below ~20g
  assert.equal(weightHint({ qty: 1, unit: "tsp", name: "flour" }), "", "1 tsp flour: under threshold");
  assert.equal(weightHint({ qty: 1, unit: "tbsp", name: "sugar" }), "", "1 tbsp sugar: under threshold");
  // but a quarter cup of sugar (~50g) does
  assert.ok(weightHint({ qty: 0.25, unit: "cup", name: "sugar" }).startsWith("≈"));
});

test("mass units convert exactly and don't get a redundant hint", () => {
  const g = gramsFor({ qty: 1, unit: "lb", name: "beef mince" });
  assert.ok(near(g.grams, 453.6), `1 lb ≈454g, got ${g.grams}`);
  assert.equal(g.exact, true, "mass→mass is exact");
  // already weighed — showing "≈454 g" next to "1 lb" is noise
  assert.equal(weightHint({ qty: 1, unit: "lb", name: "beef mince" }), "");
});

test("unitless whole items fall back to piece weights", () => {
  // TheMealDB's reality: "1 whole Chicken", "2 Onions", no unit at all
  assert.ok(near(gramsFor({ qty: 1, unit: null, name: "whole chicken" }).grams, 1400));
  assert.ok(weightHint({ qty: 1, unit: null, name: "whole chicken" }).startsWith("≈"), "whole chicken shows a weight");
  // aromatics stay countable — "2 onions (320 g)" is false precision
  assert.equal(weightHint({ qty: 2, unit: null, name: "onions" }), "");
  assert.equal(weightHint({ qty: 2, unit: null, name: "garlic clove" }), "");
});

test("coconut is not a nut — found by running real recipe data", () => {
  // "cocoNUT milk" false-matched /nuts?\b/ and got a weight; it's a liquid.
  assert.equal(weightHint({ qty: 2, unit: "cup", name: "Coconut Milk" }), "", "coconut milk is a liquid, no weight");
  assert.equal(gramsFor({ qty: 1, unit: "cup", name: "coconut cream" }).category, "liquid");
});

test("a bare unitless protein gets no fabricated weight", () => {
  // "1 whole Chicken" (TheMealDB) — the weight ranges 1-2kg, so any single
  // number is a confident lie. Recognized cuts still resolve.
  assert.equal(weightHint({ qty: 1, unit: null, name: "Chicken" }), "", "whole chicken: no guess");
  assert.equal(weightHint({ qty: 1, unit: null, name: "Beef" }), "", "bare beef: no guess");
  assert.ok(near(gramsFor({ qty: 1, unit: null, name: "chicken breast" }).grams, 174), "a named cut still resolves");
});

test("unknown ingredients never invent a density", () => {
  assert.equal(gramsFor({ qty: 1, unit: "cup", name: "moon dust" }), null);
  assert.equal(weightHint({ qty: 1, unit: "cup", name: "moon dust" }), "");
});

test("weight scales with servings", () => {
  const one = gramsFor({ qty: 1, unit: "cup", name: "flour" }).grams;
  const two = gramsFor({ qty: 2, unit: "cup", name: "flour" }).grams;
  assert.ok(near(two, one * 2), "doubling the qty doubles the grams");
});

test("formatWeight rounds to what a scale can read", () => {
  assert.equal(formatWeight(120, "metric"), "120 g"); // 10g steps ≥200? no — 5g here, 120 lands exact
  assert.equal(formatWeight(37, "metric"), "37 g"); // <50g: 1g steps, a scale reads this fine
  assert.equal(formatWeight(52, "metric"), "50 g"); // ≥50g: 5g steps
  assert.equal(formatWeight(217, "metric"), "220 g"); // ≥200g: 10g steps
  assert.equal(formatWeight(1400, "metric"), "1.4 kg");
  assert.equal(formatWeight(170, "us"), "6 oz");
  assert.equal(formatWeight(454, "us"), "1 lb");
});

test("worthWeighing is the gate", () => {
  assert.equal(worthWeighing("flour", 120, "cup"), true);
  assert.equal(worthWeighing("liquid", 500, "cup"), false); // category excluded
  assert.equal(worthWeighing("flour", 5, "tsp"), false); // below threshold
  assert.equal(worthWeighing("protein", 200, "lb"), false); // already mass
});
