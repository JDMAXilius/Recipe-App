import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFirstWeek, eligibleDinners, firstDayIndex } from './firstWeek.ts';
import { allergensIn, fitsDiet } from '../../shared/allergens.ts';

const dish = (id, category, area, ingredients) => ({ id, title: `Dish ${id}`, image: null, category, area, ingredients });
const shelf = [
  dish('1', 'Chicken', 'Indian', ['chicken thighs', 'yogurt', 'garam masala']),
  dish('2', 'Vegetarian', 'Italian', ['spaghetti', 'tomatoes', 'parmesan']),
  dish('3', 'Seafood', 'Thai', ['prawns', 'fish sauce', 'rice noodles']),
  dish('4', 'Vegetarian', 'Mexican', ['black beans', 'corn tortillas', 'avocado']),
  dish('5', 'Beef', 'British', ['beef mince', 'potatoes', 'plain flour']),
  dish('6', 'Dessert', 'French', ['eggs', 'sugar', 'cream']),
  dish('7', 'Vegetarian', 'Indian', ['chickpeas', 'spinach', 'coconut milk']),
  dish('8', 'Pasta', 'Italian', ['penne', 'mushrooms', 'garlic']),
  dish('9', 'Chicken', 'Mexican', ['chicken breast', 'peanut butter', 'chilli']),
];
const none = { diet: 'none', allergies: [], skips: [], cuisines: [] };
const days = ['d0', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6'];

test('allergens: keywords with their exceptions', () => {
  assert.deepEqual([...allergensIn(['coconut milk', 'butternut squash', 'peanut butter'])].sort(), ['peanut']);
  assert.deepEqual([...allergensIn(['soy sauce'])].sort(), ['gluten', 'soy']);
  assert.equal(allergensIn(['eggplant']).has('egg'), false);
  assert.equal(allergensIn(['rice noodles', 'corn tortillas', 'gluten-free pasta']).has('gluten'), false);
  assert.equal(allergensIn(['fish sauce']).has('fish'), true);
});

test('diets: ingredients decide, not the category', () => {
  assert.equal(fitsDiet(['chickpeas', 'vegetable stock cube'], 'vegetarian'), true);
  assert.equal(fitsDiet(['chickpeas', 'chicken stock'], 'vegetarian'), false);
  assert.equal(fitsDiet(['spaghetti', 'parmesan'], 'vegan'), false);
  assert.equal(fitsDiet(['chickpeas', 'coconut milk'], 'vegan'), true);
  assert.equal(fitsDiet(['oats', 'honey'], 'vegan'), false);
});

test('eligible: no desserts, allergies and skips are hard filters', () => {
  assert.equal(eligibleDinners(shelf, none).some((d) => d.id === '6'), false);
  const ids = eligibleDinners(shelf, { ...none, allergies: ['gluten', 'peanut'], skips: ['Mushrooms'] }).map((d) => d.id);
  assert.deepEqual(ids.sort(), ['1', '3', '4', '7']);
  const veg = eligibleDinners(shelf, { ...none, diet: 'vegan' }).map((d) => d.id).sort();
  assert.deepEqual(veg, ['4', '7', '8']); // penne with mushrooms is vegan
});

test('the week: one per day, no repeats, no two days running from one category, seeded', () => {
  const week = buildFirstWeek(shelf, none, days, 42);
  assert.equal(week.length, 7);
  assert.deepEqual(week.map((w) => w.day), days);
  assert.equal(new Set(week.map((w) => w.recipeId)).size, 7);
  for (let i = 1; i < week.length; i++) {
    const same = week[i].category === week[i - 1].category;
    if (same) {
      // allowed only when nothing else was left
      const left = shelf.filter((d) => d.category !== 'Dessert' && !week.slice(0, i).some((w) => w.recipeId === d.id) && d.category !== week[i - 1].category);
      assert.equal(left.length, 0, `day ${i} repeats ${week[i].category}`);
    }
  }
  assert.deepEqual(buildFirstWeek(shelf, none, days, 42), week); // same seed, same week
  assert.notDeepEqual(buildFirstWeek(shelf, none, days, 7).map((w) => w.recipeId), week.map((w) => w.recipeId));
});

test('the person\'s cuisines come first; too few dishes gives a shorter week, never a repeat', () => {
  const week = buildFirstWeek(shelf, { ...none, cuisines: ['Indian'] }, days, 1);
  assert.equal(shelf.find((d) => d.id === week[0].recipeId).area, 'Indian');
  const short = buildFirstWeek(shelf, { ...none, diet: 'vegan' }, days, 1);
  assert.equal(short.length, 3);
});

test('late evening opens on tomorrow', () => {
  assert.equal(firstDayIndex(new Date(2026, 10, 6, 19, 59)), 0);
  assert.equal(firstDayIndex(new Date(2026, 10, 6, 20, 0)), 1);
});
