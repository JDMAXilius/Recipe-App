// Restore the last tab on relaunch (R3.5). Pure; `node --test` loads it.
// Only the four main tabs come back; Otto (a chat) and anything pushed on top
// do not, and a first run opens on Home.
export const RESTORABLE_TABS = ['index', 'plan', 'cookbook', 'profile'] as const;
export type RestorableTab = (typeof RESTORABLE_TABS)[number];

const PATHS: Record<string, RestorableTab> = { '/': 'index', '/plan': 'plan', '/cookbook': 'cookbook', '/profile': 'profile' };

/** The tab a pathname shows, or null when it is not one of the four. */
export function tabForPath(pathname: string): RestorableTab | null {
  return PATHS[pathname] ?? null;
}

export function isRestorableTab(v: unknown): v is RestorableTab {
  return typeof v === 'string' && (RESTORABLE_TABS as readonly string[]).includes(v);
}

/** Where to go once on a cold launch: only from Home, and only to another
 *  remembered tab. A deep link (anything but Home on screen) wins. */
export function restoreTarget(pathname: string, saved: unknown): string | null {
  if (pathname !== '/' || !isRestorableTab(saved) || saved === 'index') return null;
  return `/${saved}`;
}
