// Golden coverage test for the weight-first display (foodScale.js).
//
// The corpus is the REAL seed vocabulary: the 920 canonical TheMealDB
// ingredient names the nutrition pipeline ships in usdaTable.json. The bar
// this pins: EVERY name must have at least one resolution path — density
// (volume→g), per-item weight (count→g), liquid (→ml), or a deliberate
// seasoning/as-is fallback. A table edit that orphans a name fails here.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { formatIngredientLine } from "../lib/foodScale.js";

const VOCAB = Object.keys(
  JSON.parse(
    readFileSync(new URL("../../backend/src/lib/nutrition/usdaTable.json", import.meta.url), "utf8")
  )
);

const INTENDED = new Set(["weight", "volume-ml", "seasoning", "asis"]);

test("every seed-vocabulary name has a resolution path (no orphans)", () => {
  const orphans = [];
  for (const name of VOCAB) {
    const vol = formatIngredientLine("1 cup", name).kind;
    const cnt = formatIngredientLine("2", name).kind;
    // Orphan = BOTH realistic shapes fall through to raw passthrough.
    if (!INTENDED.has(vol) && !INTENDED.has(cnt)) orphans.push(name);
  }
  assert.deepEqual(orphans, [], `${orphans.length} vocabulary names have no resolution path`);
});

test("vocabulary is the real corpus, not a stub", () => {
  assert.ok(VOCAB.length >= 900, `expected ~920 names, got ${VOCAB.length}`);
});

// The locked founder rules, pinned as behavior:
test("food-scale numbers: decimals, never fractions", () => {
  assert.equal(formatIngredientLine("500g", "Beef Mince", 1 / 3).display, "166.7 g");
  assert.equal(formatIngredientLine("1 tsp", "Salt", 0.5).display, "0.5 tsp");
  assert.equal(formatIngredientLine("2 tsp", "Dried Oregano", 2 / 3).display, "1.3 tsp");
});

test("everything weighable shows grams — no count exceptions", () => {
  assert.equal(formatIngredientLine("2", "Eggs").display, "100 g");
  assert.equal(formatIngredientLine("8", "Lasagne Sheets").display, "144 g");
  assert.equal(formatIngredientLine("1", "Lime").display, "44 g");
  assert.equal(formatIngredientLine("2 cloves", "Garlic").display, "6 g");
  assert.equal(formatIngredientLine("2 tbsp", "Honey").display, "42 g");
  assert.equal(formatIngredientLine("1 can", "Chickpeas").display, "400 g");
});

test("thin liquids stay ml; unmeasurables pass through", () => {
  assert.equal(formatIngredientLine("1 cup", "Milk").display, "240 ml");
  assert.equal(formatIngredientLine("Handful", "Fresh Coriander").display, "Handful");
});
