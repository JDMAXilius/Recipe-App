// Ported v1 suite: backend/test/usdaProvider.test.mjs, run against the TS
// engine port. Expected values are LAW — identical to v1, none adjusted.
// Only the call shape changes: v1 positional (ingredients, servings) becomes
// the contract's single input object; the engine is sync (no I/O to await).
import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { computeNutrition } from "./compute";

const require = createRequire(import.meta.url);
const table = require("./data/usdaTable.json");

const compute = (ingredients, servings, recipeId, steps) =>
  computeNutrition({ ingredients, servings, recipeId, steps });

test("computes per-serving nutrition from grams x per-100g", () => {
  // Butter is 717 kcal/100g. 100g / 2 servings = 358.5 → 359.
  const out = compute([{ measure: "100g", name: "Butter" }], 2);
  assert.equal(out.kcal, 359);
  assert.equal(out.basis_grams, 50);
  assert.equal(out.per, "serving");
  assert.equal(out.source, "usda");
});

test("sums across ingredients", () => {
  // 100g butter (717) + 100g sugar (~385) ≈ 1102 total, /1 serving
  const out = compute(
    [{ measure: "100g", name: "Butter" }, { measure: "100g", name: "Sugar" }],
    1
  );
  assert.ok(out.kcal > 1050 && out.kcal < 1150, `expected ~1100, got ${out.kcal}`);
});

test("scales with servings", () => {
  const one = compute([{ measure: "200g", name: "Butter" }], 1);
  const four = compute([{ measure: "200g", name: "Butter" }], 4);
  assert.ok(Math.abs(one.kcal - four.kcal * 4) <= 4, `${one.kcal} vs ${four.kcal}*4`);
  assert.equal(four.basis_grams, 50);
});

test("makes zero network calls — no vendor, no rate limit", () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = () => {
    throw new Error("engine must not make network calls");
  };
  try {
    const out = compute([{ measure: "100g", name: "Butter" }], 1);
    assert.ok(out.kcal > 0);
  } finally {
    globalThis.fetch = realFetch;
  }
});

test("unresolvable ingredient → null, never a fabricated number", () => {
  const out = compute([{ measure: "100g", name: "Definitely Not A Real Food xyzzy" }], 1);
  assert.equal(out, null);
});

test("no ingredients → null", () => {
  assert.equal(compute([], 4), null);
  assert.equal(compute(null, 4), null);
});

test("a MINOR unmatched line is dropped from the sum and lowers confidence", () => {
  const out = compute(
    [
      { measure: "200g", name: "Butter" },
      { measure: "200g", name: "Sugar" },
      { measure: "50g", name: "Definitely Not A Real Food xyzzy" },
    ],
    4
  );
  assert.ok(out && out.kcal > 0); // the unmatched 50g is absent, not counted as 0
  assert.equal(out.confidence, "medium");
  assert.notEqual(out.confidence, "high"); // but a dropped line must still cost
});

test("a DOMINANT unmatched line returns null, not a confidently-understated total", () => {
  const out = compute(
    [
      { measure: "100g", name: "Butter" },
      { measure: "900g", name: "Definitely Not A Real Food xyzzy" },
    ],
    1
  );
  assert.equal(out, null);
});

test("qualifier-stripping resolves freeform names and keeps the total whole", () => {
  const out = compute(
    [
      { measure: "800 g", name: "chicken thighs" },
      { measure: "300 g", name: "white rice" },
    ],
    4
  );
  assert.ok(out, "should compute, not null");
  assert.ok(out.carbs_g > 40, `rice carbs must be present, got ${out.carbs_g}`);
  assert.ok(out.protein_g > 25, `chicken protein must be present, got ${out.protein_g}`);
});

test("a legitimately light recipe computes its real low number when coverage is complete", () => {
  const out = compute([{ measure: "200 g", name: "celery" }], 1);
  assert.ok(out, "full-coverage light recipe should compute, not fall back");
  assert.ok(out.kcal > 0 && out.kcal < 40, `expected a real low kcal, got ${out.kcal}`);
});

test("the low floor still guards a COLLAPSED sum (partial coverage)", () => {
  const out = compute(
    [
      { measure: "100 g", name: "celery" },
      { measure: "900 g", name: "definitely not a food xyzzy" },
    ],
    1
  );
  assert.equal(out, null);
});

test("regional/word-order aliases resolve so a normal recipe computes, not estimates", () => {
  const out = compute(
    [
      { measure: "500 g", name: "Beef Mince" },
      { measure: "110 g", name: "Onion" },
      { measure: "400 g", name: "Chopped Tomatoes" },
      { measure: "480 ml", name: "Milk" },
      { measure: "112.8 g", name: "Grated Cheddar" },
      { measure: "144 g", name: "Lasagne Sheets" },
    ],
    4
  );
  assert.ok(out, "the lasagna should compute a real total, not fall back to estimate");
  assert.equal(out.confidence, "high");
  assert.ok(out.protein_g > 30, `beef+cheese protein should be present, got ${out.protein_g}`);
});

test("the corrupt chicken-skin rows are fixed to real thigh/drumstick meat", () => {
  for (const name of ["chicken thighs", "chicken drumsticks"]) {
    const out = compute([{ measure: "100 g", name }], 1);
    assert.ok(out.protein_g > 15, `${name} protein should be >15, got ${out.protein_g}`);
    assert.ok(out.kcal < 280, `${name} kcal should be <280, got ${out.kcal}`);
  }
});

test("all matched with exact weights → high confidence", () => {
  const out = compute(
    [{ measure: "100g", name: "Butter" }, { measure: "200g", name: "Sugar" }],
    1
  );
  assert.equal(out.confidence, "high");
});

test("a USDA-verified bare count keeps the recipe high", () => {
  const out = compute(
    [
      { measure: "100g", name: "Butter" },
      { measure: "200g", name: "Sugar" },
      { measure: "300g", name: "Milk" },
      { measure: "2", name: "Eggs" }, // bare count, but USDA-verified at 50 g each
    ],
    4
  );
  assert.equal(out.confidence, "high");
});

test("falls back to the parsed item for freeform user-recipe lines", () => {
  const out = compute([{ measure: "", name: "2 tbsp olive oil" }], 1);
  assert.ok(out, "should resolve via the parsed item");
  assert.ok(out.kcal > 200 && out.kcal < 280, `olive oil ~27.6g ≈ 244 kcal, got ${out.kcal}`);
});

test("a nutrient no ingredient reports stays null — never 0", () => {
  const out = compute([{ measure: "100g", name: "Butter" }], 1);
  for (const f of ["protein_g", "carbs_g", "fat_g"]) {
    assert.ok(out[f] === null || Number.isFinite(out[f]), `${f} must be null or a number`);
  }
});

// --- the shipped table itself ---

test("table rows carry USDA provenance — every number traces to its record", () => {
  const rows = Object.values(table);
  assert.ok(rows.length > 900, `expected >900 ingredients, got ${rows.length}`);
  let missingId = 0;
  for (const r of rows) {
    assert.ok(r.usda, "row missing USDA description");
    assert.ok(Number.isFinite(r.kcal), "row missing kcal");
    if (!r.fdcId) missingId += 1;
  }
  assert.equal(missingId, 0, `rows without fdcId: ${missingId} — backfill them (AI_SEAMS ticket Task 2b pattern)`);
});

test("known ingredients match real-world values — guards the kJ/kcal trap", () => {
  const expect = {
    butter: 717, "olive oil": 884, eggs: 143, aubergine: 25, banana: 89,
    "cheddar cheese": 403, honey: 304, spinach: 23, carrots: 41, milk: 61,
  };
  for (const [name, kcal] of Object.entries(expect)) {
    const row = table[name];
    assert.ok(row, `${name} missing from table`);
    const off = Math.abs(row.kcal - kcal) / Math.max(kcal, 1);
    assert.ok(off <= 0.35, `${name}: ${row.kcal} kcal vs expected ~${kcal} (${row.usda})`);
  }
});

test("refuses a volume-measured grain rather than ship a ~2x error", () => {
  const out = compute(
    [
      { measure: "2", name: "chicken breasts" },
      { measure: "3 cups", name: "brown rice" },
    ],
    4
  );
  assert.equal(out, null, "volume-measured grain must refuse, not guess");
});

test("a grain measured by WEIGHT still computes — that shape means raw", () => {
  const out = compute([{ measure: "200g", name: "Brown Rice" }], 2);
  assert.ok(out, "weight-measured grain should still compute");
  assert.ok(out.kcal > 300, `expected ~360, got ${out?.kcal}`);
});

test("non-grain recipes are unaffected by the guard", () => {
  const out = compute(
    [{ measure: "200g", name: "Chicken" }, { measure: "1 cup", name: "Carrots" }],
    2
  );
  assert.ok(out, "a cup of carrots is not ambiguous");
});

test("refuses canned legumes — the table holds DRY beans", () => {
  const out = compute(
    [{ measure: "1 Can", name: "Black Beans" }, { measure: "200g", name: "Tomato" }],
    4
  );
  assert.equal(out, null, "canned legume must refuse, not use the dry row");
});

test("dry beans by weight still compute", () => {
  const out = compute([{ measure: "200g", name: "Black Beans" }], 2);
  assert.ok(out, "weight-measured beans are unambiguous");
});

test("refuses only an absurd portion — a backstop, not a fix", () => {
  const out = compute([{ measure: "6kg", name: "Shredded Meat" }], 4);
  assert.equal(out, null, "1500g/serving is not a portion");
});

test("a normal-sized recipe is unaffected by the portion guard", () => {
  const out = compute(
    [{ measure: "500g", name: "Chicken" }, { measure: "300g", name: "Potatoes" }],
    4
  );
  assert.ok(out, "200g/serving is plausible and must still compute");
});

test("deep-frying oil counts only what is absorbed, never the whole bath", () => {
  const fried = compute(
    [
      { measure: "1 whole", name: "Chicken" },
      { measure: "1 1/2 cups", name: "Flour" },
      { measure: "2 quarts", name: "Oil" },
    ],
    4
  );
  assert.ok(fried, "a deep-fried recipe should compute, not return unknown");
  assert.ok(fried.kcal < 1500, `frying oil must not dominate, got ${fried.kcal}`);
  const sauteed = compute(
    [{ measure: "500 g", name: "Chicken" }, { measure: "2 tbsp", name: "Olive Oil" }],
    2
  );
  assert.ok(sauteed.kcal > 200, `2 tbsp of oil is food, not a bath: ${sauteed.kcal}`);
});

test("a batch condiment counts a serving's worth, not the mixing bowl", () => {
  const burger = compute(
    [
      { measure: "400g", name: "Minced Beef" },
      { measure: "2", name: "Sesame Seed Burger Buns" },
      { measure: "1 cup", name: "Mayonnaise" },
    ],
    2
  );
  assert.ok(burger, "should compute rather than blow the plausibility cap");
  assert.ok(burger.kcal < 1500, `sauce batch must not dominate, got ${burger.kcal}`);
  const salad = compute(
    [{ measure: "1 kg", name: "Potatoes" }, { measure: "1 cup", name: "Mayonnaise" }],
    8
  );
  assert.ok(salad.fat_g > 15, `a real mayo salad keeps its fat, got ${salad.fat_g}`);
});

// Ported from resolveCooked.test.mjs (the deterministic assertion): steps
// present or not, the ENGINE never classifies — an ambiguous grain refuses.
test("a volume-measured grain still refuses the whole recipe, steps or no steps", () => {
  const out = compute(
    [
      { measure: "3 cups", name: "rice" },
      { measure: "200 g", name: "chicken breast" },
    ],
    4,
    null,
    ["Add the cooked rice.", "Serve."]
  );
  assert.equal(out, null);
});
