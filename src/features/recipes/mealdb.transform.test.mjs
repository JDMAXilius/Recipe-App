// Unit tests for the RecipeSource seam — the TheMealDB trust boundary. Run by
// `npm test` (node --test, type-stripped TS via the engine's ts-ext-resolve).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mealIngredients,
  mealSteps,
  mealToRecipe,
  mealToSummary,
  parseCategories,
  parseMeals,
} from './mealdb.transform.ts';

const meal = {
  idMeal: '52772',
  strMeal: 'Teriyaki Chicken Casserole',
  strMealThumb: 'https://img/teriyaki.jpg',
  strCategory: 'Chicken',
  strArea: 'Japanese',
  strInstructions: 'STEP 1\nPreheat oven to 350.\n\nWhisk the sauce.\n2.\nBake 30 min.',
  strYoutube: 'https://www.youtube.com/watch?v=4aZr5hZXP_s',
  strIngredient1: 'soy sauce',
  strMeasure1: '3/4 cup',
  strIngredient2: 'chicken breasts',
  strMeasure2: '2',
  strIngredient3: '  ',
  strMeasure3: '1 tbsp',
};

test('mealIngredients extracts non-empty pairs, trims, skips blanks', () => {
  assert.deepEqual(mealIngredients(meal), [
    { measure: '3/4 cup', name: 'soy sauce' },
    { measure: '2', name: 'chicken breasts' },
  ]);
});

test('mealSteps splits lines and drops standalone step-number labels', () => {
  // "STEP 1" and a lone "2." are labels, not instructions — dropped.
  assert.deepEqual(mealSteps(meal.strInstructions), [
    'Preheat oven to 350.',
    'Whisk the sauce.',
    'Bake 30 min.',
  ]);
  assert.deepEqual(mealSteps(null), []);
});

test('mealSteps splits a single no-newline paragraph into sentences', () => {
  // TheMealDB recipes with the whole method in one paragraph (no line breaks)
  // must not collapse into one giant step (52779 Cream Cheese Tart, 52780 Gratin).
  assert.deepEqual(
    mealSteps('Preheat the oven to 350. Whisk the sauce. Bake for 30 min.'),
    ['Preheat the oven to 350.', 'Whisk the sauce.', 'Bake for 30 min.'],
  );
});

test('mealToRecipe brands the seed id and carries source url, servings stays null', () => {
  const r = mealToRecipe(meal);
  assert.equal(r.id, '52772');
  assert.equal(r.source, 'themealdb');
  assert.equal(r.area, 'Japanese');
  assert.equal(r.servings, null); // yield is unknown at this layer — honest null
  assert.equal(r.youtubeUrl, meal.strYoutube);
  assert.equal(r.ingredients.length, 2);
  assert.equal(r.steps.length, 3);
});

test('mealToSummary stamps back the category filter.php omits', () => {
  const bare = { idMeal: '1', strMeal: 'X', strMealThumb: 't' };
  assert.deepEqual(mealToSummary(bare, 'Beef'), {
    id: '1',
    title: 'X',
    image: 't',
    category: 'Beef',
  });
});

test('parseMeals tolerates a null envelope (no rows, not an error)', () => {
  assert.deepEqual(parseMeals({ meals: null }), []);
  assert.equal(parseMeals({ meals: [meal] }).length, 1);
});

test('parseCategories normalizes the category rows', () => {
  const out = parseCategories({
    categories: [{ strCategory: 'Beef', strCategoryDescription: 'Beef is…', strCategoryThumb: 'b.jpg' }],
  });
  assert.deepEqual(out, [{ name: 'Beef', description: 'Beef is…', thumb: 'b.jpg' }]);
});

test('a malformed meal (no idMeal) is rejected at the boundary', () => {
  assert.throws(() => mealToRecipe({ strMeal: 'no id' }));
});
