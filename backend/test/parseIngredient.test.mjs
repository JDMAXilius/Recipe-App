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

test("cups price from USDA's own cup portion, not a density guess", () => {
  // Was 318 g off the hand-set 0.53 g/ml density. cupWeights.json carries
  // USDA's "1 cup" = 125 g for all-purpose flour (fdcId 169761) — the figure
  // this file's own header has documented as ~312 since B1.1.
  const flour = parseIngredientLine("2 1/2 cups plain flour");
  assert.equal(flour.grams, 312.5);
  assert.equal(flour.confidence, "high");
  // 237 g, not 240: USDA's cup is 236.6 ml (fdcId 174158, "1 cup"), and that
  // is what a recipe's cup of water actually weighs.
  assert.equal(parseIngredientLine("1 cup water").grams, 237);
  // A tablespoon is a sixteenth of the same cup — 125/16 = 7.8 g of flour,
  // where the density path claimed 15.9 g.
  assert.equal(parseIngredientLine("1 tbsp flour").grams, 7.8);
  // ml/l stay on the density path: 1.0 g/ml is already right for thin liquids
  // and rescaling them through a cup would only import the 240-vs-236.6 gap.
  assert.equal(parseIngredientLine("500 ml water").grams, 500);
});

test("a cup of solids is not a cup of water", () => {
  // Each of these fell to the 1.0 g/ml DEFAULT_DENSITY — wrong number and, at
  // "default-density", a medium flag on top. Weights come from cupWeights.json
  // (USDA's own "1 cup" portion, fdcId + wording per row) or, where USDA
  // publishes only a sub-cup portion, from a DENSITY row that says which one.
  const cases = [
    [{ measure: "5 Cups", name: "Potatoes" }, 756], // 170026, 0.5 cup diced = 75 g
    [{ measure: "3 cups", name: "Broad Beans" }, 327], // 170377 "1 cup"
    [{ measure: "2 cups", name: "Cannellini Beans" }, 404], // 175202 "1 cup"
    [{ measure: "2 cups", name: "Jam" }, 648], // 169641, 1 tbsp = 20 g
    [{ measure: "1 cup", name: "Green Beans" }, 100], // 169961 "1 cup 1/2\" pieces"
    [{ measure: "2 cups", name: "Cornmeal" }, 244], // 169697 "1 cup"
    [{ measure: "1 cup", name: "Mushrooms" }, 70], // 169251 "1 cup, pieces or slices"
    [{ measure: "2/3 Cup", name: "Tofu" }, 171.2], // 172475, 0.5 cup = 126 g
  ];
  for (const [line, grams] of cases) {
    const p = parseIngredientLine(line);
    assert.equal(p.grams, grams, `${line.measure} ${line.name}`);
    assert.equal(p.confidence, "high", `${line.measure} ${line.name}`);
  }
  // The most specific key wins, so a compound name cannot inherit its head
  // noun's weight: condensed milk is 306 g/cup, not milk's 244.
  assert.equal(parseIngredientLine("1/2 cup Sweetened Condensed Milk").grams, 153);
  assert.equal(parseIngredientLine("2 cups Powdered Sugar").grams, 240); // not granulated's 376
  assert.equal(parseIngredientLine("1 cup Peanut Butter").grams, 258); // not butter's 227
  // A state word blocks the generic row: sun-dried tomatoes are 54 g/cup and
  // must not take fresh tomato's 180.
  assert.equal(parseIngredientLine("1 cup sun-dried tomatoes").grams, 54);
});

test("a cup USDA cannot price stays an honest estimate", () => {
  // USDA publishes no cup or spoon portion for chocolate chips (169592 has only
  // bar and block portions) and the table's own "chocolate chips" row points at
  // a soy DRINK — so there is nothing to source. The line keeps the water
  // default and, crucially, keeps saying it is a guess.
  const chips = parseIngredientLine("2 cups Chocolate Chips");
  assert.equal(chips.grams, 480);
  assert.equal(chips.confidence, "medium");
  // Capers: USDA's own record (172238) publishes only "1 tbsp, drained", and the
  // search's nearest cup portion was Butterbur — a different plant. Stays medium.
  assert.equal(parseIngredientLine("1/4 cup Capers").confidence, "medium");
});

test("a named can size is a measurement, not a guess", () => {
  // One blanket "a can is 400 g" priced every tin at medium. A can is a
  // manufactured quantity: where USDA weighed one, or where a single retail
  // standard exists, the line is measured and reads high.
  const cases = [
    // USDA foodPortions — fdcId and USDA's own wording are on each row in
    // parseIngredient.js.
    [{ measure: "1 can", name: "Chickpeas" }, 253], // 173800 "1 can drained"
    [{ measure: "1 can", name: "Kidney Beans" }, 266], // 174285 "1 can drained solids"
    [{ measure: "1 can", name: "Refried Beans" }, 444], // 174296 "1 can"
    [{ measure: "3 cans", name: "Sweetcorn" }, 894], // 169214 "1 can (303 x 406)"
    [{ measure: "1 Can", name: "Beets" }, 294], // 169966 "1 can (303 x 406)"
    [{ measure: "1 can", name: "Tuna" }, 165], // 171986 "1 can"
    // Retail standards, stated as such on their rows.
    [{ measure: "1 Can", name: "Coconut Milk" }, 383], // 400 ml can at USDA's 0.955 g/ml
    [{ measure: "1 Can", name: "Condensed Milk" }, 397], // 14 oz can
    [{ measure: "1 can", name: "Chopped Tomatoes" }, 400], // 400 g can, undrained
    [{ measure: "3 cans", name: "Black Beans" }, 720], // 240 g drained per 400 g can
    [{ measure: "2 cans", name: "Cannellini Beans" }, 480],
  ];
  for (const [line, grams] of cases) {
    const p = parseIngredientLine(line);
    assert.equal(p.grams, grams, `${line.measure} ${line.name}`);
    assert.equal(p.confidence, "high", `${line.measure} ${line.name}`);
  }
});

test("a can we cannot name keeps the 400 g guess AND says it is one", () => {
  // "Puree" is a thin 15 oz canned sauce in the US and a ~70 g concentrate tube
  // in the UK — 6x apart, and TheMealDB writes both dialects. No honest single
  // size exists, so this must NOT be upgraded along with the tomatoes below it.
  const puree = parseIngredientLine({ measure: "3 cans", name: "Tomato Puree" });
  assert.equal(puree.grams, 1200);
  assert.equal(puree.confidence, "medium");
  // Same for any tin with no published size and no single retail standard.
  const gravy = parseIngredientLine({ measure: "1 Can", name: "Beef Gravy" });
  assert.equal(gravy.grams, 400);
  assert.equal(gravy.confidence, "medium");
  // Baked beans are eaten sauce and all — they must not take the drained
  // pulses weight, which would lose a third of the tin.
  assert.equal(parseIngredientLine({ measure: "1 can", name: "Baked Beans" }).grams, 400);
});

test("'coconut' contains 'nut' — the nuts density was pricing coconut milk", () => {
  // "400ml can Coconut Milk" resolved through /nuts?|almond|.../ at 0.55 g/ml
  // to 220 g, and scored HIGH because a matched density row reads as measured.
  // USDA 170173 publishes 1 cup = 226 g, i.e. 0.955 g/ml.
  const cm = parseIngredientLine({ measure: "400ml can", name: "Coconut Milk" });
  assert.equal(cm.grams, 384);
  // Actual nuts are untouched.
  assert.ok(Math.abs(parseIngredientLine("1 cup walnuts").grams - 80) < 1);
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

test("doubt-mass sweep: the biggest bare-count lines now carry USDA weights", () => {
  // Ranked by the grams these lines contributed to the medium-confidence
  // recipes. Each number is a USDA foodPortion, not an estimate — see
  // pieceWeights.json for the fdcId and USDA's own wording.
  const thighs = parseIngredientLine({ measure: "8", name: "Chicken Thighs" });
  assert.equal(thighs.grams, 1544); // 193 g, "1 thigh with skin" (172385)
  assert.equal(thighs.confidence, "high");
  const pita = parseIngredientLine({ measure: "6", name: "Pita Bread" });
  assert.equal(pita.grams, 360); // 60 g, "1 pita, large (6-1/2\" dia)" (174915)
  assert.equal(pita.confidence, "high");
  const sausages = parseIngredientLine({ measure: "2", name: "Sausages" });
  assert.equal(sausages.grams, 202); // 101 g, "1 link" (171631)
  assert.equal(sausages.confidence, "high");
});

test("a cabbage LEAF is not a cabbage HEAD", () => {
  // "6 large Cabbage Leaves" resolved to 5400 g — 900 g per leaf — because the
  // whole-head estimate matched on the word "cabbage". USDA weighs the leaf.
  const leaves = parseIngredientLine({ measure: "6 large", name: "Cabbage Leaves" });
  assert.equal(leaves.grams, 138); // 23 g, "1 leaf, medium" (169975)
  assert.equal(leaves.confidence, "high");
  // The head itself must keep its own weight.
  assert.equal(parseIngredientLine({ measure: "1", name: "Cabbage" }).grams, 908);
});

test("USDA portions that name a different physical object stay out", () => {
  // A USDA "breast" is BOTH halves ("1 piece" 272 g / "0.5 breast" 145 g); a
  // recipe's chicken breast is one fillet. A USDA "leg" is a quarter with the
  // back on (344 g). Both keep their estimates and their honest medium flag.
  const breast = parseIngredientLine({ measure: "2", name: "Chicken Breasts" });
  assert.equal(breast.grams, 340);
  assert.equal(breast.confidence, "medium");
  const legs = parseIngredientLine({ measure: "8", name: "Chicken Legs" });
  assert.equal(legs.grams, 1200);
  assert.equal(legs.confidence, "medium");
});

test("a bare 'chicken' key would hand boneless fillets a whole bird", () => {
  // The verified whole-bird row is keyed "whole chicken" on purpose: keys match
  // by SUFFIX, so a bare "chicken" made "5 boneless Chicken" 5230 g at HIGH.
  assert.equal(parseIngredientLine({ measure: "5 boneless", name: "Chicken" }).grams, null);
  assert.equal(parseIngredientLine({ measure: "1 whole", name: "Chicken" }).grams, 1046);
});

test("round-2 verified pieces: avocado, fennel, plum and sun-dried tomato", () => {
  // Every number below is a USDA foodPortion; see pieceWeights.json for the
  // fdcId and USDA's own wording.
  const avo = parseIngredientLine({ measure: "3 Large", name: "Avocado" });
  assert.equal(avo.grams, 603); // 201 g, "1 avocado, NS as to Florida or California" (171705)
  assert.equal(avo.confidence, "high");
  const fennel = parseIngredientLine({ measure: "2 medium", name: "Fennel" });
  assert.equal(fennel.grams, 468); // 234 g, "1 bulb" (169385)
  assert.equal(fennel.confidence, "high");
  // "1 sliced Fennel Bulb" ends in "bulb", and keys match by SUFFIX — "fennel
  // bulb" does not end in " fennel", so the bare key alone would miss it.
  const bulb = parseIngredientLine({ measure: "1 sliced", name: "Fennel Bulb" });
  assert.equal(bulb.grams, 234);
  assert.equal(bulb.confidence, "high");
  // "plum" is a SIZE_QUALIFIER, so this can never inherit the 123 g generic
  // tomato — it needs its own key, and USDA weighs it at half.
  const plum = parseIngredientLine({ measure: "3", name: "Plum Tomatoes" });
  assert.equal(plum.grams, 186); // 62 g, "1 plum tomato" (170457)
  assert.equal(plum.confidence, "high");
  // 960 g of sun-dried tomatoes (120 g apiece, a FRESH tomato's weight) put
  // 400 kcal/serving of nothing into Chicken Basquaise.
  const sun = parseIngredientLine({ measure: "8", name: "Sun-Dried Tomatoes" });
  assert.equal(sun.grams, 16); // 2 g, "1 piece" (168567)
  assert.equal(sun.confidence, "high");
  // A baby plum tomato is a size below the plum tomato, so it must not inherit it.
  assert.equal(parseIngredientLine({ measure: "6", name: "Baby Plum Tomatoes" }).confidence, "medium");
});

test("USDA sizes that name the wrong-sized object stay out (round 2)", () => {
  // Winter squash and butternut publish only "1 cup, cubes"; summer squash's
  // "1 medium" belongs to the other vegetable. Broccoli publishes a four-stalk
  // "1 bunch" (608 g) and a "1 stalk" (151 g), neither of which is the "1 head"
  // the corpus asks for. Eggplant's only portion is the 548 g American globe,
  // which turned "6 small Egg Plants" into 3.3 kg and made three recipes refuse
  // to answer at all. All four keep their estimate and their honest medium flag.
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
