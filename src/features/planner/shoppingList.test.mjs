// Colocated pure-logic check for shoppingList.ts (node --test, native TS strip).
// Grams are supplied directly (the nutrition engine's job in production) so
// these exercise buildShoppingList's summing / aisle grouping / stable-order
// contract in isolation.
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildShoppingList, aisleFor, AISLES } from './shoppingList.ts';

const ing = (name, over = {}) => ({ name, qty: null, unit: null, grams: null, raw: '', ...over });

test('aisleFor: word-boundary rules, not substrings', () => {
  assert.equal(aisleFor('chicken breast'), 'Meat & fish');
  assert.equal(aisleFor('chicken stock'), 'Pantry'); // pantry phrase wins over meat
  assert.equal(aisleFor('boiled egg'), 'Dairy & eggs'); // "egg", NOT "oil" substring
  assert.equal(aisleFor('peanut'), 'Produce'); // "\\bnut" does NOT match inside peanut
  assert.equal(aisleFor('onion'), 'Produce');
  assert.equal(aisleFor('unobtanium'), 'Other');
});

test('summing: weight-first, grams roll up to kg above 1000', () => {
  const items = buildShoppingList([
    { title: 'Roast A', ingredients: [ing('chicken', { grams: 500 })] },
    { title: 'Roast B', ingredients: [ing('chicken', { grams: 750 })] },
  ]);
  assert.equal(items.length, 1);
  assert.equal(items[0].amount, '1.3 kg'); // 1250 g → 1.3 kg
  assert.equal(items[0].aisle, 'Meat & fish');
  assert.deepEqual(items[0].sources, ['Roast A', 'Roast B']); // provenance, both
});

test('summing: sub-kg stays in grams', () => {
  const items = buildShoppingList([
    { title: 'X', ingredients: [ing('carrot', { grams: 200 }), ing('carrot', { grams: 300 })] },
  ]);
  assert.equal(items[0].amount, '500 g');
});

test('summing: one unresolved entry drops the row to honest fallback (never a partial sum)', () => {
  const items = buildShoppingList([
    {
      title: 'X',
      ingredients: [
        ing('beef', { grams: 500, qty: 500, unit: 'g', raw: '500 g' }),
        ing('beef', { grams: null, qty: 1, unit: 'piece', raw: '1 piece' }),
      ],
    },
  ]);
  assert.equal(items[0].amount, '500 g + 1 piece'); // raw listing, not 500 g
});

test('summing: same-unit fallback sums the count and pluralizes', () => {
  const items = buildShoppingList([
    {
      title: 'X',
      ingredients: [
        ing('garlic', { grams: null, qty: 2, unit: 'clove', raw: '2 cloves' }),
        ing('garlic', { grams: null, qty: 3, unit: 'clove', raw: '3 cloves' }),
      ],
    },
  ]);
  assert.equal(items[0].amount, '5 cloves');
  assert.equal(items[0].aisle, 'Produce');
});

test('grouping: singular/plural names share one row', () => {
  const items = buildShoppingList([
    { title: 'A', ingredients: [ing('Tomatoes', { grams: 120 })] },
    { title: 'B', ingredients: [ing('tomato', { grams: 120 })] },
  ]);
  assert.equal(items.length, 1);
  assert.equal(items[0].amount, '240 g');
});

test('grouping: output is sorted into AISLES order', () => {
  const items = buildShoppingList([
    {
      title: 'Mixed',
      ingredients: [
        ing('flour', { grams: 100 }), // Pantry
        ing('onion', { grams: 100 }), // Produce
        ing('cumin', { grams: 5 }), // Spices
        ing('chicken', { grams: 100 }), // Meat & fish
      ],
    },
  ]);
  const aisles = items.map((i) => i.aisle);
  const positions = aisles.map((a) => AISLES.indexOf(a));
  const sorted = [...positions].sort((a, b) => a - b);
  assert.deepEqual(positions, sorted); // already in aisle order
  assert.deepEqual(aisles, ['Produce', 'Meat & fish', 'Pantry', 'Spices']);
});

test('no-reorder: order is a pure function of input, identical across rebuilds', () => {
  const recipes = [
    { title: 'A', ingredients: [ing('onion', { grams: 100 }), ing('flour', { grams: 100 })] },
    { title: 'B', ingredients: [ing('chicken', { grams: 100 }), ing('salt', { grams: 5 })] },
  ];
  const keys1 = buildShoppingList(recipes).map((i) => i.key);
  const keys2 = buildShoppingList(recipes).map((i) => i.key);
  assert.deepEqual(keys1, keys2);
  // check state lives outside buildShoppingList (it takes no check map), so
  // ticking an item literally cannot feed back into ordering.
});
