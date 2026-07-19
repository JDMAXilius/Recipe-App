// Run: node src/lib/nutrition/__tests__/packSize.test.mjs
// TheMealDB writes pack sizes as a parenthetical. Before expandPackSize, those
// lines resolved to null grams — the ingredient contributed nothing to the
// recipe total and forced the whole recipe to confidence "low". 52772 Teriyaki
// Chicken Casserole was the case that surfaced it: 12 oz of vegetables silently
// missing from the numbers shown on an App Store screenshot.
import assert from "node:assert/strict";
import { expandPackSize, parseIngredientLine } from "../parseIngredient.js";

// rewriting
assert.equal(expandPackSize("1 (12 oz.) stir-fry vegetables"), "12 oz stir-fry vegetables");
assert.equal(expandPackSize("2 (8 oz) packages cream cheese"), "16 oz packages cream cheese");
assert.equal(expandPackSize("(400g) tin tomatoes"), "400 g tin tomatoes");

// left alone when there is no pack size to expand
for (const s of ["3 cups brown rice", "1/2 teaspoon ground ginger", "2 chicken breasts", "1 onion (finely chopped)"]) {
  assert.equal(expandPackSize(s), s, `should be untouched: ${s}`);
}

// the parse that actually matters
const veg = parseIngredientLine("1 (12 oz.) stir-fry vegetables");
assert.ok(veg.grams > 335 && veg.grams < 345, `12 oz should be ~340g, got ${veg.grams}`);
assert.equal(veg.confidence, "high");

const cans = parseIngredientLine("2 (8 oz) packages cream cheese");
assert.ok(cans.grams > 450 && cans.grams < 457, `2x8oz should be ~454g, got ${cans.grams}`);

// every line of 52772 now resolves — no nulls dragging the recipe to "low"
const lines = [
  "3/4 cup soy sauce", "1/2 cup water", "1/4 cup brown sugar",
  "1/2 teaspoon ground ginger", "1/2 teaspoon minced garlic",
  "4 Tablespoons cornstarch", "2 chicken breasts",
  "1 (12 oz.) stir-fry vegetables", "3 cups brown rice",
];
for (const l of lines) {
  const p = parseIngredientLine(l);
  assert.notEqual(p.grams, null, `unresolved grams: ${l}`);
  assert.notEqual(p.confidence, "low", `low confidence: ${l}`);
}

console.log("packSize: all assertions passed");
