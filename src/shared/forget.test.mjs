// Every stored key has a decision (S1): forgotten with the person, handed to
// the next account, or kept as the phone's. A new key without one fails here.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (f) => readFileSync(new URL(f, import.meta.url), 'utf8');
const keys = [...read('./storage.ts').match(/export type StoreKey =([\s\S]*?);/)[1].matchAll(/'([A-Za-z]+)'/g)].map((m) => m[1]);
const list = (name) => [...read('./forget.ts').match(new RegExp(`export const ${name}: StoreKey\\[\\] = \\[([^\\]]*)\\]`))[1].matchAll(/'([A-Za-z]+)'/g)].map((m) => m[1]);

test('every kv key is forgotten, handed over or kept, exactly once', () => {
  const decided = [...list('PERSONAL'), ...list('HANDOVER'), ...list('KEPT')];
  assert.deepEqual([...keys].sort(), [...new Set(decided)].sort().filter((k) => keys.includes(k)));
  assert.equal(decided.length, new Set(decided).size, 'a key is in two lists');
  for (const k of ['chats', 'journal', 'prefs', 'aiConsentOpenAI', 'shoppingState', 'cookRatings']) assert.ok(list('PERSONAL').includes(k), k);
});
