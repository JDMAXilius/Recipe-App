// Run: node src/lib/nutrition/__tests__/bareUnit.test.mjs
// Two parse gaps found by measuring the seed catalogue (2026-07-19): 28.3% of
// all ingredient lines resolved to NO grams, so they were dropped from the
// nutrition sum and counted as doubt. The two biggest fixable causes:
//   1. a bare unit with no number — "Pinch Salt", "Handful Parsley"
//   2. "tbs", TheMealDB's usual spelling of tablespoon, missing from UNIT_WORDS
import assert from "node:assert/strict";
import { parseIngredientLine } from "../parseIngredient.js";

// 1. bare unit => qty 1
const pinch = parseIngredientLine("Pinch Salt");
assert.equal(pinch.unit, "pinch");
assert.ok(pinch.grams > 0, `pinch should resolve grams, got ${pinch.grams}`);

const handful = parseIngredientLine("Handful Parsley");
assert.equal(handful.unit, "handful");
assert.ok(handful.grams > 25 && handful.grams < 35, `handful ~30g, got ${handful.grams}`);

assert.ok(parseIngredientLine("Dash Pepper").grams > 0);
assert.ok(parseIngredientLine("Knob of Butter").grams > 0, "'of' after a bare unit");

// 2. "tbs" is a tablespoon
const tbs = parseIngredientLine("2 tbs Caster Sugar");
assert.equal(tbs.unit, "tbsp");
assert.ok(tbs.grams > 20 && tbs.grams < 30, `2 tbsp sugar ~25.5g, got ${tbs.grams}`);
// the existing spellings still win their own match
for (const s of ["2 tbsp olive oil", "2 tablespoons olive oil"]) {
  assert.equal(parseIngredientLine(s).unit, "tbsp", s);
}

// genuinely unquantifiable stays unresolved — we do NOT invent a number
for (const s of ["To taste Salt", "Salt and pepper to taste"]) {
  assert.equal(parseIngredientLine(s).grams, null, `should stay unknown: ${s}`);
  assert.equal(parseIngredientLine(s).confidence, "low", s);
}

// an ingredient that IS a unit word, with nothing after it, must not become 1
assert.equal(parseIngredientLine("Cloves").grams, null, "bare 'Cloves' is the spice");

console.log("bareUnit: all assertions passed");
