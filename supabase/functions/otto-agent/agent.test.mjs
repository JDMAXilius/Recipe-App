import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { agentTools, checkArgs, cleanArgs, dayInWindow, idempotencyKey, inverseOf, shuffleKey, stillAsLeft, summaryOf, PLAN_TOOLS, REQUEST_ID } from './agent.ts';

const manifest = JSON.parse(readFileSync(new URL('../_shared/actions.json', import.meta.url), 'utf8'));
const row = { id: 7, day: '2026-11-09', title: 'Ramen', recipe_id: '52772', image: null, category: 'Pasta', note: null, label: 'dinner', kind: 'recipe', cooked: false, position: 1024 };

test('tools: the two reads plus only the plan actions, never deletes, household or prefs', () => {
  const names = agentTools(manifest).map((t) => t.function.name);
  assert.deepEqual(names.slice(0, 2), ['read_week', 'find_dinners']);
  for (const n of names.slice(2)) assert.ok(PLAN_TOOLS.includes(n), n);
  for (const banned of ['delete_my_recipe', 'leave_household', 'join_household', 'create_household', 'save_my_recipe', 'add_to_my_list']) assert.ok(!names.includes(banned), banned);
  assert.equal(names.length, 2 + PLAN_TOOLS.length);
});

test('checkArgs: real ids and days only', () => {
  assert.equal(checkArgs('put_in_plan', { day: '2026-11-09', recipeId: '52772' }), null);
  assert.match(checkArgs('put_in_plan', { day: 'monday', recipeId: '52772' }), /YYYY/);
  assert.match(checkArgs('put_in_plan', { day: '2026-11-09' }), /find_dinners/);
  assert.match(checkArgs('remove_from_plan', { id: -1 }), /read_week/);
  assert.equal(checkArgs('mark_cooked', { id: 3, cooked: true }), null);
  assert.match(checkArgs('mark_cooked', { id: 3, cooked: 'yes' }), /true or false/);
  assert.equal(checkArgs('label_plan_item', { id: 3, label: null }), null);
  assert.match(checkArgs('delete_my_recipe', {}), /no tool/);
  assert.equal(dayInWindow('2026-11-09', ['2026-11-09']), true);
  assert.equal(dayInWindow('2025-01-01', ['2026-11-09']), false);
});

test('inverseOf: every write knows how to put things back, and a no-op has nothing to undo', () => {
  assert.deepEqual(inverseOf('put_in_plan', {}, null, row), { action: 'remove_from_plan', input: { id: 7 }, expect: { id: 7, recipe_id: '52772', day: '2026-11-09', note: null, label: 'dinner', cooked: false } });
  const back = inverseOf('remove_from_plan', { id: 7 }, row, null);
  assert.equal(back.action, 'put_in_plan');
  assert.equal(back.input.recipeId, '52772');
  assert.equal(back.input.position, 1024);
  assert.equal(back.input.cooked, false); // a cooked dish comes back cooked
  assert.deepEqual(inverseOf('mark_cooked', { id: 7, cooked: true }, row, null), { action: 'mark_cooked', input: { id: 7, cooked: false }, expect: { id: 7, cooked: true } });
  assert.equal(inverseOf('mark_cooked', { id: 7, cooked: false }, row, null), null);
  assert.equal(inverseOf('label_plan_item', { id: 7, label: 'dinner' }, row, null), null);
  assert.deepEqual(inverseOf('move_plan_item', { id: 7, day: '2026-11-10' }, row, null).input, { id: 7, day: '2026-11-09', position: 1024 });
  assert.equal(inverseOf('swap_in_plan', { id: 7, recipeId: '1' }, row, null).input.recipeId, '52772');
});

test('summaryOf and idempotencyKey', () => {
  assert.equal(summaryOf('put_in_plan', { day: '2026-11-09' }, null, { title: 'Tacos' }), 'Put Tacos on Monday');
  assert.equal(summaryOf('swap_in_plan', { id: 7 }, row, { title: 'Tacos' }), 'Swapped Ramen for Tacos');
  assert.equal(summaryOf('mark_cooked', { id: 7, cooked: true }, row, {}), 'Marked Ramen cooked');
  const k = idempotencyKey('req-123', 0, 'put_in_plan', { day: 'x' });
  assert.equal(k, idempotencyKey('req-123', 0, 'put_in_plan', { day: 'x' }));
  assert.notEqual(k, idempotencyKey('req-123', 1, 'put_in_plan', { day: 'x' }));
  assert.ok(k.length >= 8 && k.length <= 128);
});

test('undo guard, clean args, request ids and the shuffle', () => {
  const inv = inverseOf('put_in_plan', {}, null, row);
  assert.equal(stillAsLeft(inv.expect, row), true);
  assert.equal(stillAsLeft(inv.expect, { ...row, recipe_id: '999' }), false); // swapped by hand since
  assert.equal(stillAsLeft(inv.expect, null), false); // gone
  assert.equal(stillAsLeft(inv.expect, { ...row, note: 'double portion' }), false); // a note added since
  assert.equal(stillAsLeft(inv.expect, { ...row, cooked: true }), false); // ticked since
  assert.ok(inverseOf('move_plan_item', { id: 7, day: '2026-11-10' }, { ...row, position: null }, null)); // legacy row still undoable
  assert.match(checkArgs('put_in_plan', { day: '2026-11-09', recipeId: 'r', label: 'x'.repeat(30) }), /label/);
  assert.deepEqual(cleanArgs('put_in_plan', { day: 'd', recipeId: 'r', user_id: 'x', title: 'evil', note: 'n'.repeat(500) }), { day: 'd', recipeId: 'r', note: 'n'.repeat(200) });
  assert.deepEqual(cleanArgs('move_plan_item', { id: 1, day: 'd', position: 0 }), { id: 1, day: 'd' });
  assert.ok(REQUEST_ID.test('r1abcdefgh'));
  assert.ok(!REQUEST_ID.test('r1_abcdefgh')); // underscore is a LIKE wildcard
  assert.ok(!REQUEST_ID.test('short'));
  const order = (rid) => ['52772', '52773', '52774', '52775'].sort((a, b) => shuffleKey(rid, a) - shuffleKey(rid, b)).join();
  assert.notEqual(order('raaaaaaaa1'), order('rzzzzzzzz9'));
});
