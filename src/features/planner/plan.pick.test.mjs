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
