// Colocated unit tests for step-action detection + art mapping (node --test).
// Run: node --test src/features/cook/stepAction.test.mjs
// NOTE: stepAction.ts imports OttoArtName as a TYPE only — type-stripping erases
// it, so this loads with no react-native / '@/shared/ui' runtime resolution.
import test from 'node:test';
import assert from 'node:assert/strict';
import { detectStepAction, ACTION_ART, stepActionArt } from './stepAction.ts';

test('detectStepAction: earliest action keyword wins', () => {
  assert.equal(detectStepAction('Chop the onion, then stir into the pan.'), 'chop');
  assert.equal(detectStepAction('Stir, then chop the herbs.'), 'mix');
  assert.equal(detectStepAction('Sear the steak in a hot skillet.'), 'saute');
  assert.equal(detectStepAction('Bake at 200C until golden.'), 'bake');
  assert.equal(detectStepAction('Serve hot and enjoy.'), 'serve');
});

test('detectStepAction: falls back to generic cook when no verb matches', () => {
  assert.equal(detectStepAction('A pinch of magic.'), 'cook');
  assert.equal(detectStepAction(''), 'cook');
});

test('ACTION_ART: every action maps to an action-* OttoArt name', () => {
  for (const [action, name] of Object.entries(ACTION_ART)) {
    assert.equal(name, `action-${action}`, `${action} must map to action-${action}`);
  }
});

test('stepActionArt: text → OttoArt name in one hop', () => {
  assert.equal(stepActionArt('Chop the onion.'), 'action-chop');
  assert.equal(stepActionArt('Nothing to see.'), 'action-cook');
});
