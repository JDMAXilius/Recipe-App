// Ported v1 suite: backend/test/usdaProvider.test.mjs, run against the TS
// engine port. Expected values are LAW — identical to v1, none adjusted.
// Only the call shape changes: v1 positional (ingredients, servings) becomes
// the contract's single input object; the engine is sync (no I/O to await).
import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { computeNutrition } from "./compute";
import { COOKED_WORD } from "./lookup";

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

// ── T3: cooked-yield detection for UNCURATED lines ──────────────────────────
// A user-imported line that literally says "cooked rice" has no recipeFacts, so
// it used to resolve to RAW rice (~3x over). A literal cooked-state word in the
// line is explicit text (not an instruction inference), and it flips to the
// cooked record ONLY when one exists — so it can only improve, never regress.
// Every assertion checks the P/C/F split, not kcal alone.
test("T3: uncurated 'cooked rice' uses the cooked record (~130/100g), not raw 360", () => {
  const out = compute([{ measure: "200g", name: "cooked rice" }], 1);
  // cooked white rice: 130 kcal, 2.69 P, 28.2 C, 0.28 F per 100g × 2
  assert.equal(out.kcal, 260);
  assert.ok(out.carbs_g > 55 && out.carbs_g < 58, `cooked-rice carbs ~56.4, got ${out.carbs_g}`);
  assert.ok(out.protein_g > 5 && out.protein_g < 6, `cooked-rice protein ~5.4, got ${out.protein_g}`);
  assert.ok(out.fat_g < 1, `cooked-rice fat ~0.6, got ${out.fat_g}`);
});

test("T3: uncurated 'cooked chickpeas' uses the cooked record (~139/100g), not raw 378", () => {
  const out = compute([{ measure: "200g", name: "cooked chickpeas" }], 1);
  // canned chickpeas: 139 kcal, 7.05 P, 22.5 C, 2.77 F per 100g × 2
  assert.equal(out.kcal, 278);
  assert.ok(out.carbs_g > 44 && out.carbs_g < 46, `cooked-chickpea carbs ~45, got ${out.carbs_g}`);
  assert.ok(out.protein_g > 13 && out.protein_g < 15, `cooked-chickpea protein ~14.1, got ${out.protein_g}`);
  assert.ok(out.fat_g > 5 && out.fat_g < 6, `cooked-chickpea fat ~5.5, got ${out.fat_g}`);
});

test("T3: uncurated 'boiled potatoes' uses the new boiled-potato record (~87/100g)", () => {
  const out = compute([{ measure: "200g", name: "boiled potatoes" }], 1);
  // Potatoes, boiled, cooked in skin, flesh: 87 kcal, 1.87 P, 20.13 C, 0.1 F × 2
  assert.equal(out.kcal, 174);
  assert.ok(out.carbs_g > 39 && out.carbs_g < 41, `boiled-potato carbs ~40.3, got ${out.carbs_g}`);
  assert.ok(out.protein_g > 3 && out.protein_g < 4.5, `boiled-potato protein ~3.7, got ${out.protein_g}`);
  assert.ok(out.fat_g < 0.5, `boiled-potato fat ~0.2, got ${out.fat_g}`);
});

test("T3: no-regression — a cooked-word line with NO cooked record stays RAW, never null", () => {
  // broccoli has a raw record but no cooked record: the auto path must NOT fire,
  // so the line keeps its raw value and is not honest-dropped to null.
  const cookedLine = compute([{ measure: "200g", name: "cooked broccoli" }], 1);
  const plain = compute([{ measure: "200g", name: "broccoli" }], 1);
  assert.ok(cookedLine, "cooked broccoli must not drop to null (no cooked record → stay raw)");
  assert.equal(cookedLine.kcal, plain.kcal);
  assert.equal(cookedLine.carbs_g, plain.carbs_g);
  assert.equal(cookedLine.protein_g, plain.protein_g);
  assert.equal(cookedLine.fat_g, plain.fat_g);
});

test("T3: false positives — the cooked-word regex excludes roasted/grilled/fried/baked", () => {
  // Those words usually NAME the ingredient (roasted peppers, roasted sesame oil,
  // baked beans product), so they must NOT trigger a raw→cooked flip.
  for (const w of ["roasted", "grilled", "fried", "baked", "roasted red peppers", "baked beans"]) {
    assert.equal(COOKED_WORD.test(w), false, `"${w}" must not read as a cooked-state word`);
  }
  for (const w of ["cooked", "boiled", "steamed", "par-boiled", "parboiled", "pre-cooked"]) {
    assert.ok(COOKED_WORD.test(w), `"${w}" must read as a cooked-state word`);
  }
});

test("T3: 'baked beans' stays on its RAW record, not flipped to the cooked one", () => {
  // baked beans has BOTH a raw (338/100g) and cooked (94/100g) record, so a
  // wrongful flip would be visible: 200g → 676 raw vs 188 cooked. "baked" is
  // excluded, so it must land on 676 (raw).
  const out = compute([{ measure: "200g", name: "baked beans" }], 1);
  assert.equal(out.kcal, 676);
  assert.ok(out.carbs_g > 100, `raw baked-beans carbs ~107.8, got ${out.carbs_g}`);
});

// ── T3 rev: poisoned steamed-rice rows + auto-cook denylist ─────────────────
test("T3: uncurated 'steamed rice' uses cooked rice (~130/100g), NOT the poisoned 21-kcal flower row", () => {
  // The steamed-rice/steamed-jasmine-rice keys pointed at "Sesbania flower"
  // (21 kcal) — a 6x under-count. Removed, so they fall through to the rice base.
  for (const name of ["steamed rice", "steamed jasmine rice"]) {
    const out = compute([{ measure: "200g", name }], 1);
    assert.equal(out.kcal, 260, `${name} → 260 (cooked rice x2), not 42 (flower)`);
    assert.ok(out.carbs_g > 55 && out.carbs_g < 58, `${name} carbs ~56.4, got ${out.carbs_g}`);
    assert.ok(out.protein_g > 5 && out.protein_g < 6, `${name} protein ~5.4, got ${out.protein_g}`);
    assert.ok(out.fat_g < 1, `${name} fat ~0.6, got ${out.fat_g}`);
  }
});

test("T3: auto-cook denylist — 'boiled ham' stays on raw product (106), not the +62% cooked row (172)", () => {
  const out = compute([{ measure: "200g", name: "boiled ham" }], 1);
  // HORMEL Cure 81 Ham raw: 106 kcal, 18.4 P, 3.59 F, 0.21 C per 100g × 2.
  assert.equal(out.kcal, 212, `boiled ham → 212 (raw 106 x2), not 344 (cooked 172)`);
  assert.ok(out.protein_g > 36 && out.protein_g < 38, `boiled-ham protein ~36.8, got ${out.protein_g}`);
  assert.ok(out.fat_g > 6 && out.fat_g < 8, `boiled-ham fat ~7.2, got ${out.fat_g}`);
});

test("T3: auto-cook denylist — 'boiled eggs' stays on raw egg (143), not the FRIED cooked row (196)", () => {
  for (const name of ["boiled eggs", "hard boiled eggs"]) {
    const out = compute([{ measure: "200g", name }], 1);
    // Egg, whole, raw, fresh: 143 kcal, 12.6 P, 9.51 F, 0.72 C per 100g × 2.
    assert.equal(out.kcal, 286, `${name} → 286 (raw egg 143 x2), not 392 (fried 196)`);
    assert.ok(out.protein_g > 24 && out.protein_g < 27, `${name} protein ~25.2, got ${out.protein_g}`);
    assert.ok(out.fat_g > 18 && out.fat_g < 20, `${name} fat ~19, got ${out.fat_g}`);
  }
});

test("T3: denylist does NOT catch 'egg noodles' — head noun is noodles, so it still auto-cooks", () => {
  // "cooked egg noodles" must still flip to the cooked egg-noodle record (138),
  // proving the denylist matches the food name's END, not any 'egg' substring.
  const out = compute([{ measure: "200g", name: "cooked egg noodles" }], 1);
  assert.equal(out.kcal, 276, `cooked egg noodles → 276 (cooked 138 x2)`);
});
