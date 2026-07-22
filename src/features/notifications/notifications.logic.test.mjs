// Colocated pure-logic check for notifications.logic.ts (node --test, TS strip).
// The correctness that matters: which planned days become a nudge, that cooked
// dishes and past times are pruned, and that the id is stable (so re-sync is
// idempotent).
import test from 'node:test';
import assert from 'node:assert/strict';
import { computeNotifications, DEFAULT_PREFS } from './notifications.logic.ts';

// Wed 2026-07-22, 10:00 local — before any 4-7pm dinner nudge today.
const now = new Date(2026, 6, 22, 10, 0, 0, 0);
const row = (day, title, cooked = false) => ({ day, title, cooked });

test('both off → nothing scheduled', () => {
  const out = computeNotifications([row('2026-07-22', 'Chili')], DEFAULT_PREFS, now);
  assert.deepEqual(out, []);
});

test('tonight on → one nudge per future planned day, naming the dish', () => {
  const out = computeNotifications(
    [row('2026-07-22', 'Chili'), row('2026-07-24', 'Ramen')],
    { tonight: true, hour: 17, sunday: false },
    now,
  );
  assert.equal(out.length, 2);
  assert.equal(out[0].id, 'tonight-2026-07-22');
  assert.match(out[0].body, /Chili/);
  assert.equal(out[0].date.getHours(), 17);
  // sorted by fire time
  assert.ok(out[0].date < out[1].date);
});

test('cooked dishes are excluded', () => {
  const out = computeNotifications(
    [row('2026-07-22', 'Chili', true)],
    { tonight: true, hour: 17, sunday: false },
    now,
  );
  assert.equal(out.length, 0);
});

test('past fire-time today is pruned', () => {
  // now is 10am; a 9am (hour 9) nudge for today is already past.
  const out = computeNotifications(
    [row('2026-07-22', 'Chili')],
    { tonight: true, hour: 9, sunday: false },
    now,
  );
  assert.equal(out.length, 0);
});

test('multiple dishes on a day → first + "and N more"', () => {
  const out = computeNotifications(
    [row('2026-07-23', 'Chili'), row('2026-07-23', 'Salad'), row('2026-07-23', 'Bread')],
    { tonight: true, hour: 18, sunday: false },
    now,
  );
  assert.equal(out.length, 1);
  assert.match(out[0].body, /Chili and 2 more/);
});

test('sunday on → next Sunday at 9am', () => {
  const out = computeNotifications([], { tonight: false, hour: 17, sunday: true }, now);
  assert.equal(out.length, 1);
  assert.equal(out[0].date.getDay(), 0); // Sunday
  assert.equal(out[0].date.getHours(), 9);
  // Wed 7/22 → coming Sunday is 7/26
  assert.equal(out[0].id, 'sunday-2026-07-26');
});
