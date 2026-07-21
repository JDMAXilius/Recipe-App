// Regression tests for the deterministic ingredient parser (B1.1).
// Run: npm test (node --test). No network, no DB.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseQty,
  parseIngredientLine,
  parseIngredients,
} from "../src/lib/nutrition/parseIngredient.js";

test("parseQty handles plain, decimal, comma-decimal", () => {
  assert.equal(parseQty("2"), 2);
  assert.equal(parseQty("2.5"), 2.5);
  assert.equal(parseQty("2,5"), 2.5);
});

test("parseQty handles fractions, mixed numbers, unicode", () => {
  assert.equal(parseQty("1/2"), 0.5);
  assert.equal(parseQty("2 1/2"), 2.5);
  assert.equal(parseQty("½"), 0.5);
  assert.equal(parseQty("1½"), 1.5);
});

test("parseQty resolves ranges to the midpoint (C20)", () => {
  assert.equal(parseQty("2-3"), 2.5);
  assert.equal(parseQty("2 to 3"), 2.5);
  assert.equal(parseQty("2–3"), 2.5); // en dash
});

test("mass units convert exactly, high confidence", () => {
  const lb = parseIngredientLine("1 lb ground beef");
  assert.equal(lb.grams, 453.6);
  assert.equal(lb.confidence, "high");
  const kg = parseIngredientLine("1.5 kg chicken thighs");
  assert.equal(kg.grams, 1500);
});

test("volume converts via density (flour ≠ water)", () => {
  const flour = parseIngredientLine("2 1/2 cups plain flour");
  assert.ok(Math.abs(flour.grams - 318) < 1, `got ${flour.grams}`);
  const water = parseIngredientLine("1 cup water");
  assert.equal(water.grams, 240);
});

test("USDA-verified piece weights are high; unverified ones stay medium", () => {
  // Verified against USDA's own foodPortions ("1 large egg = 50 g") →
  // pieceWeights.json → the same authority as the food's per-100g numbers.
  const eggs = parseIngredientLine("2 eggs");
  assert.equal(eggs.grams, 100);
  assert.equal(eggs.confidence, "high");
  // Garlic: USDA's SR Legacy record publishes "1 clove = 3 g" (the Foundation
  // record carries only "1 RACC" — hence the candidate walk in
  // build-piece-weights.mjs). Verified, so high.
  const garlic = parseIngredientLine("3 cloves garlic");
  assert.equal(garlic.grams, 9);
  assert.equal(garlic.confidence, "high");
  // Shallot: USDA publishes NO whole-shallot portion, only "1 tbsp chopped",
  // which is a volume. Our 30 g/each stays an estimate and must say so — this
  // is the case that proves the file is provenance and not a rubber stamp.
  const shallot = parseIngredientLine("2 shallots");
  assert.equal(shallot.grams, 60);
  assert.equal(shallot.confidence, "medium");
});

test("unresolvable lines are honest: null grams, low confidence", () => {
  const salt = parseIngredientLine("salt to taste");
  assert.equal(salt.grams, null);
  assert.equal(salt.confidence, "low");
  assert.equal(salt.item, "salt to taste");
});

test("accepts the app-wide { measure, name } pair shape", () => {
  const butter = parseIngredientLine({ measure: "2 tbsp", name: "butter" });
  assert.equal(butter.unit, "tbsp");
  assert.ok(butter.grams > 20 && butter.grams < 35);
});

test("parseIngredients aggregates totals and worst-weights confidence", () => {
  const all = parseIngredients(["2 cups flour", "1 cup milk", "2 eggs"]);
  assert.equal(all.lines.length, 3);
  assert.ok(all.totalGrams > 550 && all.totalGrams < 650);
  // Eggs no longer drag the aggregate down: the 50 g/large-egg weight is USDA's
  // own published portion, not our guess, so all three lines are high.
  assert.equal(all.confidence, "high");
  const mostlyUnknown = parseIngredients(["salt to taste", "a splash of love", "1 cup milk"]);
  assert.equal(mostlyUnknown.confidence, "low");
});

test("confidence sweep 2026-07-21: juice-of, dual-unit, splash, bare counts", () => {
  const lime = parseIngredientLine({ measure: "Juice of 1", name: "Lime" });
  assert.equal(lime.grams, 30);
  const halfLemon = parseIngredientLine({ measure: "Juice of 1/2", name: "Lemon" });
  assert.equal(halfLemon.grams, 23.5);
  const dual = parseIngredientLine({ measure: "50g/1¾oz", name: "Flaked Almonds" });
  assert.equal(dual.grams, 50); // metric side wins, imperial alternative dropped
  const splash = parseIngredientLine({ measure: "Splash", name: "Water" });
  assert.equal(splash.grams, 10);
  // 280 g = USDA "1 large (8-1/4\" long)" — replaced the hand-set 300 g estimate.
  const cukes = parseIngredientLine({ measure: "1", name: "Cucumber" });
  assert.equal(cukes.grams, 280);
  assert.equal(cukes.confidence, "high");
});

test("sweetener packet weighs ~1 g, not the 100 g generic packet", () => {
  const stevia = parseIngredientLine({ measure: "1 packet", name: "stevia sweetener" });
  assert.equal(stevia.grams, 1);
  const yeast = parseIngredientLine({ measure: "1 packet", name: "dried yeast" });
  assert.equal(yeast.grams, 7); // existing rows untouched
});

test("unquantified frying oil counts a conservative tbsp, flagged as an estimate", () => {
  // Counting zero understated every fried dish; published absorption is 8-25%
  // of food weight, far too wide to claim exactness. One tbsp, medium.
  const fry = parseIngredientLine({ measure: "For frying", name: "Vegetable Oil" });
  assert.equal(fry.grams, 14);
  assert.equal(fry.confidence, "medium");
  // An explicit amount still wins over the fallback.
  const explicit = parseIngredientLine({ measure: "2 tbsp", name: "Olive Oil" });
  assert.ok(explicit.grams > 25 && explicit.confidence === "high");
  // Non-fat lines are untouched — "To serve, Rice" is not a hidden tbsp of oil.
  assert.equal(parseIngredientLine({ measure: "To serve", name: "Rice" }).grams, null);
});

test("verified weights survive plurals, embedded piece nouns, and unit synonyms", () => {
  // "potato" + "s" is not "potatoes" — the naive plural rule missed 36 corpus
  // lines that had a verified weight sitting right there.
  assert.equal(parseIngredientLine({ measure: "2", name: "Potatoes" }).confidence, "high");
  assert.equal(parseIngredientLine({ measure: "3", name: "Tomatoes" }).confidence, "high");
  // TheMealDB puts the piece noun in the NAME: "1 | Garlic Clove".
  const gc = parseIngredientLine({ measure: "1", name: "Garlic Clove" });
  assert.equal(gc.grams, 3);
  assert.equal(gc.confidence, "high");
  // British measure words for the same physical piece USDA names.
  assert.equal(parseIngredientLine({ measure: "2 rashers", name: "Bacon" }).confidence, "high");
  assert.equal(parseIngredientLine({ measure: "2 sticks", name: "Celery" }).grams, 80);
});

test("bare-count whole items resolve from USDA's own foodPortions (2026-07-21)", () => {
  // Each of these was a corpus line with a known food and NO grams: dropped
  // from the sum AND counted as doubt. Every weight below is the exact
  // foodPortion USDA publishes for that record — see pieceWeights.json.
  const cases = [
    // "1 whole chicken", not a bare "1 Chicken": the corpus writes "5 boneless
    // Chicken" meaning breasts, and the whole-bird weight made that 5230 g at
    // HIGH confidence. The row is scoped to the explicit whole form; a bare
    // count of "Chicken" is genuinely ambiguous and now resolves to null.
    [{ measure: "1 whole", name: "Chicken" }, 1046],
    [{ measure: "4", name: "Pork Chops" }, 796], // 199 g "1 chop without refuse"
    [{ measure: "8", name: "Chicken drumsticks" }, 1040], // 130 g "1 drumstick"
    [{ measure: "2", name: "Sweetcorn" }, 204], // 102 g "1 ear, medium ... yields"
    [{ measure: "10", name: "Dried Apricots" }, 35], // 3.5 g "1 half"
    [{ measure: "12", name: "Filo Pastry" }, 228], // 19 g "1 sheet dough"
    [{ measure: "8", name: "Prawns" }, 48], // 6 g "1 medium" shrimp
    [{ measure: "8", name: "Oysters" }, 112], // "6 medium" = 84 g → 14 g each
    [{ measure: "4", name: "Figs" }, 200], // 50 g "1 medium", not the 64 g large
    [{ measure: "6", name: "Prunes" }, 57], // 9.5 g "1 prune, pitted"
    [{ measure: "2", name: "turnips" }, 244], // 122 g "1 medium"
    [{ measure: "16", name: "Black Olives" }, 70.4], // 4.4 g "1 large"
    [{ measure: "2", name: "English Muffins" }, 114], // 57 g "1 muffin"
    [{ measure: "12", name: "Hard Taco Shells" }, 154.8], // 12.9 g "1 shell"
    [{ measure: "8", name: "Pears" }, 1416], // 177 g "1 medium"
  ];
  for (const [line, grams] of cases) {
    const p = parseIngredientLine(line);
    assert.equal(p.grams, grams, `${line.measure} ${line.name}`);
    assert.equal(p.confidence, "high", `${line.measure} ${line.name}`);
  }
});

test("a size or state qualifier blocks the generic verified weight", () => {
  // The head-noun fallback ("baby new potatoes" → the potato row) was matching
  // straight through size words, so "6 cherry tomatoes" came out as 738 g of
  // beefsteak tomato at HIGH confidence. Now these fall back to their own
  // estimate and say so.
  const cherry = parseIngredientLine("6 cherry tomatoes");
  assert.equal(cherry.grams, 102); // 17 g each, estimated
  assert.equal(cherry.confidence, "medium");
  // King/tiger prawns are a size ABOVE USDA's largest shrimp portion, so they
  // must not inherit the 6 g medium — no weight beats a wrong one.
  assert.equal(parseIngredientLine({ measure: "6", name: "King Prawns" }).grams, null);
  // A key that PREFIXES the name is a different food entirely.
  assert.equal(parseIngredientLine("1 chicken stock").grams, null);
  assert.equal(parseIngredientLine("1 coconut milk").grams, null);
  // ...but the plain and whole forms still resolve.
  assert.equal(parseIngredientLine("2 potatoes").confidence, "high");
  assert.equal(parseIngredientLine("1 whole chicken").grams, 1046);
});

test("Challots is TheMealDB's spelling of shallots (5 corpus lines)", () => {
  const ch = parseIngredientLine({ measure: "5", name: "Challots" });
  assert.equal(ch.grams, 150); // 30 g each
  // Still an estimate: USDA publishes no whole-shallot portion, only a volume.
  assert.equal(ch.confidence, "medium");
});

test("a parenthesised amount is the line TOTAL unless a pack noun follows", () => {
  // Corpus-wide, "(N g)" restates the amount just given. Multiplying it read
  // "4 (650g) Chicken Thighs" as 2600 g and pushed Coq au vin past the cap.
  assert.equal(parseIngredientLine({ measure: "4 (650g)", name: "Chicken Thighs" }).grams, 650);
  assert.equal(parseIngredientLine({ measure: "2 (460g)", name: "Chicken Legs" }).grams, 460);
  // A pack noun DOES mean per-unit — that reading must survive.
  assert.equal(parseIngredientLine({ measure: "2 (400g) tins", name: "Chopped Tomatoes" }).grams, 800);
});

test("a spice pepper does not inherit the vegetable-pepper weight", () => {
  // "8 Cayenne Pepper" was 960 g (3053 kcal) via the 120 g bell-pepper row.
  assert.equal(parseIngredientLine({ measure: "8", name: "Cayenne Pepper" }).grams, null);
  // Vegetable peppers still resolve.
  assert.equal(parseIngredientLine({ measure: "1", name: "Red Pepper" }).grams, 119);
  assert.equal(parseIngredientLine({ measure: "1", name: "Green Pepper" }).grams, 119);
});
