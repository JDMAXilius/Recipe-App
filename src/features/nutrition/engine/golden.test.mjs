// Ported v1 suite: backend/test/goldenNutrition.test.mjs (N5 — GOLDEN
// NUTRITION CORPUS), run against the TS engine port. Pinned kcal RANGES and
// macro sanity are LAW — identical to v1, none adjusted. Any engine/table
// change that silently shifts totals fails HERE, loudly, with the dish named.
import test from "node:test";
import assert from "node:assert/strict";
import { computeNutrition } from "./compute";

const compute = (ings, servings) => computeNutrition({ ingredients: ings, servings });
const within = (out, lo, hi, label) => {
  assert.ok(out, `${label}: should compute, got null`);
  assert.ok(out.kcal >= lo && out.kcal <= hi, `${label}: kcal ${out.kcal} outside [${lo}, ${hi}]`);
};

test("golden: the founder's lasagna (serves 4)", () => {
  const out = compute(
    [
      { measure: "500 g", name: "Beef Mince" }, { measure: "110 g", name: "Onion" },
      { measure: "6 g", name: "Garlic" }, { measure: "400 g", name: "Chopped Tomatoes" },
      { measure: "32.7 g", name: "Tomato Puree" }, { measure: "150 ml", name: "Red Wine" },
      { measure: "41 g", name: "Butter" }, { measure: "31.8 g", name: "Plain Flour" },
      { measure: "480 ml", name: "Milk" }, { measure: "112.8 g", name: "Grated Cheddar" },
      { measure: "144 g", name: "Lasagne Sheets" }, { measure: "2 tsp", name: "Dried Oregano" },
      { measure: "0.5 tsp", name: "Black Pepper" }, { measure: "Handful", name: "Fresh Basil" },
    ],
    4
  );
  within(out, 650, 850, "lasagna");
  assert.ok(out.protein_g > 30, `lasagna protein ${out.protein_g}`);
});

test("golden: chicken & rice dinner (serves 4) — the original bug fixture", () => {
  const out = compute(
    [
      { measure: "800 g", name: "chicken thighs" }, { measure: "300 g", name: "white rice" },
      { measure: "2 tbsp", name: "olive oil" }, { measure: "1", name: "onion" },
      { measure: "3 cloves", name: "garlic" }, { measure: "400 g", name: "chopped tomatoes" },
      { measure: "1 tsp", name: "salt" },
    ],
    4
  );
  within(out, 680, 880, "chicken & rice");
  assert.ok(out.carbs_g > 50, `rice carbs must be present, got ${out.carbs_g}`); // the 8.3g regression
  assert.ok(out.protein_g > 30, `thigh MEAT protein, got ${out.protein_g}`); // the skin-row regression
});

test("golden: light dishes compute their real small numbers", () => {
  within(compute([{ measure: "200 g", name: "celery" }], 1), 15, 40, "celery");
});

test("golden: tomato spaghetti (serves 2)", () => {
  const out = compute(
    [
      { measure: "200 g", name: "spaghetti" }, { measure: "400 g", name: "chopped tomatoes" },
      { measure: "2 tbsp", name: "olive oil" }, { measure: "2 cloves", name: "garlic" },
    ],
    2
  );
  within(out, 440, 630, "spaghetti");
  assert.ok(out.carbs_g > out.protein_g, "pasta dish is carb-dominant");
});

test("golden: pancakes (serves 4)", () => {
  const out = compute(
    [
      { measure: "200 g", name: "plain flour" }, { measure: "300 ml", name: "milk" },
      { measure: "2", name: "eggs" }, { measure: "30 g", name: "butter" },
      { measure: "30 g", name: "sugar" },
    ],
    4
  );
  within(out, 280, 420, "pancakes");
});

test("golden: beef stew (serves 4)", () => {
  const out = compute(
    [
      { measure: "500 g", name: "beef" }, { measure: "400 g", name: "potatoes" },
      { measure: "2", name: "carrots" }, { measure: "1", name: "onion" },
      { measure: "500 ml", name: "beef stock" },
    ],
    4
  );
  // Range lowered from [380, 560] in the Phase 22 identity sweep: "beef stock"
  // pointed at "Soup, beef broth, CUBED, DRY" (170 kcal/100g), so 500 ml of
  // stock contributed 850 kcal — 212 per serving — to a pot of stew. It now
  // points at "Soup, stock, beef, home-prepared" (13 kcal/100g), matching the
  // sibling keys "hot beef stock" and "unsalted beef stock".
  within(out, 220, 330, "beef stew");
  assert.ok(out.protein_g > out.fat_g, "lean stew is protein-dominant");
});

test("golden: banana smoothie (serves 1)", () => {
  const out = compute(
    [
      { measure: "1", name: "banana" }, { measure: "240 ml", name: "milk" },
      { measure: "20 g", name: "honey" },
    ],
    1
  );
  within(out, 240, 390, "smoothie");
  assert.ok(out.carbs_g > 40, `fruit+honey carbs, got ${out.carbs_g}`);
});

// T1 (2026-07-23): browning oil is not eaten. Irish stew's "120ml olive oil"
// (110 g) is a moderate pour used to brown 2 kg of lamb — 976 uneaten kcal read
// whole. Below any bath threshold, and it CANNOT be inferred from the ingredient
// list (the same oil is eaten sauce in the next recipe), so it is HUMAN-curated:
// recipeFacts[52781].frying names "olive oil" and applyFryingMedium counts only
// its film (max(10, 4 g/serving)). Pinned below the old buggy 1135. (The lamb cut
// + raw-fat match keep the total high — that is T5, a separate ticket.)
test("golden: Irish stew (52781) — curated browning oil counted as film, not whole", () => {
  // recipeId → curated servings=8 + frying:["olive oil"]. Old value 1135 (oil whole) must now fail high.
  const out8 = computeNutrition({
    ingredients: [
      { measure: "300g soaked overnight in water", name: "whole wheat" },
      { measure: "2kg cut into 3cm cubes", name: "lamb loin chops" },
      { measure: "120ml", name: "olive oil" }, { measure: "24 Skinned", name: "shallots" },
      { measure: "4 large", name: "Carrots" }, { measure: "2", name: "turnips" },
      { measure: "1", name: "celeriac" }, { measure: "350g", name: "charlotte potatoes" },
      { measure: "150ml", name: "white wine" }, { measure: "1 tsp", name: "caster sugar" },
      { measure: "4 sprigs", name: "fresh thyme" }, { measure: "4 sprigs", name: "oregano" },
      { measure: "450ml", name: "chicken stock" },
    ],
    servings: 8, recipeId: "52781",
  });
  within(out8, 960, 1080, "irish stew");
  assert.ok(out8.kcal < 1135, `oil must be discounted below the whole-oil ${out8.kcal}`);
});

// The other half of T1's design: an UNcurated oil is eaten whole — the curated-only
// rule takes no oil as a medium unless a human marked it, so no false positives. This
// braise (no recipeId, so no curation possible) keeps its ~54 g oil in full; if any
// inference ever crept back in and slashed it, this dish would collapse under 130.
test("golden: uncurated olive-oil braise keeps its oil — eaten, not a medium", () => {
  const out = compute(
    [
      { measure: "1/4 cup", name: "Olive Oil" }, { measure: "16 ounces", name: "Green Beans" },
      { measure: "1 clove", name: "Garlic" }, { measure: "1/4 cup", name: "Cilantro" },
    ],
    4
  );
  within(out, 140, 190, "olive-oil braise");
  assert.ok(out.fat_g > 11, `braising oil is eaten, must stay in fat, got ${out.fat_g}`);
});

// Curated-only design regression guard: an UNcurated fat stays whole. Salmon Prawn
// Risotto's 50 g butter is mantecatura (stirred in, fully eaten) and is not marked
// frying, so it counts whole. This pins the "no inference" guarantee on a real recipe:
// if a size/meat heuristic ever crept back it would wrongly cut this to a ~763 film.
test("golden: uncurated risotto butter (52823) is eaten whole, not a medium", () => {
  const out = computeNutrition({
    ingredients: [
      { measure: "50g/2oz", name: "butter" }, { measure: "1 finely chopped", name: "onion" },
      { measure: "150g", name: "rice" }, { measure: "125ml", name: "white wine" },
      { measure: "1 litre hot", name: "vegetable stock" },
      { measure: "The juice and zest of one", name: "lemon" },
      { measure: "240g large", name: "King Prawns" }, { measure: "150g", name: "salmon" },
      { measure: "100g tips blanched briefly in boiling water", name: "asparagus" },
      { measure: "ground", name: "black pepper" }, { measure: "50g shavings", name: "Parmesan" },
    ],
    servings: 2, recipeId: "52823",
  });
  within(out, 850, 950, "risotto");
  assert.ok(out.kcal > 830, `butter must stay whole, not slashed to a film ${out.kcal}`);
});

// Same guarantee for oil: Tuna Niçoise dresses a cold salad with its oil, is not
// marked frying, so the oil counts whole. Under the retired inference attempt this
// was wrongly slashed to ~343; the curated-only design keeps it honest by default.
test("golden: uncurated Niçoise oil (52852) is eaten whole, not a medium", () => {
  const out = computeNutrition({
    ingredients: [
      { measure: "450g", name: "Potatoes" }, { measure: "2 tblsp", name: "Olive Oil" },
      { measure: "4", name: "Eggs" }, { measure: "1 tbls", name: "Red Wine Vinegar" },
      { measure: "2 tblsp", name: "Capers" }, { measure: "50g", name: "Sunflower Oil" },
      { measure: "½", name: "Red Onions" }, { measure: "100g", name: "Spinach" },
      { measure: "400g", name: "Tuna" },
    ],
    servings: 4, recipeId: "52852",
  });
  within(out, 420, 490, "niçoise");
  assert.ok(out.kcal > 400, `dressing oil must stay whole, not slashed to a film ${out.kcal}`);
});

test("golden: volume-measured rice still honestly refuses when unresolvable", () => {
  const out = compute(
    [{ measure: "3 cups", name: "rice" }, { measure: "200 g", name: "chicken breast" }],
    4
  );
  assert.equal(out, null); // no classifier in the engine → unknown raw/cooked → estimate, never a 3x-wrong guess
});
