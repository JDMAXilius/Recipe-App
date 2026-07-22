// Colocated pure-logic checks for draft.ts (node --test, native TS strip).
// Covers the two behaviors the packet names: save validation and dirty-state,
// plus the take-once hand-off slot.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cloneDraft,
  emptyDraft,
  isDirty,
  setDraft,
  takeDraft,
  toSavePayload,
} from './draft.ts';

test('emptyDraft: blank manual draft, carries a url when given', () => {
  const d = emptyDraft();
  assert.equal(d.mode, 'manual');
  assert.equal(d.source, 'manual');
  assert.equal(d.title, '');
  assert.equal(d.sourceUrl, null);
  assert.equal(emptyDraft('https://x.com/r').sourceUrl, 'https://x.com/r');
});

test('takeDraft: reading consumes the slot exactly once', () => {
  assert.equal(takeDraft(), null); // empty to start
  const d = emptyDraft();
  setDraft(d);
  assert.equal(takeDraft(), d);
  assert.equal(takeDraft(), null); // gone — no stale leak into the next open
});

test('toSavePayload: a name is required', () => {
  const d = emptyDraft();
  d.title = '   ';
  const r = toSavePayload(d);
  assert.equal(r.ok, false);
  assert.match(r.error, /name/i);
});

test('toSavePayload: trims, drops blank rows, nulls empty optionals', () => {
  const d = emptyDraft();
  d.title = '  Tuesday Soup  ';
  d.image = '   ';
  d.category = ' Soup ';
  d.ingredients = [
    { measure: ' 500 g ', name: ' chicken ' },
    { measure: '1 tsp', name: '   ' }, // no name → dropped
    { measure: '', name: 'salt, to taste' }, // unmeasured, kept
  ];
  d.steps = [' Simmer. ', '', '   '];
  const r = toSavePayload(d);
  assert.equal(r.ok, true);
  assert.equal(r.recipe.title, 'Tuesday Soup');
  assert.equal(r.recipe.image, null);
  assert.equal(r.recipe.category, 'Soup');
  assert.deepEqual(r.recipe.ingredients, [
    { measure: '500 g', name: 'chicken' },
    { measure: '', name: 'salt, to taste' },
  ]);
  assert.deepEqual(r.recipe.steps, ['Simmer.']);
});

test('isDirty: false against its own clone, true after any edit', () => {
  const base = emptyDraft();
  base.title = 'Stew';
  base.ingredients = [{ measure: '500 g', name: 'beef' }];
  base.steps = ['Brown the beef.'];
  const baseline = cloneDraft(base);

  assert.equal(isDirty(base, baseline), false);

  const titled = { ...base, title: 'Beef Stew' };
  assert.equal(isDirty(titled, baseline), true);

  const stepEdited = { ...base, steps: ['Sear the beef.'] };
  assert.equal(isDirty(stepEdited, baseline), true);

  const ingAdded = { ...base, ingredients: [...base.ingredients, { measure: '', name: 'salt' }] };
  assert.equal(isDirty(ingAdded, baseline), true);

  const servings = { ...base, servings: base.servings + 1 };
  assert.equal(isDirty(servings, baseline), true);
});

test('cloneDraft: arrays do not alias the source', () => {
  const d = emptyDraft();
  d.ingredients = [{ measure: '1', name: 'egg' }];
  const c = cloneDraft(d);
  c.ingredients[0].name = 'flour';
  assert.equal(d.ingredients[0].name, 'egg'); // original untouched
});
