import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRecipeShareText, buildShoppingListShareText } from './shareText.ts';
import { mintToken } from './token.ts';

const recipe = {
  title: 'Garlic Butter Chicken',
  ingredients: ['4 chicken thighs', '2 tbsp butter', '3 cloves garlic'],
  steps: ['Sear the chicken', 'Add butter and garlic', 'Baste and rest'],
  servings: 4,
  sourceName: 'Serious Eats',
  sourceUrl: 'https://example.com/gbc',
};

test('recipe share: title, servings, ingredients, method, attribution, signoff', () => {
  const out = buildRecipeShareText(recipe);
  assert.match(out, /^\*Garlic Butter Chicken\*/);
  assert.match(out, /For 4 servings/);
  assert.match(out, /\*Ingredients\*/);
  assert.match(out, /- 4 chicken thighs/);
  assert.match(out, /\*Method\*/);
  assert.match(out, /1\. Sear the chicken/);
  assert.match(out, /3\. Baste and rest/);
  // attribution is immutable — always travels
  assert.match(out, /From Serious Eats: https:\/\/example\.com\/gbc/);
  assert.match(out, /Shared from Otto, the quieter kind of cookbook\.$/);
});

test('recipe share: public link rides along when given', () => {
  const out = buildRecipeShareText(recipe, 'https://ottosapp.com/s/abc123');
  assert.match(out, /Open it here: https:\/\/ottosapp\.com\/s\/abc123/);
});

test('recipe share: no source → no attribution line, still has signoff', () => {
  const out = buildRecipeShareText({ title: 'Toast', ingredients: [], steps: [] });
  assert.doesNotMatch(out, /From /);
  assert.doesNotMatch(out, /Ingredients/);
  assert.match(out, /Shared from Otto/);
});

test('shopping list: grouped by aisle, checked stay home, extras section', () => {
  const out = buildShoppingListShareText({
    items: [
      { key: 'a', name: 'milk', aisle: 'Dairy', amount: '1L', sources: ['Pancakes'] },
      { key: 'b', name: 'cheese', aisle: 'Dairy' },
      { key: 'c', name: 'apples', aisle: 'Produce' },
    ],
    custom: [{ key: 'x', name: 'napkins' }],
    checked: { c: true },
  });
  assert.match(out, /\*Dairy\*/);
  assert.match(out, /- 1L milk \(for Pancakes\)/);
  assert.match(out, /- cheese/);
  assert.doesNotMatch(out, /apples/); // checked → omitted
  assert.match(out, /\*Extras\*/);
  assert.match(out, /- napkins/);
});

test('mintToken: base64url shape, right length, high-entropy uniqueness', () => {
  const t = mintToken();
  // 9 bytes → 12 base64url chars, inside the /hl/<token> {8,24} shape
  assert.equal(t.length, 12);
  assert.match(t, /^[A-Za-z0-9_-]{8,24}$/);
  const set = new Set(Array.from({ length: 500 }, () => mintToken()));
  assert.equal(set.size, 500); // no collisions across 500 mints
});

test('mintToken: byte count controls length', () => {
  assert.equal(mintToken(3).length, 4);
  assert.equal(mintToken(6).length, 8);
});
