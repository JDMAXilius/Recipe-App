import test from 'node:test';
import assert from 'node:assert/strict';
import { EMPTY_LOCAL, addCustom, fromStored, hide, removeCustom, setDropped, tick, toStored, unhide, untick } from './shopping.local.ts';

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
