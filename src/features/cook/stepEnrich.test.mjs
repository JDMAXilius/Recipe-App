// Colocated unit tests for step enrichment (node --test, native TS strip).
// Run: node --test src/features/cook/stepEnrich.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { segmentStep } from './stepEnrich.ts';

test('segmentStep: splits duration + temp out of prose', () => {
  const segs = segmentStep('Bake 35 minutes at 350° F.');
  assert.deepEqual(segs, [
    { type: 'text', text: 'Bake ' },
    { type: 'duration', text: '35 minutes', minutes: 35 },
    { type: 'text', text: ' at ' },
    { type: 'temp', text: '350° F' },
    { type: 'text', text: '.' },
  ]);
});

test('segmentStep: hours and seconds convert to minutes', () => {
  const h = segmentStep('Rest 2 hours.').find((s) => s.type === 'duration');
  assert.equal(h.minutes, 120);
  const s = segmentStep('Blanch 30 seconds.').find((x) => x.type === 'duration');
  assert.equal(s.minutes, 1); // rounds up to a usable 1-min timer
});

test('segmentStep: a range uses the upper (kitchen-safe) bound', () => {
  const d = segmentStep('Simmer 8-10 minutes.').find((s) => s.type === 'duration');
  assert.equal(d.text, '8-10 minutes');
  assert.equal(d.minutes, 10);
  const d2 = segmentStep('Fry 3 to 4 mins.').find((s) => s.type === 'duration');
  assert.equal(d2.minutes, 4);
});

test('segmentStep: empty input yields a single empty text segment', () => {
  assert.deepEqual(segmentStep(''), [{ type: 'text', text: '' }]);
});
