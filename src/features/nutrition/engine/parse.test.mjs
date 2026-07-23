// Ported v1 suite: backend/test/parseIngredient.test.mjs, run against the
// TS engine port. Expected values are LAW — identical to v1, none adjusted.
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseQty, parseIngredientLine, parseIngredients } from "./parse";

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

test("hyphenated mixed number 'N-N/N' = N + N/N, same as the space form", () => {
  assert.equal(parseQty("2-1/2"), 2.5);
  assert.equal(parseQty("1-1/2"), 1.5);
  assert.equal(parseQty("2-1/2"), parseQty("2 1/2")); // identical to space form
  // must NOT swallow the adjacent forms:
  assert.equal(parseQty("2-3"), 2.5); // range, not 2+3/(missing)
  assert.equal(parseQty("1/2-3/4"), 0.625); // fraction range, midpoint
});

test("hyphenated mixed number resolves grams; ranges/compounds unchanged (BUG A)", () => {
  const hy = parseIngredientLine("2-1/2 cups flour");
  assert.equal(hy.grams, 312.5);
  assert.equal(hy.confidence, "high");
  assert.equal(hy.item, "flour");
  // exactly the space form
  const sp = parseIngredientLine("2 1/2 cups flour");
  assert.equal(hy.grams, sp.grams);
  assert.equal(parseIngredientLine("1-1/2 cups milk").grams, 366);
  assert.equal(parseIngredientLine("2-1/2 cups water").grams, 592.5);
  // GUARD — hyphen between whole numbers is a range (midpoint), unchanged:
  assert.equal(parseIngredientLine("2-3 cups sugar").grams, 470);
  assert.equal(parseIngredientLine("2-3 tbsp oil").grams, 34.1);
  // GUARD — hyphen before a unit/word is a compound, not a mixed number:
  assert.equal(parseIngredientLine("1-inch piece ginger").grams, null);
  assert.equal(parseIngredientLine("9-inch pastry").grams, null);
});

test("mass units convert exactly, high confidence", () => {
  const lb = parseIngredientLine("1 lb ground beef");
  assert.equal(lb.grams, 453.6);
  assert.equal(lb.confidence, "high");
  const kg = parseIngredientLine("1.5 kg chicken thighs");
  assert.equal(kg.grams, 1500);
});

test("cups price from USDA's own cup portion, not a density guess", () => {
  const flour = parseIngredientLine("2 1/2 cups plain flour");
  assert.equal(flour.grams, 312.5);
  assert.equal(flour.confidence, "high");
  assert.equal(parseIngredientLine("1 cup water").grams, 237);
  assert.equal(parseIngredientLine("1 tbsp flour").grams, 7.8);
  assert.equal(parseIngredientLine("500 ml water").grams, 500);
});

test("a cup of solids is not a cup of water", () => {
  const cases = [
    [{ measure: "5 Cups", name: "Potatoes" }, 756],
    [{ measure: "3 cups", name: "Broad Beans" }, 327],
    [{ measure: "2 cups", name: "Cannellini Beans" }, 404],
    [{ measure: "2 cups", name: "Jam" }, 648],
    [{ measure: "1 cup", name: "Green Beans" }, 100],
    [{ measure: "2 cups", name: "Cornmeal" }, 244],
    [{ measure: "1 cup", name: "Mushrooms" }, 70],
    [{ measure: "2/3 Cup", name: "Tofu" }, 171.2],
  ];
  for (const [line, grams] of cases) {
    const p = parseIngredientLine(line);
    assert.equal(p.grams, grams, `${line.measure} ${line.name}`);
    assert.equal(p.confidence, "high", `${line.measure} ${line.name}`);
  }
  assert.equal(parseIngredientLine("1/2 cup Sweetened Condensed Milk").grams, 153);
  assert.equal(parseIngredientLine("2 cups Powdered Sugar").grams, 240);
  assert.equal(parseIngredientLine("1 cup Peanut Butter").grams, 258);
  assert.equal(parseIngredientLine("1 cup sun-dried tomatoes").grams, 54);
});

test("a cup USDA cannot price stays an honest estimate", () => {
  const chips = parseIngredientLine("2 cups Chocolate Chips");
  assert.equal(chips.grams, 480);
  assert.equal(chips.confidence, "medium");
  assert.equal(parseIngredientLine("1/4 cup Capers").confidence, "medium");
});

test("a named can size is a measurement, not a guess", () => {
  const cases = [
    [{ measure: "1 can", name: "Chickpeas" }, 253],
    [{ measure: "1 can", name: "Kidney Beans" }, 266],
    [{ measure: "1 can", name: "Refried Beans" }, 444],
    [{ measure: "3 cans", name: "Sweetcorn" }, 894],
    [{ measure: "1 Can", name: "Beets" }, 294],
    [{ measure: "1 can", name: "Tuna" }, 165],
    [{ measure: "1 Can", name: "Coconut Milk" }, 383],
    [{ measure: "1 Can", name: "Condensed Milk" }, 397],
    [{ measure: "1 can", name: "Chopped Tomatoes" }, 400],
    [{ measure: "3 cans", name: "Black Beans" }, 720],
    [{ measure: "2 cans", name: "Cannellini Beans" }, 480],
  ];
  for (const [line, grams] of cases) {
    const p = parseIngredientLine(line);
    assert.equal(p.grams, grams, `${line.measure} ${line.name}`);
    assert.equal(p.confidence, "high", `${line.measure} ${line.name}`);
  }
});

test("a can we cannot name keeps the 400 g guess AND says it is one", () => {
  const puree = parseIngredientLine({ measure: "3 cans", name: "Tomato Puree" });
  assert.equal(puree.grams, 1200);
  assert.equal(puree.confidence, "medium");
  const gravy = parseIngredientLine({ measure: "1 Can", name: "Beef Gravy" });
  assert.equal(gravy.grams, 400);
  assert.equal(gravy.confidence, "medium");
  assert.equal(parseIngredientLine({ measure: "1 can", name: "Baked Beans" }).grams, 400);
});

test("'coconut' contains 'nut' — the nuts density was pricing coconut milk", () => {
  const cm = parseIngredientLine({ measure: "400ml can", name: "Coconut Milk" });
  assert.equal(cm.grams, 384);
  assert.ok(Math.abs(parseIngredientLine("1 cup walnuts").grams - 80) < 1);
});

test("USDA-verified piece weights are high; unverified ones stay medium", () => {
  const eggs = parseIngredientLine("2 eggs");
  assert.equal(eggs.grams, 100);
  assert.equal(eggs.confidence, "high");
  const garlic = parseIngredientLine("3 cloves garlic");
  assert.equal(garlic.grams, 9);
  assert.equal(garlic.confidence, "high");
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
  assert.equal(dual.grams, 50);
  const splash = parseIngredientLine({ measure: "Splash", name: "Water" });
  assert.equal(splash.grams, 10);
  const cukes = parseIngredientLine({ measure: "1", name: "Cucumber" });
  assert.equal(cukes.grams, 280);
  assert.equal(cukes.confidence, "high");
});

test("sweetener packet weighs ~1 g, not the 100 g generic packet", () => {
  const stevia = parseIngredientLine({ measure: "1 packet", name: "stevia sweetener" });
  assert.equal(stevia.grams, 1);
  const yeast = parseIngredientLine({ measure: "1 packet", name: "dried yeast" });
  assert.equal(yeast.grams, 7);
});

test("unquantified frying oil counts a conservative tbsp, flagged as an estimate", () => {
  const fry = parseIngredientLine({ measure: "For frying", name: "Vegetable Oil" });
  assert.equal(fry.grams, 14);
  assert.equal(fry.confidence, "medium");
  const explicit = parseIngredientLine({ measure: "2 tbsp", name: "Olive Oil" });
  assert.ok(explicit.grams > 25 && explicit.confidence === "high");
  assert.equal(parseIngredientLine({ measure: "To serve", name: "Rice" }).grams, null);
});

test("verified weights survive plurals, embedded piece nouns, and unit synonyms", () => {
  assert.equal(parseIngredientLine({ measure: "2", name: "Potatoes" }).confidence, "high");
  assert.equal(parseIngredientLine({ measure: "3", name: "Tomatoes" }).confidence, "high");
  const gc = parseIngredientLine({ measure: "1", name: "Garlic Clove" });
  assert.equal(gc.grams, 3);
  assert.equal(gc.confidence, "high");
  assert.equal(parseIngredientLine({ measure: "2 rashers", name: "Bacon" }).confidence, "high");
  assert.equal(parseIngredientLine({ measure: "2 sticks", name: "Celery" }).grams, 80);
});

test("bare-count whole items resolve from USDA's own foodPortions (2026-07-21)", () => {
  const cases = [
    [{ measure: "1 whole", name: "Chicken" }, 1046],
    [{ measure: "4", name: "Pork Chops" }, 796],
    [{ measure: "8", name: "Chicken drumsticks" }, 1040],
    [{ measure: "2", name: "Sweetcorn" }, 204],
    [{ measure: "10", name: "Dried Apricots" }, 35],
    [{ measure: "12", name: "Filo Pastry" }, 228],
    [{ measure: "8", name: "Prawns" }, 48],
    [{ measure: "8", name: "Oysters" }, 112],
    [{ measure: "4", name: "Figs" }, 200],
    [{ measure: "6", name: "Prunes" }, 57],
    [{ measure: "2", name: "turnips" }, 244],
    [{ measure: "16", name: "Black Olives" }, 70.4],
    [{ measure: "2", name: "English Muffins" }, 114],
    [{ measure: "12", name: "Hard Taco Shells" }, 154.8],
    [{ measure: "8", name: "Pears" }, 1416],
  ];
  for (const [line, grams] of cases) {
    const p = parseIngredientLine(line);
    assert.equal(p.grams, grams, `${line.measure} ${line.name}`);
    assert.equal(p.confidence, "high", `${line.measure} ${line.name}`);
  }
});

test("a size or state qualifier blocks the generic verified weight", () => {
  const cherry = parseIngredientLine("6 cherry tomatoes");
  assert.equal(cherry.grams, 102);
  assert.equal(cherry.confidence, "medium");
  assert.equal(parseIngredientLine({ measure: "6", name: "King Prawns" }).grams, null);
  assert.equal(parseIngredientLine("1 chicken stock").grams, null);
  assert.equal(parseIngredientLine("1 coconut milk").grams, null);
  assert.equal(parseIngredientLine("2 potatoes").confidence, "high");
  assert.equal(parseIngredientLine("1 whole chicken").grams, 1046);
});

test("Challots is TheMealDB's spelling of shallots (5 corpus lines)", () => {
  const ch = parseIngredientLine({ measure: "5", name: "Challots" });
  assert.equal(ch.grams, 150);
  assert.equal(ch.confidence, "medium");
});

test("a parenthesised amount is the line TOTAL unless a pack noun follows", () => {
  assert.equal(parseIngredientLine({ measure: "4 (650g)", name: "Chicken Thighs" }).grams, 650);
  assert.equal(parseIngredientLine({ measure: "2 (460g)", name: "Chicken Legs" }).grams, 460);
  assert.equal(parseIngredientLine({ measure: "2 (400g) tins", name: "Chopped Tomatoes" }).grams, 800);
});

test("a spice pepper does not inherit the vegetable-pepper weight", () => {
  assert.equal(parseIngredientLine({ measure: "8", name: "Cayenne Pepper" }).grams, null);
  assert.equal(parseIngredientLine({ measure: "1", name: "Red Pepper" }).grams, 119);
  assert.equal(parseIngredientLine({ measure: "1", name: "Green Pepper" }).grams, 119);
});

test("doubt-mass sweep: the biggest bare-count lines now carry USDA weights", () => {
  const thighs = parseIngredientLine({ measure: "8", name: "Chicken Thighs" });
  assert.equal(thighs.grams, 1544);
  assert.equal(thighs.confidence, "high");
  const pita = parseIngredientLine({ measure: "6", name: "Pita Bread" });
  assert.equal(pita.grams, 360);
  assert.equal(pita.confidence, "high");
  const sausages = parseIngredientLine({ measure: "2", name: "Sausages" });
  assert.equal(sausages.grams, 202);
  assert.equal(sausages.confidence, "high");
});

test("a cabbage LEAF is not a cabbage HEAD", () => {
  const leaves = parseIngredientLine({ measure: "6 large", name: "Cabbage Leaves" });
  assert.equal(leaves.grams, 138);
  assert.equal(leaves.confidence, "high");
  assert.equal(parseIngredientLine({ measure: "1", name: "Cabbage" }).grams, 908);
});

test("USDA portions that name a different physical object stay out", () => {
  const breast = parseIngredientLine({ measure: "2", name: "Chicken Breasts" });
  assert.equal(breast.grams, 340);
  assert.equal(breast.confidence, "medium");
  const legs = parseIngredientLine({ measure: "8", name: "Chicken Legs" });
  assert.equal(legs.grams, 1200);
  assert.equal(legs.confidence, "medium");
});

test("a bare 'chicken' key would hand boneless fillets a whole bird", () => {
  assert.equal(parseIngredientLine({ measure: "5 boneless", name: "Chicken" }).grams, null);
  assert.equal(parseIngredientLine({ measure: "1 whole", name: "Chicken" }).grams, 1046);
});

test("round-2 verified pieces: avocado, fennel, plum and sun-dried tomato", () => {
  const avo = parseIngredientLine({ measure: "3 Large", name: "Avocado" });
  assert.equal(avo.grams, 603);
  assert.equal(avo.confidence, "high");
  const fennel = parseIngredientLine({ measure: "2 medium", name: "Fennel" });
  assert.equal(fennel.grams, 468);
  assert.equal(fennel.confidence, "high");
  const bulb = parseIngredientLine({ measure: "1 sliced", name: "Fennel Bulb" });
  assert.equal(bulb.grams, 234);
  assert.equal(bulb.confidence, "high");
  const plum = parseIngredientLine({ measure: "3", name: "Plum Tomatoes" });
  assert.equal(plum.grams, 186);
  assert.equal(plum.confidence, "high");
  const sun = parseIngredientLine({ measure: "8", name: "Sun-Dried Tomatoes" });
  assert.equal(sun.grams, 16);
  assert.equal(sun.confidence, "high");
  assert.equal(parseIngredientLine({ measure: "6", name: "Baby Plum Tomatoes" }).confidence, "medium");
});

test("USDA sizes that name the wrong-sized object stay out (round 2)", () => {
  for (const [measure, name] of [
    ["1 medium", "Squash"],
    ["1 medium chopped", "Butternut Squash"],
    ["1 head", "Broccoli"],
    ["6 small", "Egg Plants"],
  ]) {
    const p = parseIngredientLine({ measure, name });
    assert.notEqual(p.confidence, "high", `${measure} ${name} must not read as verified`);
  }
});
