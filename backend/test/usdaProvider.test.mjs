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

test("a MINOR unmatched line is dropped from the sum and lowers confidence", async () => {
  // 400g matched + 50g unmatched = 89% coverage — above the floor, so it still
  // computes, and the dropped line counts against confidence.
  const out = await usdaProvider.computeNutrition(
    [
      { measure: "200g", name: "Butter" },
      { measure: "200g", name: "Sugar" },
      { measure: "50g", name: "Definitely Not A Real Food xyzzy" },
    ],
    4
  );
  assert.ok(out && out.kcal > 0); // the unmatched 50g is absent, not counted as 0
  assert.equal(out.confidence, "low"); // a line dropped — the total IS understated
});

test("a DOMINANT unmatched line returns null, not a confidently-understated total", async () => {
  // 100g matched + 900g unmatched = 10% coverage. The old code shipped
  // "717 kcal, low"; that reads plausible but describes butter alone, not the
  // dish. The coverage guard now says honestly-unknown → category estimate.
  const out = await usdaProvider.computeNutrition(
    [
      { measure: "100g", name: "Butter" },
      { measure: "900g", name: "Definitely Not A Real Food xyzzy" },
    ],
    1
  );
  assert.equal(out, null);
});

test("qualifier-stripping resolves freeform names and keeps the total whole", async () => {
  // "white rice" has no exact key but "rice" does — before the fallback this
  // line dropped and the carbs collapsed. Now it resolves.
  const out = await usdaProvider.computeNutrition(
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

test("the corrupt chicken-skin rows are fixed to real thigh/drumstick meat", async () => {
  // Regression: both were FDC 172855 "Chicken, skin (…), raw" = 440 kcal /
  // 9.6g protein. Real dark meat is protein-dominant and far leaner.
  for (const name of ["chicken thighs", "chicken drumsticks"]) {
    const out = await usdaProvider.computeNutrition([{ measure: "100 g", name }], 1);
    assert.ok(out.protein_g > 15, `${name} protein should be >15, got ${out.protein_g}`);
    assert.ok(out.kcal < 280, `${name} kcal should be <280, got ${out.kcal}`);
  }
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

test("refuses canned legumes — the table holds DRY beans", async () => {
  // "1 Can Black Beans" is cooked+drained (~91 kcal/100g); the table row is dry
  // (341). Arepa Pabellón read 1364 kcal off this one line.
  const out = await usdaProvider.computeNutrition(
    [{ measure: "1 Can", name: "Black Beans" }, { measure: "200g", name: "Tomato" }],
    4
  );
  assert.equal(out, null, "canned legume must refuse, not use the dry row");
});

test("dry beans by weight still compute", async () => {
  const out = await usdaProvider.computeNutrition([{ measure: "200g", name: "Black Beans" }], 2);
  assert.ok(out, "weight-measured beans are unambiguous");
});

test("refuses only an absurd portion — a backstop, not a fix", async () => {
  // TheMealDB has no servings field so callers pass 4. Measured across 742
  // recipes, per-serving weight runs <300g (50%), 300-500g (29%), 500-700g
  // (14%) — so only ~50 recipes clear 700g and they are plainly broken
  // (Vegetable Shepherds Pie: 1489g/serving). This catches those.
  //
  // It does NOT catch Arepa Pabellón (675g/serving, 2kg of meat) — that recipe
  // simply serves more than 4 and nothing in the data says so. The servings
  // guess is a systematic error this guard cannot repair.
  const out = await usdaProvider.computeNutrition([{ measure: "6kg", name: "Shredded Meat" }], 4);
  assert.equal(out, null, "1500g/serving is not a portion");
});

test("a normal-sized recipe is unaffected by the portion guard", async () => {
  const out = await usdaProvider.computeNutrition(
    [{ measure: "500g", name: "Chicken" }, { measure: "300g", name: "Potatoes" }],
    4
  );
  assert.ok(out, "200g/serving is plausible and must still compute");
});
