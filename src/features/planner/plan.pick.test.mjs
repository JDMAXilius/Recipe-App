// Colocated pure-logic check for plan.pick.ts (node --test, native TS strip).
// The recipe_id encoding is the correctness that matters — a wrong prefix drops
// the dish from the shopping list.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  savedToPick,
  mineToPick,
  pickToAddInput,
  leftoversCarry,
  nextInWeek,
  tonightEntry,
} from './plan.pick.ts';

const days = [
  { key: '2026-07-21', label: 'Today', sub: '' },
  { key: '2026-07-22', label: 'Tomorrow', sub: '' },
  { key: '2026-07-27', label: 'Monday', sub: '' },
];

test('savedToPick: seed recipe keeps a bare numeric id', () => {
  const p = savedToPick({ recipeId: 52772, title: 'Teriyaki', image: 'a.jpg', category: 'Chicken', cookTime: null, servings: null });
  assert.equal(p.recipeId, '52772');
  assert.equal(p.title, 'Teriyaki');
});

test('mineToPick: user recipe gets the u- prefix (shopping-list resolver depends on it)', () => {
  const p = mineToPick({ id: 12, title: 'My Stew', image: null, category: null, source: 'manual', sourceName: null });
  assert.equal(p.recipeId, 'u-12');
});

test('pickToAddInput: places pick on a day, note stays null', () => {
  const input = pickToAddInput({ recipeId: 'u-12', title: 'My Stew', image: null, category: 'Beef' }, '2026-07-22');
  assert.deepEqual(input, {
    day: '2026-07-22',
    recipeId: 'u-12',
    title: 'My Stew',
    image: null,
    category: 'Beef',
    note: null,
  });
});

test('leftoversCarry: duplicates entry onto a new day tagged leftovers', () => {
  const entry = { id: 3, user_id: 'u', day: '2026-07-21', recipe_id: '52772', title: 'Teriyaki', image: 'a.jpg', category: 'Chicken', note: null, cooked: true, created_at: null };
  const input = leftoversCarry(entry, '2026-07-22');
  assert.equal(input.note, 'leftovers');
  assert.equal(input.recipeId, '52772');
  assert.equal(input.day, '2026-07-22');
  assert.equal(input.image, 'a.jpg');
});

test('leftoversCarry: null when the entry has no recipe to carry', () => {
  const noteOnly = { id: 4, user_id: 'u', day: '2026-07-21', recipe_id: null, title: 'BBQ', image: null, category: null, note: null, cooked: false, created_at: null };
  assert.equal(leftoversCarry(noteOnly, '2026-07-22'), null);
});

test('nextInWeek: next day within the window, null on the last day', () => {
  assert.equal(nextInWeek('2026-07-21', days), '2026-07-22');
  assert.equal(nextInWeek('2026-07-27', days), null); // last day
  assert.equal(nextInWeek('1999-01-01', days), null); // not in window
});

const entry = (over) => ({
  id: 1, user_id: 'u', day: '2026-07-21', recipe_id: '52772', title: 'Teriyaki',
  image: null, category: null, note: null, cooked: false, created_at: '', ...over,
});

test('tonightEntry: today only, prefers the first uncooked dish', () => {
  const entries = [
    entry({ id: 1, day: '2026-07-22', title: 'Tomorrow' }), // not today
    entry({ id: 2, cooked: true, title: 'Already cooked' }),
    entry({ id: 3, title: 'Tonight' }),
  ];
  assert.equal(tonightEntry(entries, '2026-07-21')?.title, 'Tonight');
});

test('tonightEntry: falls back to first today entry when all cooked', () => {
  const entries = [entry({ id: 2, cooked: true, title: 'Cooked' })];
  assert.equal(tonightEntry(entries, '2026-07-21')?.title, 'Cooked');
});

test('tonightEntry: null when nothing planned today or entry has no recipe', () => {
  assert.equal(tonightEntry([entry({ day: '2026-07-22' })], '2026-07-21'), null);
  assert.equal(tonightEntry([entry({ recipe_id: null })], '2026-07-21'), null);
  assert.equal(tonightEntry([], '2026-07-21'), null);
});
