// N3 table-audit regressions: the nine identity-corrupt rows found by the
// full-table sweep (Atwater + identity-word + class bounds), pinned so a
// future table rebuild can't reintroduce them. Each was a build-time fuzzy
// match onto a DIFFERENT food (golden syrup → raw apples, oats → oat bran,
// veal → veal fat, peanut oil → roasted peanuts…).
import test from "node:test";
import assert from "node:assert/strict";
import table from "../src/lib/nutrition/usdaTable.json" with { type: "json" };

const row = (k) => table[k];

test("syrup/starch/flour rows are the concentrated foods, not their look-alikes", () => {
  assert.ok(row("golden syrup").kcal > 250, "syrup is sugar-dense, not an apple");
  assert.ok(row("golden syrup").carbs_g > 70);
  assert.ok(row("potato starch").kcal > 330, "starch is dry powder, not potato skin");
  assert.ok(row("potato starch").carbs_g > 80);
  assert.ok(row("bread flour").carbs_g > 60, "flour, not a baked loaf");
  assert.ok(row("oats").kcal > 330, "dry rolled oats, not oat bran");
});

test("oils are oils: ~900 kcal, ~100 g fat", () => {
  for (const k of ["peanut oil", "ground nut oil"]) {
    assert.ok(row(k).kcal > 850, `${k} kcal ${row(k).kcal}`);
    assert.ok(row(k).fat_g > 95, `${k} fat ${row(k).fat_g}`);
    assert.equal(row(k).carbs_g, 0);
  }
});

test("veal is meat, not the trimmed-off fat; tortillas are not chips; vinegar is not wine", () => {
  assert.ok(row("veal").protein_g > 15 && row("veal").kcal < 250, "lean-and-fat composite");
  assert.ok(row("tortillas").kcal < 350, "flour tortilla, not fried chips");
  assert.ok(row("white wine vinegar").kcal < 25, "vinegar's alcohol is gone");
});
