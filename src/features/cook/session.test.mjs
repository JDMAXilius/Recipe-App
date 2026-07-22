// Colocated unit tests for cook session logic (node --test, native TS strip).
// Run: node --test src/features/cook/session.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { splitSteps, matchStepIngredients, mmss } from './session.ts';

test('splitSteps: keeps short steps whole and drops blanks', () => {
  assert.deepEqual(splitSteps(['Heat the pan.', '', '  ']), ['Heat the pan.']);
});

test('splitSteps: breaks a long paragraph on sentence boundaries under the cap', () => {
  const long =
    'Preheat the oven to 200C. ' +
    'Season the chicken generously with salt and pepper on both sides. ' +
    'Heat a large skillet over medium-high heat until shimmering hot. ' +
    'Add the chicken and sear undisturbed for four minutes per side until golden. ' +
    'Transfer everything to the oven and roast until cooked through and juicy.';
  const out = splitSteps([long]);
  assert.ok(out.length > 1, 'a >220-char paragraph must split into multiple steps');
  for (const chunk of out) assert.ok(chunk.length <= 220, `chunk too long: ${chunk.length}`);
  // No content lost: every sentence fragment survives across the chunks.
  assert.ok(out.join(' ').includes('sear undisturbed for four minutes'));
});

test('matchStepIngredients: every significant word must hit (no soy/sauce bleed)', () => {
  const pairs = [
    { measure: '2 tbsp', name: 'soy sauce' },
    { measure: '1', name: 'garlic clove, minced' },
    { measure: '200 g', name: 'chicken breast' },
  ];
  // "the sauce" alone must NOT match "soy sauce" (requires both words).
  assert.deepEqual(matchStepIngredients('Stir the sauce until glossy.', pairs), []);
  // Every significant word required: "chicken" alone must NOT pull "chicken breast".
  const partial = matchStepIngredients('Add the minced garlic cloves and chicken.', pairs);
  assert.deepEqual(partial.map((p) => p.name), ['garlic clove, minced']);
  // Plural tolerance ("cloves"→"clove") + full multi-word match ("chicken breast").
  const hit = matchStepIngredients('Add the minced garlic cloves and the chicken breast.', pairs);
  assert.deepEqual(hit.map((p) => p.name), ['garlic clove, minced', 'chicken breast']);
});

test('mmss: zero-pads and floors, never negative', () => {
  assert.equal(mmss(0), '00:00');
  assert.equal(mmss(5), '00:05');
  assert.equal(mmss(65), '01:05');
  assert.equal(mmss(-3), '00:00');
});
