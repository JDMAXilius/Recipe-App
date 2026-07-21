// Macro-breakdown regressions (TestFlight QA 2026-07-21).
//
// The lesson from that pass: a recipe's CALORIE total can look right while
// its macro split is fabricated — garlic butter chicken showed 400 kcal
// (plausible) with 20 g of phantom carbs (the category template, not the
// ingredients). A kcal-only assertion cannot catch that class of bug, so
// these tests pin the protein/carb/fat breakdown of the two QA recipes.
//
// Runs with keys empty (see package.json test script): everything below is
// the deterministic path — no resolver, no network.
import { test } from "node:test";
import assert from "node:assert/strict";
import { usdaProvider, lookup } from "../src/lib/nutrition/usdaProvider.js";
import table from "../src/lib/nutrition/usdaTable.json" with { type: "json" };

// ── The lean-mince identity (the 3x-fat bug) ────────────────────────────────
// "lean minced steak"/"lean minced beef" pointed at the 70/30 record — the
// OPPOSITE of lean. Interim repair maps both at the verified grass-fed row;
// fix-table-identities.mjs upgrades them to the true 95/5 record when a USDA
// key is present. Either way these bounds must hold.
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
// Ground truth ~415 kcal / 46 P / 3 C / 23 F. The app previously fell back
// to the Chicken template (400/38/20/18) because the three comma-clause
// names above failed to resolve. Assert the macro SPLIT, not just kcal —
// especially that carbs stay trace: nothing in this list can supply 20 g.
test("garlic butter chicken computes with an honest macro split", async () => {
  const n = await usdaProvider.computeNutrition(
    [
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
    1
  );
  assert.ok(n, "must compute — never fall back to the category template");
  assert.ok(n.kcal >= 320 && n.kcal <= 500, `kcal ${n.kcal} out of range`);
  assert.ok(n.protein_g >= 35, `protein ${n.protein_g} too low`);
  assert.ok(n.carbs_g <= 5, `carbs ${n.carbs_g} — phantom carbs are back`);
  assert.ok(n.fat_g >= 15 && n.fat_g <= 30, `fat ${n.fat_g} out of range`);
});

// ── Recipe 2 from QA: Steak & beetroot naan (x0.3 → 1 serving) ─────────────
// Ground truth (5% lean mince) ~345 kcal / 31 P / 26 C / 12 F. The app
// shipped 520/22/18/40 — fat 3x high off the 70/30 record. The interim
// grass-fed row lands fat ~18 g; the 95/5 repair tightens it to ~12.
test("steak & beetroot naan is no longer 3x high on fat", async () => {
  const n = await usdaProvider.computeNutrition(
    [
      { measure: "125 g", name: "Lean Minced Steak" },
      { measure: "25 g", name: "Cooked Beetroot" },
      { measure: "45 g", name: "Naan Bread" },
      { measure: "12.5 g", name: "Rocket" },
      { measure: "15 ml", name: "Soured cream and chive dip" },
    ],
    1
  );
  assert.ok(n, "must compute");
  assert.ok(n.kcal >= 300 && n.kcal <= 450, `kcal ${n.kcal} out of range`);
  assert.ok(n.protein_g >= 25, `protein ${n.protein_g} too low`);
  assert.ok(n.carbs_g >= 15 && n.carbs_g <= 35, `carbs ${n.carbs_g} out of range`);
  assert.ok(n.fat_g < 20, `fat ${n.fat_g} — the 70/30 record is back`);
});
