// Last 5 submitted Discover searches (gap audit P1-9), newest first, device-local.
// ponytail: raw AsyncStorage under kv's namespace because StoreKey (storage.ts)
// has no 'recentSearches' yet; move to kv.get/set once that key is added.
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'otto.v2.recentSearches';
const MAX = 5;

export function addRecent(list: string[], query: string): string[] {
  const q = query.trim();
  if (!q) return list;
  return [q, ...list.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, MAX);
}

export async function loadRecent(): Promise<string[]> {
  try {
    const parsed = JSON.parse((await AsyncStorage.getItem(KEY)) ?? '[]') as unknown;
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string').slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function saveRecent(list: string[]): void {
  AsyncStorage.setItem(KEY, JSON.stringify(list)).catch(() => {});
}
