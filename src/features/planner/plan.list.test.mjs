import test from 'node:test';
import assert from 'node:assert/strict';
import { isLeftover, normalizeLabel, positionAtEnd, positionFor, rebalance, sortDay, STEP } from './plan.list.ts';

const row = (id, position, created_at = `2026-11-06T0${id}:00:00Z`) => ({ id, position, created_at });

test('sortDay: positioned rows by position, legacy (null) rows after them by insert time', () => {
  const day = [row(1, null), row(2, 2048), row(3, 1024), row(4, null, '2026-11-06T00:30:00Z')];
  assert.deepEqual(sortDay(day).map((r) => r.id), [3, 2, 4, 1]);
});

test('sortDay: no positions at all keeps insert order (today\'s rows)', () => {
  assert.deepEqual(sortDay([row(2, null), row(1, null)]).map((r) => r.id), [1, 2]);
});

test('positionAtEnd: after the last item, or STEP on an empty day', () => {
  assert.equal(positionAtEnd([]), STEP);
  assert.equal(positionAtEnd([row(1, 1024), row(2, 2048)]), 2048 + STEP);
  assert.equal(positionAtEnd([row(1, null), row(2, null)]), 3 * STEP);
});

test('positionFor: one write moves an item between its new neighbours', () => {
  const day = [row(1, 1024), row(2, 2048), row(3, 3072)];
  assert.equal(positionFor(day, 3, 0), 512); // to the top
  assert.equal(positionFor(day, 1, 1), 2560); // between 2 and 3
  assert.equal(positionFor(day, 1, 9), 3072 + STEP); // past the end
  assert.equal(positionFor([row(1, 1024)], 1, 0), STEP); // alone on the day
});

test('positionFor: neighbours too close → null, and rebalance respaces the day', () => {
  const tight = [row(1, 1), row(2, 1 + 1e-7), row(3, 5)];
  assert.equal(positionFor(tight, 3, 1), null);
  assert.deepEqual(rebalance(tight), [
    { id: 1, position: STEP },
    { id: 2, position: 2 * STEP },
    { id: 3, position: 3 * STEP },
  ]);
});

test('normalizeLabel: optional, short, lowercase', () => {
  assert.equal(normalizeLabel('  Dinner '), 'dinner');
  assert.equal(normalizeLabel(''), null);
  assert.equal(normalizeLabel(null), null);
  assert.equal(normalizeLabel('x'.repeat(40)).length, 24);
});

test('isLeftover reads the new kind and the legacy note', () => {
  assert.equal(isLeftover({ kind: 'leftover', note: null }), true);
  assert.equal(isLeftover({ kind: 'recipe', note: 'leftovers' }), true);
  assert.equal(isLeftover({ kind: 'recipe', note: null }), false);
});
