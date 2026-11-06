// Last 5 submitted searches (gap audit P1-9), newest first, device-local.
// kv key 'recentSearches' (same stored name as before, so nothing is lost);
// personal, so sign-out removes it (forget.ts).
import { kv } from './storage';

const MAX = 5;

export function addRecent(list: string[], query: string): string[] {
  const q = query.trim();
  if (!q) return list;
  return [q, ...list.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, MAX);
}

export async function loadRecent(): Promise<string[]> {
  const parsed = await kv.get<unknown>('recentSearches', []);
  return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string').slice(0, MAX) : [];
}

export function saveRecent(list: string[]): void {
  void kv.set('recentSearches', list);
}
