// The personal shopping list's own state (no shared kitchen): ticks, the
// user's extras, dishes dropped from the list and single rows taken off it.
// The rows themselves always rebuild from the plan (shoppingList.ts); this is
// only what the shopper changed. Pure: the kv store and the action runners are
// in shopping.store.ts; `node --test` loads this file.
import { z } from 'zod';
import { normalizeRemoved, sameSources, type RemovedEntry } from './shoppingList';

export interface LocalList {
  checked: Record<string, boolean>;
  custom: { key: string; name: string }[];
  excluded: string[]; // recipe ids dropped from the list (chip ×)
  removed: RemovedEntry[];
}

export const EMPTY_LOCAL: LocalList = { checked: {}, custom: [], excluded: [], removed: [] };

// Bump when the MEANING of a removal's `sources` changes. 2 = recipe ids.
export const REMOVED_IDENTITY_V = 2;

// The kv blob, validated before trust (storage.ts rule): a corrupt or
// hand-edited value degrades per FIELD (catch), never throws. `removed` stays
// unknown here; normalizeRemoved is its guard.
export const storedSchema = z
  .object({
    checked: z.record(z.string(), z.boolean()).catch({}),
    custom: z.array(z.object({ key: z.string(), name: z.string() })).catch([]),
    excluded: z.array(z.string()).catch([]),
    removed: z.unknown().optional(),
    // v1 (or absent) = sources were dish TITLES (builds 33/34). Those can never
    // match id-keyed rows again, so they are dropped on read: the shopper sees
    // their rows back, not data lost.
    removedV: z.number().optional(),
    // R0.11: when this copy was saved (ms), to pick the newer of the phone's
    // and the account's copies. Absent = from before the account kept one.
    savedAt: z.number().optional(),
  })
  .catch({ checked: {}, custom: [], excluded: [], removed: [], removedV: REMOVED_IDENTITY_V });
export type StoredList = z.infer<typeof storedSchema>;
export const EMPTY_STORED: StoredList = { ...EMPTY_LOCAL, removedV: REMOVED_IDENTITY_V };

export function fromStored(s: StoredList): LocalList {
  return {
    checked: s.checked,
    custom: s.custom,
    excluded: s.excluded,
    removed: s.removedV === REMOVED_IDENTITY_V ? normalizeRemoved(s.removed) : [],
  };
}

export const toStored = (l: LocalList): StoredList => ({ ...l, removedV: REMOVED_IDENTITY_V });

export const newCustomKey = () => `custom-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

// --- edits ---------------------------------------------------------------
// Each returns the SAME object when nothing changes, so the store can skip
// the write and the action can say there is nothing to undo.

export function tick(l: LocalList, key: string, on: boolean): LocalList {
  if (!!l.checked[key] === on) return l;
  const checked = { ...l.checked };
  if (on) checked[key] = true;
  else delete checked[key];
  return { ...l, checked };
}

export function untick(l: LocalList, keys: readonly string[]): LocalList {
  return keys.reduce((acc, k) => tick(acc, k, false), l);
}

// A re-added extra comes back unticked (a restored row still marked "got it" is a lie).
export function addCustom(l: LocalList, key: string, name: string): LocalList {
  if (l.custom.some((c) => c.key === key)) return l;
  return untick({ ...l, custom: [...l.custom, { key, name }] }, [key]);
}

export function removeCustom(l: LocalList, key: string): LocalList {
  return l.custom.some((c) => c.key === key) ? { ...l, custom: l.custom.filter((c) => c.key !== key) } : l;
}

export function hide(l: LocalList, entries: readonly RemovedEntry[]): LocalList {
  const add = entries.filter((e) => !l.removed.some((r) => r.key === e.key && sameSources(r.sources, e.sources)));
  return add.length ? { ...l, removed: [...l.removed, ...add] } : l;
}

export function unhide(l: LocalList, entries: readonly Pick<RemovedEntry, 'key' | 'sources'>[]): LocalList {
  const removed = l.removed.filter((r) => !entries.some((e) => e.key === r.key && sameSources(e.sources, r.sources)));
  return removed.length === l.removed.length ? l : { ...l, removed };
}

export function setDropped(l: LocalList, recipeId: string, dropped: boolean): LocalList {
  if (l.excluded.includes(recipeId) === dropped) return l;
  return { ...l, excluded: dropped ? [...l.excluded, recipeId] : l.excluded.filter((id) => id !== recipeId) };
}

/** R0.11: which copy wins when the phone and the account disagree. The newer
 *  save wins; a phone copy with no time (from before the account kept one)
 *  loses to any account copy, and an equal time means nothing to do. */
export function newerCopy(localSavedAt: number | undefined, remoteSavedAt: number | null): 'local' | 'remote' | 'same' {
  if (remoteSavedAt == null) return localSavedAt == null ? 'same' : 'local';
  if (localSavedAt == null || remoteSavedAt > localSavedAt) return 'remote';
  return remoteSavedAt === localSavedAt ? 'same' : 'local';
}

// --- store mechanics (pure, so the tests can drive them) -------------------

type Edit = (l: LocalList) => LocalList;

// Every read and write goes through one queue: a read never sees half a write
// and two writes never interleave.
/** pull (R0.11): runs before a READ, in the same queue — the account copy is
 *  checked when the list is opened, never inside a write. */
export function serialStore(load: () => Promise<LocalList>, save: (l: LocalList) => Promise<void>, pull?: () => Promise<void>) {
  let queue: Promise<unknown> = Promise.resolve();
  const serial = <T>(job: () => Promise<T>): Promise<T> => {
    const run = queue.then(job, job);
    queue = run.catch(() => undefined);
    return run;
  };
  return {
    read: () => serial(async () => {
      if (pull) await pull().catch(() => undefined);
      return load();
    }),
    /** Apply an edit to the stored list; returns the list before and after. */
    write: (edit: Edit) =>
      serial(async () => {
        const before = await load();
        const after = edit(before);
        if (after !== before) await save(after);
        return { before, after };
      }),
  };
}

// Optimistic edits: the cache moves now, storage follows in order, and when
// the last queued write lands the cache takes storage's result (which also
// carries anything Otto wrote meanwhile). Edits must be deterministic.
export function optimisticUpdate(
  cache: { get: () => LocalList | undefined; set: (l: LocalList) => void },
  write: (edit: Edit) => Promise<{ after: LocalList }>,
) {
  let pending = 0;
  return (edit: Edit): Promise<void> => {
    const prev = cache.get();
    if (prev) {
      const next = edit(prev);
      if (next === prev) return Promise.resolve();
      cache.set(next);
    }
    pending++;
    return write(edit)
      .then(({ after }) => {
        if (pending === 1) cache.set(after);
      })
      .finally(() => {
        pending--;
      });
  };
}
