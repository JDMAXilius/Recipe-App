// Colocated pure-logic check for week.ts (node --test, native TS strip).
import test from 'node:test';
import assert from 'node:assert/strict';
import { toDayKey, weekDays } from './week.ts';

test('toDayKey: local YYYY-MM-DD, zero-padded', () => {
  assert.equal(toDayKey(new Date(2026, 6, 5)), '2026-07-05'); // month 6 = July
  assert.equal(toDayKey(new Date(2026, 11, 31)), '2026-12-31');
});

test('weekDays: 7 rolling days from the given date', () => {
  const days = weekDays(new Date(2026, 6, 21));
  assert.equal(days.length, 7);
  assert.equal(days[0].key, '2026-07-21');
  assert.equal(days[6].key, '2026-07-27');
});

test('weekDays: first two labels are Today / Tomorrow, rest are weekdays', () => {
  const days = weekDays(new Date(2026, 6, 21));
  assert.equal(days[0].label, 'Today');
  assert.equal(days[1].label, 'Tomorrow');
  assert.notEqual(days[2].label, 'Today');
  assert.notEqual(days[2].label, 'Tomorrow');
});

test('weekDays: rolls across a month boundary', () => {
  const days = weekDays(new Date(2026, 6, 29));
  assert.equal(days[0].key, '2026-07-29');
  assert.equal(days[3].key, '2026-08-01');
});
