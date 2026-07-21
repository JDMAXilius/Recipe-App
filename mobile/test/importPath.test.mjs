// Imported recipes must be weight-first too (founder: "doesn't matter if it
// is imported or created"). This pins the whole imported path: a schema.org
// ingredient string → the backend URL-import splitter → the app's weight
// lens. Lines here are the shapes real recipe sites publish.
import test from "node:test";
import assert from "node:assert/strict";
import { splitIngredientLine } from "../../backend/src/lib/importRecipe.js";
import { formatIngredientLine } from "../lib/foodScale.js";

const render = (line) => {
  const { measure, name } = splitIngredientLine(line);
  return formatIngredientLine(measure, name).display;
};

test("imported schema.org lines render weight-first", () => {
  // 125 g/cup = USDA all-purpose flour cup portion (was 120 g from a
  // copyrighted chart). 2.5 cups therefore reads 312.5 g.
  assert.equal(render("2 1/2 cups all-purpose flour"), "312.5 g");
  assert.equal(render("½ cup unsalted butter, softened"), "113.5 g");
  assert.equal(render("3 cloves garlic, minced"), "9 g");
  assert.equal(render("1kg boneless chicken thighs"), "1000 g");
  assert.equal(render("1 pound lean ground beef"), "453.6 g");
  assert.equal(render("2 tablespoons olive oil"), "30 ml");
  assert.equal(render("150ml double cream"), "150 ml");
  assert.equal(render("2 eggs, beaten"), "100 g");
  assert.equal(render("1 cup freshly grated Parmesan cheese"), "100 g");
});

test("a stated pack weight in the name beats any table guess", () => {
  // splitter yields qty 1 + name "(400g) can chopped tomatoes" — believe the label
  assert.equal(render("1 (400g) can chopped tomatoes"), "400 g");
  assert.equal(render("2 (400g) cans chopped tomatoes"), "800 g");
});

test("ranges take the midpoint; unmeasurables pass through", () => {
  assert.equal(render("2-3 tbsp milk"), "37.5 ml");
  // no measure → empty amount column; the name renders on its own, like the
  // detail screen's pantry rows
  assert.equal(render("Salt and pepper to taste"), "");
});

test("decimal spoons for spices, never fractions", () => {
  assert.equal(render("¼ teaspoon freshly ground black pepper"), "0.3 tsp");
  assert.ok(!/[½⅓⅔¼¾⅛]/.test(render("¼ teaspoon freshly ground black pepper")));
});
