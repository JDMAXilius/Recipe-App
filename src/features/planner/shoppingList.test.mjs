// Colocated pure-logic check for shoppingList.ts (node --test, native TS strip).
// Grams are supplied directly (the nutrition engine's job in production) so
// these exercise buildShoppingList's summing / aisle grouping / stable-order
// contract in isolation. Recipes carry an `id` (the removal identity — recipe
// ids, never titles) and a `title` (display only).
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildShoppingList,
  aisleFor,
  pruneRemoved,
  isRemoved,
  sameSources,
  normalizeRemoved,
  AISLES,
} from './shoppingList.ts';

const ing = (name, over = {}) => ({ name, qty: null, unit: null, grams: null, raw: '', ...over });
const recipe = (id, title, ingredients) => ({ id, title, ingredients });

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
    recipe('r-a', 'Roast A', [ing('chicken', { grams: 500 })]),
    recipe('r-b', 'Roast B', [ing('chicken', { grams: 750 })]),
  ]);
  assert.equal(items.length, 1);
  assert.equal(items[0].amount, '1.3 kg'); // 1250 g → 1.3 kg
  assert.equal(items[0].aisle, 'Meat & fish');
  assert.deepEqual(items[0].sources, ['r-a', 'r-b']); // provenance = recipe IDS, both
});

test('summing: sub-kg stays in grams', () => {
  const items = buildShoppingList([
    recipe('x', 'X', [ing('carrot', { grams: 200 }), ing('carrot', { grams: 300 })]),
  ]);
  assert.equal(items[0].amount, '500 g');
});

test('summing: one unresolved entry drops the row to honest fallback (never a partial sum)', () => {
  const items = buildShoppingList([
    recipe('x', 'X', [
      ing('beef', { grams: 500, qty: 500, unit: 'g', raw: '500 g' }),
      ing('beef', { grams: null, qty: 1, unit: 'piece', raw: '1 piece' }),
    ]),
  ]);
  assert.equal(items[0].amount, '500 g + 1 piece'); // raw listing, not 500 g
});

test('summing: same-unit fallback sums the count and pluralizes', () => {
  const items = buildShoppingList([
    recipe('x', 'X', [
      ing('garlic', { grams: null, qty: 2, unit: 'clove', raw: '2 cloves' }),
      ing('garlic', { grams: null, qty: 3, unit: 'clove', raw: '3 cloves' }),
    ]),
  ]);
  assert.equal(items[0].amount, '5 cloves');
  assert.equal(items[0].aisle, 'Produce');
});

test('grouping: singular/plural names share one row', () => {
  const items = buildShoppingList([
    recipe('a', 'A', [ing('Tomatoes', { grams: 120 })]),
    recipe('b', 'B', [ing('tomato', { grams: 120 })]),
  ]);
  assert.equal(items.length, 1);
  assert.equal(items[0].amount, '240 g');
});

test('grouping: output is sorted into AISLES order', () => {
  const items = buildShoppingList([
    recipe('m', 'Mixed', [
      ing('flour', { grams: 100 }), // Pantry
      ing('onion', { grams: 100 }), // Produce
      ing('cumin', { grams: 5 }), // Spices
      ing('chicken', { grams: 100 }), // Meat & fish
    ]),
  ]);
  const aisles = items.map((i) => i.aisle);
  const positions = aisles.map((a) => AISLES.indexOf(a));
  const sorted = [...positions].sort((a, b) => a - b);
  assert.deepEqual(positions, sorted); // already in aisle order
  assert.deepEqual(aisles, ['Produce', 'Meat & fish', 'Pantry', 'Spices']);
});

test('no-reorder: order is a pure function of input, identical across rebuilds', () => {
  const recipes = [
    recipe('a', 'A', [ing('onion', { grams: 100 }), ing('flour', { grams: 100 })]),
    recipe('b', 'B', [ing('chicken', { grams: 100 }), ing('salt', { grams: 5 })]),
  ];
  const keys1 = buildShoppingList(recipes).map((i) => i.key);
  const keys2 = buildShoppingList(recipes).map((i) => i.key);
  assert.deepEqual(keys1, keys2);
  // check state lives outside buildShoppingList (it takes no check map), so
  // ticking an item literally cannot feed back into ordering.
});

// ─── The 4a regression: identity is the recipe ID, not the title ───────────

test('4a: two dishes sharing a TITLE keep independent removals', () => {
  // Two different recipes both named "Pasta Night": 100 g onion vs 2 kg onion.
  const small = buildShoppingList([
    recipe('u-1', 'Pasta Night', [ing('onion', { grams: 100 })]),
  ])[0];
  const big = buildShoppingList([
    recipe('u-2', 'Pasta Night', [ing('onion', { grams: 2000 })]),
  ])[0];
  // The shopper removes the onion that came from u-1…
  const removed = [{ key: small.key, sources: small.sources }];
  assert.equal(isRemoved(small, removed), true);
  // …and the 2 kg from the OTHER Pasta Night must still render. Title-keyed
  // sources collapsed these to one and silently under-bought.
  assert.equal(isRemoved(big, removed), false);
});

test('4a: renaming a dish (same id, new title) keeps its removal', () => {
  const before = buildShoppingList([
    recipe('u-1', 'Pasta Night', [ing('onion', { grams: 100 })]),
  ])[0];
  const removed = [{ key: before.key, sources: before.sources }];
  const after = buildShoppingList([
    recipe('u-1', 'Spaghetti Evening', [ing('onion', { grams: 100 })]),
  ])[0];
  assert.equal(isRemoved(after, removed), true); // same dish, still hidden
});

// ─── pruneRemoved ───────────────────────────────────────────────────────────

test('pruneRemoved: drops keys the week no longer produces, keeps the live ones', () => {
  const items = buildShoppingList([
    recipe('a', 'A', [ing('onion', { grams: 100 }), ing('flour', { grams: 100 })]),
  ]);
  const liveKeys = items.map((i) => i.key);
  const removed = [
    { key: 'onion', sources: ['a'] },
    { key: 'chicken', sources: ['gone'] },
  ];
  assert.deepEqual(pruneRemoved(removed, liveKeys), [{ key: 'onion', sources: ['a'] }]);
});

test('pruneRemoved: returns the SAME array when nothing changed (no needless re-render)', () => {
  const removed = [{ key: 'onion', sources: ['a'] }];
  assert.equal(pruneRemoved(removed, ['onion', 'flour']), removed); // identity, not just equality
  const empty = [];
  assert.equal(pruneRemoved(empty, []), empty);
});

test('pruneRemoved: an entry from a dish that FAILED to resolve is kept (4d: no flaky wipe)', () => {
  // Week = dishes a + b; b's fetch failed so its ingredients are missing.
  const removed = [{ key: 'olive oil', sources: ['b'] }];
  const next = pruneRemoved(removed, ['onion'], { resolvedIds: ['a'], activeIds: ['a', 'b'] });
  assert.equal(next, removed); // unknown ≠ gone — never guessed away
});

test('pruneRemoved: one unresolvable dish does NOT freeze pruning for other entries (4d)', () => {
  // b never resolves; the shopper's old removal from dropped dish c must still prune.
  const removed = [
    { key: 'olive oil', sources: ['b'] }, // kept — b unresolved
    { key: 'chicken', sources: ['c'] }, // pruned — c left the week entirely
  ];
  const next = pruneRemoved(removed, ['onion'], { resolvedIds: ['a'], activeIds: ['a', 'b'] });
  assert.deepEqual(next, [{ key: 'olive oil', sources: ['b'] }]);
});

test('pruneRemoved: fully-resolved build prunes a dead key even when another dish failed', () => {
  // Entry's own dish (a) resolved and its key is gone from the live build → prune,
  // regardless of unrelated dish b failing.
  const removed = [{ key: 'sugar', sources: ['a'] }];
  const next = pruneRemoved(removed, ['onion'], { resolvedIds: ['a'], activeIds: ['a', 'b'] });
  assert.deepEqual(next, []);
});

// ─── isRemoved ──────────────────────────────────────────────────────────────

test('isRemoved: same key + same sources stays hidden (the removal the shopper made)', () => {
  const [onion] = buildShoppingList([recipe('s', 'Soup', [ing('onion', { grams: 100 })])]);
  assert.equal(isRemoved(onion, [{ key: 'onion', sources: ['s'] }]), true);
  // order of the source set must not matter
  const [shared] = buildShoppingList([
    recipe('s', 'Soup', [ing('onion', { grams: 100 })]),
    recipe('t', 'Stew', [ing('onion', { grams: 50 })]),
  ]);
  assert.equal(isRemoved(shared, [{ key: 'onion', sources: ['t', 's'] }]), true);
});

test('isRemoved: same key from a DIFFERENT dish reappears (no global name suppression)', () => {
  // Removed 100 g of onion that came from Soup…
  const removed = [{ key: 'onion', sources: ['s'] }];
  // …now the week is an onion-heavy party dish instead. 3 kg of onion MUST show.
  const [party] = buildShoppingList([
    recipe('p', 'Onion Bhaji Party', [ing('onions', { grams: 3000 })]),
  ]);
  assert.equal(party.amount, '3 kg');
  assert.equal(isRemoved(party, removed), false);
});

test('isRemoved: the same ingredient arriving from one MORE dish reappears', () => {
  const removed = [{ key: 'onion', sources: ['s'] }];
  const [both] = buildShoppingList([
    recipe('s', 'Soup', [ing('onion', { grams: 100 })]),
    recipe('t', 'Stew', [ing('onion', { grams: 400 })]),
  ]);
  assert.deepEqual(both.sources, ['s', 't']);
  assert.equal(both.amount, '500 g'); // the new, bigger amount is not suppressed
  assert.equal(isRemoved(both, removed), false);
});

// ─── sameSources / normalizeRemoved ────────────────────────────────────────

test('sameSources: order-insensitive, length-sensitive', () => {
  assert.equal(sameSources(['A', 'B'], ['B', 'A']), true);
  assert.equal(sameSources([], []), true);
  assert.equal(sameSources(['A'], ['A', 'B']), false);
  assert.equal(sameSources(['A', 'B'], ['A']), false);
  assert.equal(sameSources(['A'], ['B']), false);
});

test('normalizeRemoved: tolerates the old string[] blob (ignores it) and junk', () => {
  assert.deepEqual(normalizeRemoved(['onion', 'salt']), []); // legacy shape → dropped, no crash
  assert.deepEqual(normalizeRemoved(undefined), []);
  assert.deepEqual(normalizeRemoved(null), []);
  assert.deepEqual(normalizeRemoved('nope'), []);
  assert.deepEqual(normalizeRemoved([null, 42, { key: '' }, { key: 'x' }, { sources: [] }]), []);
  assert.deepEqual(normalizeRemoved([{ key: 'onion', sources: ['s', 7] }]), [
    { key: 'onion', sources: ['s'] },
  ]);
});

test('normalizeRemoved: dedupes sources so sameSources stays a true set compare (4n)', () => {
  const [entry] = normalizeRemoved([{ key: 'onion', sources: ['A', 'A', 'B'] }]);
  assert.deepEqual(entry.sources, ['A', 'B']);
  // the asymmetry the review found — dead once inputs are deduped at both boundaries
  assert.equal(sameSources(entry.sources, ['A', 'B']), true);
  assert.equal(sameSources(['A', 'B'], entry.sources), true);
});

test('normalizeRemoved: keeps a numeric `at` stamp, drops junk stamps', () => {
  assert.deepEqual(normalizeRemoved([{ key: 'x', sources: [], at: 123 }]), [
    { key: 'x', sources: [], at: 123 },
  ]);
  assert.deepEqual(normalizeRemoved([{ key: 'x', sources: [], at: 'yesterday' }]), [
    { key: 'x', sources: [] },
  ]);
});
