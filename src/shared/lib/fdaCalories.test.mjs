// Colocated check for the ported FDA rounding rule (node --test, native TS strip).
// Run: node --test src/shared/lib/fdaCalories.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fdaCalories } from './fdaCalories.ts';
import { formatCount, EM_DASH } from './format.ts';

test('fdaCalories: FDA 21 CFR 101.9(c)(1) rounding', () => {
  assert.equal(fdaCalories(2), 0); // <5 → 0 (black coffee rule)
  assert.equal(fdaCalories(4.9), 0);
  assert.equal(fdaCalories(7), 5); // ≤50 → nearest 5
  assert.equal(fdaCalories(48), 50);
  assert.equal(fdaCalories(51), 50); // >50 → nearest 10
  assert.equal(fdaCalories(424), 420);
  assert.equal(fdaCalories(-10), 0);
  assert.equal(fdaCalories(NaN), 0);
});

test('formatCount: honesty law — null is a dash, zero is zero', () => {
  assert.equal(formatCount(null), EM_DASH);
  assert.equal(formatCount(undefined), EM_DASH);
  assert.equal(formatCount(NaN), EM_DASH);
  assert.equal(formatCount(0), '0');
  assert.equal(formatCount(419.6), '420');
});
