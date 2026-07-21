// N5 — GOLDEN NUTRITION CORPUS. Real-shaped recipes with pinned kcal RANGES
// (and macro sanity), computed on the deterministic path (resolvers dormant in
// tests). Purpose: any future engine/table change that silently shifts totals
// fails HERE, loudly, with the dish named — the nutrition twin of foodScale's
// golden corpus test. Ranges are ±~20% around today's verified values; a
// legitimate engine improvement that moves a dish outside its range should
// update the range CONSCIOUSLY in the same commit, with the reason.
import test from "node:test";
import assert from "node:assert/strict";
import { usdaProvider } from "../src/lib/nutrition/usdaProvider.js";

const compute = (ings, servings) => usdaProvider.computeNutrition(ings, servings);
const within = (out, lo, hi, label) => {
  assert.ok(out, `${label}: should compute, got null`);
  assert.ok(out.kcal >= lo && out.kcal <= hi, `${label}: kcal ${out.kcal} outside [${lo}, ${hi}]`);
};

test("golden: the founder's lasagna (serves 4)", async () => {
  const out = await compute(
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

test("golden: chicken & rice dinner (serves 4) — the original bug fixture", async () => {
  const out = await compute(
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

test("golden: light dishes compute their real small numbers", async () => {
  within(await compute([{ measure: "200 g", name: "celery" }], 1), 15, 40, "celery");
});

test("golden: tomato spaghetti (serves 2)", async () => {
  const out = await compute(
    [
      { measure: "200 g", name: "spaghetti" }, { measure: "400 g", name: "chopped tomatoes" },
      { measure: "2 tbsp", name: "olive oil" }, { measure: "2 cloves", name: "garlic" },
    ],
    2
  );
  within(out, 440, 630, "spaghetti");
  assert.ok(out.carbs_g > out.protein_g, "pasta dish is carb-dominant");
});

test("golden: pancakes (serves 4)", async () => {
  const out = await compute(
    [
      { measure: "200 g", name: "plain flour" }, { measure: "300 ml", name: "milk" },
      { measure: "2", name: "eggs" }, { measure: "30 g", name: "butter" },
      { measure: "30 g", name: "sugar" },
    ],
    4
  );
  within(out, 280, 420, "pancakes");
});

test("golden: beef stew (serves 4)", async () => {
  const out = await compute(
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

test("golden: banana smoothie (serves 1)", async () => {
  const out = await compute(
    [
      { measure: "1", name: "banana" }, { measure: "240 ml", name: "milk" },
      { measure: "20 g", name: "honey" },
    ],
    1
  );
  within(out, 240, 390, "smoothie");
  assert.ok(out.carbs_g > 40, `fruit+honey carbs, got ${out.carbs_g}`);
});

test("golden: volume-measured rice still honestly refuses when unresolvable", async () => {
  const out = await compute(
    [{ measure: "3 cups", name: "rice" }, { measure: "200 g", name: "chicken breast" }],
    4
  );
  assert.equal(out, null); // dormant → unknown raw/cooked → estimate, never a 3x-wrong guess
});
