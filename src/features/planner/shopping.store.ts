// The personal shopping list's store: kv is the truth, TanStack Query holds
// it for the screen (key ['shopping-local']). Every read and write is queued,
// so a read never sees half a write and two writes never interleave. Because
// the state lives in the app-level query cache, a toast's Undo works after
// the screen is gone.
//
// An edit runs twice (on the cache now, on kv's copy in the queue), so it
// must be DETERMINISTIC: work out keys, times and on/off targets before
// calling update, never inside the edit (a key made inside it differed
// between the two copies and the item's tick and delete were lost).
import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { kv } from '@/shared/storage';
import { getListRecipes, listPlan } from './plan.queries';
import { buildShoppingList, sameSources } from './shoppingList';
import { weekDays } from '@/shared/week';
import type { Runners } from '@/shared/actions/action';
import type { listActions } from './shopping.actions';
import { flags } from '@/shared/flags';
import { supabase } from '@/shared/supabase/client';
import type { Json } from '@/types/database';
import {
  EMPTY_LOCAL,
  EMPTY_STORED,
  newerCopy,
  addCustom,
  fromStored,
  optimisticUpdate,
  serialStore,
  hide,
  newCustomKey,
  removeCustom,
  setDropped,
  storedSchema,
  tick,
  toStored,
  unhide,
  type LocalList,
  type StoredList,
} from './shopping.local';

export const LOCAL_LIST_KEY = ['shopping-local'] as const;

// R0.11 (flowV2): the account keeps a copy (shopping_lists), so a new phone
// gets the list and Otto (1.2) can change it on the server. kv stays the
// phone's truth and works offline; a save mirrors up, and opening the list
// takes whichever copy is newer.
async function signedInId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

async function pushRemote(state: StoredList & { savedAt: number }): Promise<void> {
  const uid = await signedInId();
  if (!uid) return;
  await supabase
    .from('shopping_lists')
    .upsert({ user_id: uid, state: state as unknown as Json, saved_at: new Date(state.savedAt).toISOString() }, { onConflict: 'user_id' });
}

async function pullRemote(late: { current: boolean }): Promise<void> {
  if (!flags.flowV2) return;
  const uid = await signedInId();
  if (!uid) return;
  const local = await kv.get('shoppingState', EMPTY_STORED, storedSchema);
  const { data, error } = await supabase.from('shopping_lists').select('state, saved_at').eq('user_id', uid).maybeSingle();
  if (error || late.current) return; // offline, refused or too late: the phone's copy stands
  const remoteAt = data ? Date.parse(data.saved_at) : null;
  const pick = newerCopy(local.savedAt, Number.isFinite(remoteAt) ? remoteAt : null);
  if (pick === 'remote' && data) {
    await kv.set('shoppingState', { ...storedSchema.parse(data.state), savedAt: remoteAt! });
  } else if (pick === 'local' && local.savedAt != null) {
    const up = { ...local, savedAt: local.savedAt };
    pushes = pushes.then(() => pushRemote(up)).catch(() => undefined);
  }
}

// Pushes go up one at a time, in save order, so an older save can't land last.
let pushes: Promise<unknown> = Promise.resolve();
const PULL_MS = 3000; // a slow network never holds the list back

const store = serialStore(
  async () => fromStored(await kv.get('shoppingState', EMPTY_STORED, storedSchema)),
  async (l) => {
    const stored = { ...toStored(l), savedAt: Date.now() };
    await kv.set('shoppingState', flags.flowV2 ? stored : toStored(l));
    if (flags.flowV2) pushes = pushes.then(() => pushRemote(stored)).catch(() => undefined);
  },
  () => {
    // A pull that runs past PULL_MS writes nothing: the queue has moved on.
    const late = { current: false };
    return Promise.race([
      pullRemote(late),
      new Promise<void>((resolve) =>
        setTimeout(() => {
          late.current = true;
          resolve();
        }, PULL_MS),
      ),
    ]);
  },
);

export const readLocalList = store.read;
export const writeLocalList = store.write;

export function useLocalList() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: LOCAL_LIST_KEY, queryFn: readLocalList, staleTime: 0, networkMode: 'always' }); // a phone read: runs offline
  const update = useMemo(
    () =>
      optimisticUpdate(
        { get: () => qc.getQueryData<LocalList>(LOCAL_LIST_KEY), set: (l) => qc.setQueryData(LOCAL_LIST_KEY, l) },
        writeLocalList,
      ),
    [qc],
  );
  // Hydrated = read from kv on THIS visit, not a cached copy from before: the
  // rows, the prunes and the all-done chime must judge today's list.
  return { list: query.data ?? EMPTY_LOCAL, hydrated: query.isSuccess && query.isFetchedAfterMount, update };
}

// --- actions (R0.9) --------------------------------------------------------
// The screen edits through useLocalList; Otto through these, then refreshes
// ['shopping-local'] (the spec's touches). Each one checks against the list
// as it is now and refuses a call that would change nothing, so Otto never
// reports a tick, hide or drop that didn't happen. The catalogue keeps them
// away from people in a shared kitchen (their list is household's).
const NOT_ON_LIST = "That isn't on the shopping list.";

async function currentList(userId: string) {
  const days = weekDays();
  const [entries, local] = await Promise.all([listPlan(userId, days[0].key, days[6].key), readLocalList()]);
  const weekIds = [...new Set(entries.map((e) => e.recipe_id).filter((id): id is string => !!id))];
  const active = weekIds.filter((id) => !local.excluded.includes(id));
  const items = active.length ? buildShoppingList(await getListRecipes(active)) : [];
  return { weekIds, items, local };
}

const nothingChanged = (r: { before: LocalList; after: LocalList }, why: string) => {
  if (r.after === r.before) throw new Error(why);
};

export const listRun = {
  tick: async ({ itemKey, checked }, ctx) => {
    const { items, local } = await currentList(ctx.userId);
    if (!items.some((i) => i.key === itemKey) && !local.custom.some((c) => c.key === itemKey)) throw new Error(NOT_ON_LIST);
    const r = await writeLocalList((l) => tick(l, itemKey, checked));
    nothingChanged(r, checked ? "It's already ticked." : "It isn't ticked.");
    return { result: null, undo: { action: 'tick_my_list_item', input: { itemKey, checked: !checked } } };
  },
  addItem: async ({ name }, _ctx) => {
    const key = newCustomKey();
    await writeLocalList((l) => addCustom(l, key, name));
    return { result: key, undo: { action: 'remove_from_my_list', input: { itemKey: key } } };
  },
  removeItem: async ({ itemKey }, _ctx) => {
    const r = await writeLocalList((l) => removeCustom(l, itemKey));
    const name = r.before.custom.find((c) => c.key === itemKey)?.name;
    if (!name) throw new Error(NOT_ON_LIST);
    return { result: null, undo: { action: 'add_to_my_list', input: { name } } };
  },
  // Hiding uses the row's own recipes, so the hide matches what the screen shows.
  hideItem: async ({ itemKey, removed, sources }, ctx) => {
    if (removed) {
      const { items } = await currentList(ctx.userId);
      const item = items.find((i) => i.key === itemKey && sameSources(i.sources, sources)) ?? items.find((i) => i.key === itemKey);
      if (!item) throw new Error(NOT_ON_LIST);
      const entry = { key: itemKey, sources: item.sources };
      const r = await writeLocalList((l) => hide(l, [{ ...entry, at: Date.now() }]));
      nothingChanged(r, "It's already off the list.");
      return { result: null, undo: { action: 'hide_my_list_item', input: { itemKey, removed: false, sources: item.sources } } };
    }
    const r = await writeLocalList((l) => unhide(l, [{ key: itemKey, sources }]));
    nothingChanged(r, "That item isn't hidden.");
    return { result: null, undo: { action: 'hide_my_list_item', input: { itemKey, removed: true, sources } } };
  },
  dropDish: async ({ recipeId, dropped }, ctx) => {
    if (dropped && !(await currentList(ctx.userId)).weekIds.includes(recipeId)) throw new Error("That dish isn't on this week's plan.");
    const r = await writeLocalList((l) => setDropped(l, recipeId, dropped));
    nothingChanged(r, dropped ? "That dish is already left off the list." : "That dish isn't left off the list.");
    return { result: null, undo: { action: 'drop_dish_from_list', input: { recipeId, dropped: !dropped } } };
  },
} satisfies Runners<typeof listActions>;
