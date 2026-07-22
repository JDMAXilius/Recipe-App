// Typed AsyncStorage keyspace (contract: persistence.md). Replaces v1's ~9
// ad-hoc `otto.*.v1` strings with one namespaced, versioned, zod-validated API.
// Features never import AsyncStorage directly — only `kv`. Server-owned data
// stays in TanStack Query; this is for genuinely device-local, non-server state.
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ZodType } from 'zod';

export type StoreKey =
  | 'onboarded'
  | 'unitSystem'
  | 'prefs'
  | 'notifPrefs'
  | 'firstSaveCelebrated'
  | 'shoppingState'
  | 'household'
  | 'householdRecent'
  | 'journal'
  | 'chats'
  | 'cookRatings';

// One namespace + version. Bump the version suffix to invalidate a shape.
const NS = 'otto.v2';
const full = (key: StoreKey) => `${NS}.${key}`;

// get() takes an optional zod schema — a corrupt/legacy blob falls back to
// `fallback` (validate-before-trust), never throws. Writes are best-effort.
export const kv = {
  async get<T>(key: StoreKey, fallback: T, schema?: ZodType<T>): Promise<T> {
    try {
      const raw = await AsyncStorage.getItem(full(key));
      if (raw == null) return fallback;
      const parsed = JSON.parse(raw) as unknown;
      if (schema) {
        const result = schema.safeParse(parsed);
        return result.success ? result.data : fallback;
      }
      return parsed as T;
    } catch {
      return fallback;
    }
  },
  async set<T>(key: StoreKey, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(full(key), JSON.stringify(value));
    } catch {
      // best-effort — a failed persist never blocks the UI
    }
  },
  async remove(key: StoreKey): Promise<void> {
    try {
      await AsyncStorage.removeItem(full(key));
    } catch {
      /* ignore */
    }
  },
};
