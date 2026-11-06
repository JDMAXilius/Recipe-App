// Snap a meal contract tests. The fixtures are representative MODEL OUTPUTS
// (what gpt answers for a photo), not photos: they pin the shaping and the
// deterministic checks. The photo calibration set (real meals with known
// recipes) is R6.5 work and scores the model itself.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { checkScan, gramsOf, shapeScan, SCAN_SCHEMA } from './scan.ts';

const fixture = (name) => JSON.parse(readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), 'utf8'));

test('every fixture matches the strict schema keys (no extra, none missing)', () => {
  for (const name of ['banana-bread', 'chicken-bowl', 'lasagna', 'bad-loaf', 'not-food']) {
    assert.deepEqual(Object.keys(fixture(name)).sort(), [...SCAN_SCHEMA.required].sort(), name);
  }
});

test('banana bread: 2 slices become the whole loaf, served by the slice', () => {
  const shaped = shapeScan(fixture('banana-bread'));
  assert.equal(shaped.ok, true);
  const r = shaped.recipe;
  assert.deepEqual(r.yield, { qty: 1, unit: 'loaf' });
  assert.deepEqual(r.servings, { count: 10, unit: 'slice' });
  assert.deepEqual(r.portion, { count: 2, unit: 'slice' });
  assert.equal(r.questions.length, 1);
  assert.deepEqual(checkScan(r), []);
});

test('a bowl and a tray pass the checks', () => {
  assert.deepEqual(checkScan(shapeScan(fixture('chicken-bowl')).recipe), []);
  assert.deepEqual(checkScan(shapeScan(fixture('lasagna')).recipe), []);
});

test('a broken loaf is caught: single serving, too much leavening, too few ingredients', () => {
  const issues = checkScan(shapeScan(fixture('bad-loaf')).recipe);
  assert.equal(issues.length, 3);
  assert.match(issues.join(' '), /whole loaf/);
  assert.match(issues.join(' '), /leavening/);
  assert.match(issues.join(' '), /portion in the photo/);
});

test('not food is a kind decline, not a recipe', () => {
  assert.deepEqual(shapeScan(fixture('not-food')), { ok: false, decline: 'That looks like a houseplant, not a meal.' });
});

test('garbage and empty recipes shape to null', () => {
  assert.equal(shapeScan(null), null);
  assert.equal(shapeScan({ is_food: true, ingredients: [], steps: [] }), null);
});

test('shaping clamps and normalises what the model sends', () => {
  const r = shapeScan({ ...fixture('banana-bread'), archetype: 'spaceship', servings: { count: 999.4, unit: 'SLICES' }, questions: ['a', 'b', 'c'] }).recipe;
  assert.equal(r.archetype, 'plate');
  assert.deepEqual(r.servings, { count: 200, unit: 'slice' });
  assert.match(r.assumptions.at(-1), /Capped at 200/); // never a silent cap
  assert.equal(r.questions.length, 2);
  // servings never round to zero
  assert.equal(shapeScan({ ...fixture('banana-bread'), servings: { count: 0.4, unit: 'slice' } }).recipe.servings.count, 1);
  // a 120-cookie batch fits without a cap or a note
  const cookies = shapeScan({ ...fixture('banana-bread'), archetype: 'batch', yield: { qty: 120, unit: 'cookies' }, servings: { count: 120, unit: 'cookies' } }).recipe;
  assert.deepEqual(cookies.servings, { count: 120, unit: 'cookie' });
  assert.equal(cookies.assumptions.some((a) => /Capped/.test(a)), false);
});

test('gramsOf reads weights and small spoon measures', () => {
  assert.equal(gramsOf('250 g'), 250);
  assert.equal(gramsOf('1.2 kg'), 1200);
  assert.equal(gramsOf('1 tsp'), 4.8);
  assert.equal(gramsOf('2'), null);
  assert.equal(gramsOf(''), null);
});
