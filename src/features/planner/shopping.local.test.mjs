import test from 'node:test';
import assert from 'node:assert/strict';
import { EMPTY_LOCAL, newCustomKey, optimisticUpdate, serialStore, addCustom, fromStored, hide, removeCustom, setDropped, tick, toStored, unhide, untick } from './shopping.local.ts';

test('edits return the same object when nothing changes (no write, nothing to undo)', () => {
  const l = EMPTY_LOCAL;
  assert.equal(tick(l, 'a', false), l);
  assert.equal(removeCustom(l, 'custom-1'), l);
  assert.equal(unhide(l, [{ key: 'x', sources: ['1'] }]), l);
  assert.equal(setDropped(l, '52772', false), l);
  const t = tick(l, 'a', true);
  assert.deepEqual(t.checked, { a: true });
  assert.equal(tick(t, 'a', true), t);
  assert.deepEqual(untick(t, ['a']).checked, {});
});

test('a re-added extra comes back unticked; adding the same key twice is a no-op', () => {
  const ticked = tick(addCustom(EMPTY_LOCAL, 'custom-1', 'Coffee'), 'custom-1', true);
  const gone = removeCustom(ticked, 'custom-1');
  const back = addCustom(gone, 'custom-1', 'Coffee');
  assert.deepEqual(back.custom, [{ key: 'custom-1', name: 'Coffee' }]);
  assert.equal(back.checked['custom-1'], undefined);
  assert.equal(addCustom(back, 'custom-1', 'Coffee'), back);
});

test('hide and unhide match on key AND sources', () => {
  const h = hide(EMPTY_LOCAL, [{ key: 'flour', sources: ['1', '2'], at: 5 }]);
  assert.equal(hide(h, [{ key: 'flour', sources: ['2', '1'] }]), h); // same set, any order
  assert.equal(unhide(h, [{ key: 'flour', sources: ['3'] }]), h); // another week's flour stays
  assert.deepEqual(unhide(h, [{ key: 'flour', sources: ['1', '2'] }]).removed, []);
});

test('dropped dishes toggle by recipe id', () => {
  const d = setDropped(EMPTY_LOCAL, '52772', true);
  assert.deepEqual(d.excluded, ['52772']);
  assert.equal(setDropped(d, '52772', true), d);
  assert.deepEqual(setDropped(d, '52772', false).excluded, []);
});

test('stored blob: v2 removals kept, older removals dropped, round trip', () => {
  const removed = [{ key: 'flour', sources: ['1'] }];
  assert.deepEqual(fromStored({ checked: {}, custom: [], excluded: [], removed, removedV: 2 }).removed, removed);
  assert.deepEqual(fromStored({ checked: {}, custom: [], excluded: [], removed, removedV: 1 }).removed, []);
  const l = hide(EMPTY_LOCAL, removed);
  assert.deepEqual(fromStored(toStored(l)), l);
});

// --- store mechanics --------------------------------------------------------

function harness(initial = EMPTY_LOCAL) {
  let disk = initial;
  const store = serialStore(async () => disk, async (l) => { disk = l; });
  let cached = initial;
  const update = optimisticUpdate({ get: () => cached, set: (l) => { cached = l; } }, store.write);
  return { store, update, disk: () => disk, cache: () => cached };
}

test('an extra added, ticked and removed lands the same way in the cache and on disk', async () => {
  const h = harness();
  const key = newCustomKey(); // made once, outside the edit (store rule)
  await h.update((l) => addCustom(l, key, 'Batteries'));
  await h.update((l) => tick(l, key, true));
  assert.deepEqual(h.disk(), h.cache());
  await h.update((l) => removeCustom(l, key));
  assert.deepEqual(h.disk().custom, []);
  assert.deepEqual(h.cache(), h.disk());
});

test('a change Otto writes meanwhile reaches the screen when the next edit lands', async () => {
  const h = harness();
  await h.store.write((l) => tick(l, 'milk', true)); // Otto: disk only
  await h.update((l) => setDropped(l, '52772', true)); // the screen's next edit
  assert.deepEqual(h.cache().checked, { milk: true });
  assert.deepEqual(h.cache(), h.disk());
});

test('quick edits in a row never flash back: the cache waits for the last write', async () => {
  const h = harness();
  const seen = [];
  let cached = EMPTY_LOCAL;
  const update = optimisticUpdate({ get: () => cached, set: (l) => { cached = l; seen.push(Object.keys(l.checked).length); } }, h.store.write);
  await Promise.all([update((l) => tick(l, 'a', true)), update((l) => tick(l, 'b', true)), update((l) => tick(l, 'c', true))]);
  assert.deepEqual(seen.slice(0, 3), [1, 2, 3]); // optimistic
  assert.ok(seen.slice(3).every((n) => n === 3), `flashed back: ${seen}`); // only the final write sets it
});

test('newerCopy: the newer save wins; an untimed phone copy loses to the account', async () => {
  const { newerCopy } = await import('./shopping.local.ts');
  assert.equal(newerCopy(200, 100), 'local');
  assert.equal(newerCopy(100, 200), 'remote');
  assert.equal(newerCopy(100, 100), 'same');
  assert.equal(newerCopy(undefined, 100), 'remote');
  assert.equal(newerCopy(100, null), 'local');
  assert.equal(newerCopy(undefined, null), 'same');
});

test('serialStore: pull runs before a read, never inside a write, and a failed pull still reads', async () => {
  const seen = [];
  let disk = EMPTY_LOCAL;
  const store = serialStore(
    async () => { seen.push('load'); return disk; },
    async (l) => { seen.push('save'); disk = l; },
    async () => { seen.push('pull'); throw new Error('offline'); },
  );
  await store.read();
  await store.write((l) => tick(l, 'k', true));
  assert.deepEqual(seen, ['pull', 'load', 'load', 'save']);
});
