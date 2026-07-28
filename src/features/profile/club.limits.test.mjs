// Colocated unit tests for the free-tier arithmetic (node --test, native TS strip).
// Run: node --test src/features/profile/club.limits.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FREE_LIMITS,
  emptyUsage,
  monthKey,
  dayKey,
  rollUsage,
  remaining,
  allowed,
  bump,
} from './club.limits.ts';

const JULY = new Date(2026, 6, 28, 12, 0, 0); // 2026-07-28, local
const AUGUST = new Date(2026, 7, 1, 0, 30, 0); // 2026-08-01, local
const NEXT_DAY = new Date(2026, 6, 29, 0, 5, 0);

const input = (over) => ({
  member: false,
  usage: emptyUsage,
  savedCount: 0,
  now: JULY,
  ...over,
});

test('period keys are local, zero-padded', () => {
  assert.equal(monthKey(JULY), '2026-07');
  assert.equal(dayKey(JULY), '2026-07-28');
  assert.equal(dayKey(new Date(2026, 0, 5)), '2026-01-05');
});

test('a member is never limited', () => {
  const maxed = { month: '2026-07', imports: 999, day: '2026-07-28', asks: 999 };
  assert.equal(remaining('import', input({ member: true, usage: maxed })), Infinity);
  assert.equal(allowed('ask', input({ member: true, usage: maxed })), true);
  assert.equal(allowed('save', input({ member: true, savedCount: 10_000 })), true);
});

test('imports run out inside a month and reset on the next one', () => {
  let usage = emptyUsage;
  for (let i = 0; i < FREE_LIMITS.importsPerMonth; i++) {
    assert.equal(allowed('import', input({ usage })), true, `import ${i + 1} should be allowed`);
    usage = bump('import', usage, JULY);
  }
  assert.equal(allowed('import', input({ usage })), false);
  assert.equal(remaining('import', input({ usage })), 0);
  // Same counter, next month: the roll zeroes it without anyone clearing state.
  assert.equal(allowed('import', input({ usage, now: AUGUST })), true);
  assert.equal(remaining('import', input({ usage, now: AUGUST })), FREE_LIMITS.importsPerMonth);
});

test('asks reset daily, not monthly', () => {
  let usage = emptyUsage;
  for (let i = 0; i < FREE_LIMITS.asksPerDay; i++) usage = bump('ask', usage, JULY);
  assert.equal(allowed('ask', input({ usage })), false);
  assert.equal(allowed('ask', input({ usage, now: NEXT_DAY })), true);
});

test('bump on a rolled-over period starts from zero, not from the stale count', () => {
  const stale = { month: '2026-06', imports: 5, day: '2026-06-30', asks: 5 };
  assert.deepEqual(bump('import', stale, JULY), {
    month: '2026-07',
    day: '2026-07-28',
    imports: 1,
    asks: 0,
  });
});

test('saves are counted from rows, so unsaving gives the slot back', () => {
  assert.equal(allowed('save', input({ savedCount: FREE_LIMITS.savedRecipes - 1 })), true);
  assert.equal(allowed('save', input({ savedCount: FREE_LIMITS.savedRecipes })), false);
  assert.equal(allowed('save', input({ savedCount: FREE_LIMITS.savedRecipes - 1 })), true);
  // A shelf already past the limit reports 0 left, never a negative debt.
  assert.equal(remaining('save', input({ savedCount: FREE_LIMITS.savedRecipes + 40 })), 0);
});

test('rollUsage never invents a count', () => {
  const rolled = rollUsage({ month: '2026-07', imports: 3, day: '2026-07-01', asks: 4 }, JULY);
  assert.equal(rolled.imports, 3); // same month → kept
  assert.equal(rolled.asks, 0); // different day → zeroed
});
