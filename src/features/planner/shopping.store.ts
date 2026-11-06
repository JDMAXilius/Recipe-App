// The personal shopping list's store: kv is the truth, TanStack Query holds
// it for the screen (key ['shopping-local']). Every read and write is queued,
// so a read never sees half a write and two writes never interleave. Because
// the state lives in the app-level query cache, a toast's Undo works after
// the screen is gone.
import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { kv } from '@/shared/storage';
import type { Runners } from '@/shared/actions/action';
import type { listActions } from './shopping.actions';
import {
  EMPTY_LOCAL,
  EMPTY_STORED,
  addCustom,
  fromStored,
  hide,
  newCustomKey,
  removeCustom,
  setDropped,
  storedSchema,
  tick,
  toStored,
  unhide,
  type LocalList,
} from './shopping.local';

export const LOCAL_LIST_KEY = ['shopping-local'] as const;

let queue: Promise<unknown> = Promise.resolve();
function serial<T>(job: () => Promise<T>): Promise<T> {
  const run = queue.then(job, job);
  queue = run.catch(() => undefined);
  return run;
}

const load = async () => fromStored(await kv.get('shoppingState', EMPTY_STORED, storedSchema));

export const readLocalList = () => serial(load);

/** Apply an edit to the stored list; returns the list before and after. */
export function writeLocalList(edit: (l: LocalList) => LocalList) {
  return serial(async () => {
    const before = await load();
    const after = edit(before);
    if (after !== before) await kv.set('shoppingState', toStored(after));
    return { before, after };
  });
}

export function useLocalList() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: LOCAL_LIST_KEY, queryFn: readLocalList, staleTime: 0 });
  // Optimistic: the cache moves now, kv follows in order. A read already in
  // flight is cancelled so it can't land the older state over this edit.
  const update = useCallback(
    (edit: (l: LocalList) => LocalList) => {
      const prev = qc.getQueryData<LocalList>(LOCAL_LIST_KEY);
      if (prev) {
        const next = edit(prev);
        if (next === prev) return;
        void qc.cancelQueries({ queryKey: LOCAL_LIST_KEY });
        qc.setQueryData(LOCAL_LIST_KEY, next);
      }
      void writeLocalList(edit);
    },
    [qc],
  );
  return { list: query.data ?? EMPTY_LOCAL, hydrated: query.isSuccess, update };
}

// --- actions (R0.9) --------------------------------------------------------
// The screen edits through useLocalList; Otto through these, then refreshes
// ['shopping-local'] (the spec's touches). Undo only when something changed.
const changedTo = <T>(r: { before: LocalList; after: LocalList }, undo: T) => (r.after === r.before ? null : undo);

export const listRun = {
  tick: async ({ itemKey, checked }, _ctx) => {
    const r = await writeLocalList((l) => tick(l, itemKey, checked));
    return { result: null, undo: changedTo(r, { action: 'tick_my_list_item', input: { itemKey, checked: !checked } }) };
  },
  addItem: async ({ name }, _ctx) => {
    const key = newCustomKey();
    await writeLocalList((l) => addCustom(l, key, name));
    return { result: key, undo: { action: 'remove_from_my_list', input: { itemKey: key } } };
  },
  removeItem: async ({ itemKey }, _ctx) => {
    const r = await writeLocalList((l) => removeCustom(l, itemKey));
    const name = r.before.custom.find((c) => c.key === itemKey)?.name;
    if (!name) throw new Error("That list item isn't there any more.");
    return { result: null, undo: { action: 'add_to_my_list', input: { name } } };
  },
  hideItem: async ({ itemKey, removed, sources }, _ctx) => {
    const entry = { key: itemKey, sources };
    const r = await writeLocalList((l) => (removed ? hide(l, [{ ...entry, at: Date.now() }]) : unhide(l, [entry])));
    return { result: null, undo: changedTo(r, { action: 'hide_my_list_item', input: { itemKey, removed: !removed, sources } }) };
  },
  dropDish: async ({ recipeId, dropped }, _ctx) => {
    const r = await writeLocalList((l) => setDropped(l, recipeId, dropped));
    return { result: null, undo: changedTo(r, { action: 'drop_dish_from_list', input: { recipeId, dropped: !dropped } }) };
  },
} satisfies Runners<typeof listActions>;
