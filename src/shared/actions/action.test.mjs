import test from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { bind, defineActions, dispatch, toTool } from './action.ts';

const specs = defineActions({
  add: { name: 'add_thing', summary: 'Add a thing.', risk: 'safe', touches: ['things'], input: z.object({ n: z.number().int() }) },
  boom: { name: 'boom_thing', summary: 'Fails.', risk: 'confirm', touches: [], input: z.object({}) },
});
const seen = [];
const actions = bind(specs, {
  add: async ({ n }, ctx) => {
    seen.push({ n, wantUndo: ctx.wantUndo });
    return { result: n * 2, undo: { action: 'remove_thing', input: { n } } };
  },
  boom: async () => {
    throw new Error('nope');
  },
});

test('dispatch validates, runs, and hands back the undo and what to refresh', async () => {
  const out = await dispatch(actions, { action: 'add_thing', input: { n: 3 } }, { userId: 'u' });
  assert.deepEqual(out, { ok: true, result: 6, undo: { action: 'remove_thing', input: { n: 3 } }, touches: ['things'] });
  assert.deepEqual(seen.at(-1), { n: 3, wantUndo: true }); // untrusted callers always get an undo
});

test('dispatch answers instead of throwing: unknown name, bad input, failed run', async () => {
  assert.deepEqual(await dispatch(actions, { action: 'nope', input: {} }, { userId: 'u' }), { ok: false, error: 'No action named nope.' });
  const bad = await dispatch(actions, { action: 'add_thing', input: { n: 1.5 } }, { userId: 'u' });
  assert.equal(bad.ok, false);
  assert.match(bad.error, /n/);
  assert.equal(seen.length, 1); // the runner never saw the bad input
  assert.deepEqual(await dispatch(actions, { action: 'boom_thing', input: {} }, { userId: 'u' }), { ok: false, error: 'nope' });
});

test('toTool is a plain Chat Completions function tool', () => {
  const tool = toTool(specs.add);
  assert.equal(tool.type, 'function');
  assert.equal(tool.function.name, 'add_thing');
  assert.equal(tool.function.parameters.type, 'object');
  assert.equal('$schema' in tool.function.parameters, false);
  assert.deepEqual(tool.function.parameters.required, ['n']);
});

test('dispatch refuses a flagged action unless its flag is on, and survives odd throws', async () => {
  const flagged = bind(
    defineActions({ f: { name: 'flag_thing', summary: 'Flagged.', risk: 'safe', touches: [], input: z.object({}), flag: 'flowV2' } }),
    { f: async () => { throw null; } },
  );
  assert.deepEqual(await dispatch(flagged, { action: 'flag_thing', input: {} }, { userId: 'u' }), { ok: false, error: "flag_thing isn't available in this version." });
  assert.deepEqual(await dispatch(flagged, { action: 'flag_thing', input: {} }, { userId: 'u' }, { flowV2: true }), { ok: false, error: 'That did not work.' });
});
