// Run: node --test --experimental-strip-types src/features/cook/reviewPrompt.logic.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldAsk, COOLDOWN_MS } from './reviewPrompt.logic.ts';

test('shouldAsk: not before the 3rd finished cook', () => {
  assert.equal(shouldAsk({ cooks: 2, lastAskedAt: null }, 0), false);
  assert.equal(shouldAsk({ cooks: 3, lastAskedAt: null }, 0), true);
});

test('shouldAsk: 90-day cooldown after an ask', () => {
  const asked = 1_000;
  assert.equal(shouldAsk({ cooks: 9, lastAskedAt: asked }, asked + COOLDOWN_MS - 1), false);
  assert.equal(shouldAsk({ cooks: 9, lastAskedAt: asked }, asked + COOLDOWN_MS), true);
});
