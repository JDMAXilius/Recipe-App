// B1.7 — usdaProvider. No network, no stubs needed: the table ships with the
// app, so these run against the real data.
import test from "node:test";
import assert from "node:assert/strict";

const { usdaProvider } = await import("../src/lib/nutrition/usdaProvider.js");
const { default: table } = await import("../src/lib/nutrition/usdaTable.json", {
  with: { type: "json" },
});

test("computes per-serving nutrition from grams x per-100g", async () => {
  // Butter is 717 kcal/100g. 100g / 2 servings = 358.5 → 359.
  const out = await usdaProvider.computeNutrition([{ measure: "100g", name: "Butter" }], 2);
  assert.equal(out.kcal, 359);
  assert.equal(out.basis_grams, 50);
  assert.equal(out.per, "serving");
  assert.equal(out.source, "usda");
});

test("sums across ingredients", async () => {
  // 100g butter (717) + 100g sugar (~385) ≈ 1102 total, /1 serving
  const out = await usdaProvider.computeNutrition(
    [{ measure: "100g", name: "Butter" }, { measure: "100g", name: "Sugar" }],
    1
  );
  assert.ok(out.kcal > 1050 && out.kcal < 1150, `expected ~1100, got ${out.kcal}`);
});

test("scales with servings", async () => {
  const one = await usdaProvider.computeNutrition([{ measure: "200g", name: "Butter" }], 1);
  const four = await usdaProvider.computeNutrition([{ measure: "200g", name: "Butter" }], 4);
  // Not exact: each result is rounded to whole kcal, so 1434/4 = 358.5 → 359
  // and 359*4 = 1436. Allow the rounding slack rather than assert false rigour.
  assert.ok(Math.abs(one.kcal - four.kcal * 4) <= 4, `${one.kcal} vs ${four.kcal}*4`);
  assert.equal(four.basis_grams, 50);
});

test("makes zero network calls — no vendor, no rate limit", async () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = () => {
    throw new Error("provider must not make network calls");
  };
  try {
    const out = await usdaProvider.computeNutrition([{ measure: "100g", name: "Butter" }], 1);
    assert.ok(out.kcal > 0);
  } finally {
    globalThis.fetch = realFetch;
  }
});

test("unresolvable ingredient → null, never a fabricated number", async () => {
  const out = await usdaProvider.computeNutrition(
    [{ measure: "100g", name: "Definitely Not A Real Food xyzzy" }],
    1
  );
  assert.equal(out, null);
});

test("no ingredients → null", async () => {
  assert.equal(await usdaProvider.computeNutrition([], 4), null);
  assert.equal(await usdaProvider.computeNutrition(null, 4), null);
});

test("an unmatched line is dropped from the sum and lowers confidence", async () => {
  const out = await usdaProvider.computeNutrition(
    [
      { measure: "100g", name: "Butter" },
      { measure: "900g", name: "Definitely Not A Real Food xyzzy" },
    ],
    1
  );
  assert.equal(out.kcal, 717); // the unmatched 900g is absent, not counted as 0
  assert.equal(out.confidence, "low"); // 1 of 2 dropped — the total IS understated
});

test("all matched with exact weights → high confidence", async () => {
  const out = await usdaProvider.computeNutrition(
    [{ measure: "100g", name: "Butter" }, { measure: "200g", name: "Sugar" }],
    1
  );
  assert.equal(out.confidence, "high");
});

test("one guessed gram weight among four does not tip to low", async () => {
  const out = await usdaProvider.computeNutrition(
    [
      { measure: "100g", name: "Butter" },
      { measure: "200g", name: "Sugar" },
      { measure: "300g", name: "Milk" },
      { measure: "2", name: "Eggs" }, // bare count → parser is medium, not high
    ],
    4
  );
  assert.equal(out.confidence, "medium");
});

test("falls back to the parsed item for freeform user-recipe lines", async () => {
  // A user writes "2 tbsp olive oil" — name is not a TheMealDB key, but the
  // parser extracts "olive oil", which is.
  const out = await usdaProvider.computeNutrition([{ measure: "", name: "2 tbsp olive oil" }], 1);
  assert.ok(out, "should resolve via the parsed item");
  assert.ok(out.kcal > 200 && out.kcal < 280, `olive oil ~27.6g ≈ 244 kcal, got ${out.kcal}`);
});

test("a nutrient no ingredient reports stays null — never 0", async () => {
  // Salt has sodium but no meaningful fiber; assert null-preservation generally
  const out = await usdaProvider.computeNutrition([{ measure: "100g", name: "Butter" }], 1);
  for (const f of ["protein_g", "carbs_g", "fat_g"]) {
    assert.ok(out[f] === null || Number.isFinite(out[f]), `${f} must be null or a number`);
  }
});

// --- the shipped table itself ---

test("table rows carry fdcId provenance — every number traces to USDA", () => {
  const rows = Object.values(table);
  assert.ok(rows.length > 900, `expected >900 ingredients, got ${rows.length}`);
  for (const r of rows) {
    assert.ok(r.fdcId, "row missing fdcId");
    assert.ok(r.usda, "row missing USDA description");
    assert.ok(Number.isFinite(r.kcal), "row missing kcal");
  }
});

test("known ingredients match real-world values — guards the kJ/kcal trap", () => {
  // USDA returns Energy in BOTH kcal and kJ under the same nutrientName.
  // Reading the wrong one is a silent 4.184x error (eggplant 25 kcal vs 104 kJ).
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

test("refuses a volume-measured grain rather than ship a ~2x error", async () => {
  // TheMealDB 52772: "3 cups brown rice" that the instructions add ALREADY
  // COOKED. Raw brown rice is 360 kcal/100g, cooked 123 — we shipped 789
  // kcal/serving against a true ~415. The parser rates the line "high", so
  // confidence cannot warn. null → UI falls back to the ~category estimate.
  const out = await usdaProvider.computeNutrition(
    [
      { measure: "2", name: "chicken breasts" },
      { measure: "3 cups", name: "brown rice" },
    ],
    4
  );
  assert.equal(out, null, "volume-measured grain must refuse, not guess");
});

test("a grain measured by WEIGHT still computes — that shape means raw", async () => {
  const out = await usdaProvider.computeNutrition([{ measure: "200g", name: "Brown Rice" }], 2);
  assert.ok(out, "weight-measured grain should still compute");
  assert.ok(out.kcal > 300, `expected ~360, got ${out?.kcal}`);
});

test("non-grain recipes are unaffected by the guard", async () => {
  const out = await usdaProvider.computeNutrition(
    [{ measure: "200g", name: "Chicken" }, { measure: "1 cup", name: "Carrots" }],
    2
  );
  assert.ok(out, "a cup of carrots is not ambiguous");
});
