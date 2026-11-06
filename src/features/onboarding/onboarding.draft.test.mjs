import test from 'node:test';
import assert from 'node:assert/strict';
import { claimSteps, DRAFT_MAX_AGE_MS, newDraft, readDraft } from './onboarding.draft.ts';

const week = [
  { day: '2026-11-05', recipeId: '1', title: 'A', image: null, category: 'Beef' },
  { day: '2026-11-06', recipeId: '2', title: 'B', image: null, category: 'Chicken' },
  { day: '2026-11-07', recipeId: '3', title: 'C', image: null, category: 'Pasta' },
];
const now = Date.UTC(2026, 10, 6, 12);

test('a draft reads back; junk, other versions and stale drafts are none', () => {
  const d = newDraft({ diet: 'vegan' }, week, now);
  assert.deepEqual(readDraft(JSON.parse(JSON.stringify(d)), now), d);
  assert.equal(readDraft(null, now), null);
  assert.equal(readDraft({ ...d, v: 2 }, now), null);
  assert.equal(readDraft({ ...d, week: [{ day: 'tuesday' }] }, now), null);
  assert.equal(readDraft(d, now + DRAFT_MAX_AGE_MS + 1), null);
});

test('claim: from today on, labelled dinner, and never doubles what the plan has', () => {
  const d = newDraft({}, week, now);
  assert.deepEqual(claimSteps(d, '2026-11-06', []).map((s) => [s.day, s.recipeId, s.label]), [
    ['2026-11-06', '2', 'dinner'],
    ['2026-11-07', '3', 'dinner'],
  ]);
  const again = claimSteps(d, '2026-11-06', [{ day: '2026-11-06', recipe_id: '2' }]);
  assert.deepEqual(again.map((s) => s.recipeId), ['3']);
});
