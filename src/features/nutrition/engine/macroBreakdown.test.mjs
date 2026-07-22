// Ported v1 suite: backend/test/macroBreakdown.test.mjs (TestFlight QA
// 2026-07-21), run against the TS engine port. Expected values are LAW.
// These tests pin the protein/carb/fat breakdown — a kcal-only assertion
// cannot catch a fabricated macro split (the 20 g phantom-carbs class).
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { computeNutrition } from "./compute";
import { lookup } from "./lookup";

const require = createRequire(import.meta.url);
const table = require("./data/usdaTable.json");

// ── The lean-mince identity (the 3x-fat bug) ────────────────────────────────
test("lean mince rows are actually lean", () => {
  for (const key of ["lean minced steak", "lean minced beef"]) {
    const row = table[key];
    assert.ok(row, `${key} must exist`);
    assert.ok(!/70%/.test(row.usda), `${key} must not be the 70/30 record`);
    assert.ok(row.fat_g < 15, `${key} fat ${row.fat_g} must be < 15 g/100g`);
    assert.ok(row.protein_g >= 17, `${key} protein ${row.protein_g} must be >= 17`);
  }
});

// ── Trailing prep clauses resolve (the fallback-trigger bug) ────────────────
test("trailing prep clauses don't hide the food", () => {
  assert.match(lookup("chicken breast, sliced thin", null, false)?.usda ?? "", /breast/i);
  assert.match(lookup("garlic, minced", null, false)?.usda ?? "", /garlic/i);
  assert.match(lookup("fresh parsley, chopped", null, false)?.usda ?? "", /parsley/i);
});

test("identity words in a trailing clause still block the strip", () => {
  // "dried" changes what the food IS — the clause must not be dropped just
  // to force a match, so this stays an honest miss.
  assert.equal(lookup("butter, dried", null, false), null);
});

// ── Recipe 3 from QA: Garlic butter chicken (x0.5 → 1 serving) ─────────────
// Ground truth ~415 kcal / 46 P / 3 C / 23 F. Assert the macro SPLIT, not
// just kcal — especially that carbs stay trace: nothing in this list can
// supply 20 g.
test("garlic butter chicken computes with an honest macro split", () => {
  const n = computeNutrition({
    ingredients: [
      { measure: "200 g", name: "chicken breast, sliced thin" },
      { measure: "14.2 g", name: "butter" },
      { measure: "0.5 tbsp", name: "olive oil" },
      { measure: "1.5 cloves", name: "garlic, minced" },
      { measure: "0.3 tsp", name: "paprika" },
      { measure: "0.3 tsp", name: "salt" },
      { measure: "0.1 tsp", name: "black pepper" },
      { measure: "0.5 tbsp", name: "fresh parsley, chopped" },
      { measure: "0.5 tbsp", name: "lemon juice" },
    ],
    servings: 1,
  });
  assert.ok(n, "must compute — never fall back to the category template");
  assert.ok(n.kcal >= 320 && n.kcal <= 500, `kcal ${n.kcal} out of range`);
  assert.ok(n.protein_g >= 35, `protein ${n.protein_g} too low`);
  assert.ok(n.carbs_g <= 5, `carbs ${n.carbs_g} — phantom carbs are back`);
  assert.ok(n.fat_g >= 15 && n.fat_g <= 30, `fat ${n.fat_g} out of range`);
});

// ── Recipe 2 from QA: Steak & beetroot naan (x0.3 → 1 serving) ─────────────
test("steak & beetroot naan is no longer 3x high on fat", () => {
  const n = computeNutrition({
    ingredients: [
      { measure: "125 g", name: "Lean Minced Steak" },
      { measure: "25 g", name: "Cooked Beetroot" },
      { measure: "45 g", name: "Naan Bread" },
      { measure: "12.5 g", name: "Rocket" },
      { measure: "15 ml", name: "Soured cream and chive dip" },
    ],
    servings: 1,
  });
  assert.ok(n, "must compute");
  assert.ok(n.kcal >= 300 && n.kcal <= 450, `kcal ${n.kcal} out of range`);
  assert.ok(n.protein_g >= 25, `protein ${n.protein_g} too low`);
  assert.ok(n.carbs_g >= 15 && n.carbs_g <= 35, `carbs ${n.carbs_g} out of range`);
  assert.ok(n.fat_g < 20, `fat ${n.fat_g} — the 70/30 record is back`);
});
