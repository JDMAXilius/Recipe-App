import test from 'node:test';
import assert from 'node:assert/strict';
import { describeYield, describePortion, formatYield, parseYield, portionServings, singular, unitLabel } from './yield.ts';

test('unitLabel pluralises regular, irregular and uncountable units', () => {
  assert.equal(unitLabel('slice', 1), 'slice');
  assert.equal(unitLabel('slice', 10), 'slices');
  assert.equal(unitLabel('loaf', 2), 'loaves');
  assert.equal(unitLabel('', 3), 'servings');
  assert.equal(unitLabel('soup', 4), 'soup');
});

test('describeYield: a batch that divides into a natural unit', () => {
  assert.equal(describeYield({ qty: 1, unit: 'loaf' }, { count: 10, unit: 'slice' }), 'Makes 1 loaf · 10 slices');
  assert.equal(describeYield({ qty: 2, unit: 'loaf' }, { count: 20, unit: 'slice' }), 'Makes 2 loaves · 20 slices');
});

test('describeYield: says servings once when the batch is the servings', () => {
  assert.equal(describeYield({ qty: 4, unit: 'serving' }, { count: 4, unit: 'serving' }), 'Makes 4 servings');
  assert.equal(describeYield({ qty: 12, unit: 'cookie' }, { count: 12, unit: 'cookie' }), 'Makes 12 cookies');
});

test('the banana bread case: 2 slices of a 10-slice loaf', () => {
  const s = { count: 10, unit: 'slice' };
  const p = { count: 2, unit: 'slice' };
  assert.equal(portionServings(p, s), 2);
  assert.equal(describePortion(p, s), 'You photographed 2 slices ≈ 2 servings');
});

test('a portion never counts as more servings than the batch makes', () => {
  assert.equal(portionServings({ count: 5, unit: 'bowl' }, { count: 4, unit: 'bowl' }), 4);
  assert.equal(portionServings({ count: 0, unit: 'slice' }, { count: 8, unit: 'slice' }), 0);
});

test('one portion reads in the singular', () => {
  assert.equal(describePortion({ count: 1, unit: 'bowl' }, { count: 6, unit: 'bowl' }), 'You photographed 1 bowl ≈ 1 serving');
});

// --- review fixes (2026-11-06) ----------------------------------------------

test('a whole pie in the photo is all of its servings, not one', () => {
  const y = { qty: 1, unit: 'pie' };
  const s = { count: 8, unit: 'slice' };
  assert.equal(portionServings({ count: 1, unit: 'pie' }, s, y), 8);
  assert.equal(describePortion({ count: 1, unit: 'pie' }, s, y), 'You photographed 1 pie ≈ 8 servings');
  assert.equal(portionServings({ count: 2, unit: 'slice' }, s, y), 2);
});

test('plurals and singulars: model plurals, -ch/-x words, -y words', () => {
  assert.equal(singular('slices'), 'slice');
  assert.equal(singular('loaves'), 'loaf');
  assert.equal(singular('sandwiches'), 'sandwich');
  assert.equal(singular('patties'), 'patty');
  assert.equal(singular('glass'), 'glass');
  assert.equal(singular('cookies'), 'cookie');
  assert.equal(singular('quiches'), 'quiche');
  assert.equal(singular('pies'), 'pie');
  assert.equal(unitLabel('slices', 10), 'slices');
  assert.equal(unitLabel('slices', 1), 'slice');
  assert.equal(unitLabel('sandwich', 2), 'sandwiches');
  assert.equal(unitLabel('peach', 3), 'peaches');
  assert.equal(unitLabel('patty', 4), 'patties');
  assert.equal(describeYield({ qty: 1, unit: 'loaf' }, { count: 10, unit: 'slices' }), 'Makes 1 loaf · 10 slices');
});

test('parseYield/formatYield round-trip the editor Makes field', () => {
  assert.deepEqual(parseYield('1 loaf'), { qty: 1, unit: 'loaf' });
  assert.deepEqual(parseYield('2 trays'), { qty: 2, unit: 'tray' });
  assert.deepEqual(parseYield('pie'), { qty: 1, unit: 'pie' });
  assert.equal(parseYield(''), null);
  assert.equal(parseYield('12'), null);
  assert.equal(formatYield({ qty: 2, unit: 'loaf' }), '2 loaves');
});
