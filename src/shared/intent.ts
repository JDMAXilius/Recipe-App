// Where someone was going (R0.2). A link that opens a members-only screen
// while signed out or not yet a member is remembered, and the launch opens it
// once the person is through sign-in and the paywall. Pure: node --test loads it.

export const INTENT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export interface Intent {
  href: string;
  at: number;
}

// Doors, not destinations: never remembered.
const NOT_A_DESTINATION = /^\/(?:$|\(auth\)|sign-in|sign-up|forgot-password|reset-password|auth\/|onboarding|welcome|about|first-week|otto-club|club\/|index)/;

/** The in-app path of a link (otto://recipe/52772, https://ottosapp.com/r/x),
 *  or null when it isn't one worth remembering. */
export function intentPath(url: string | null | undefined): string | null {
  if (!url) return null;
  let path: string;
  try {
    const u = new URL(url);
    // custom scheme: otto://recipe/1 → host "recipe", path "/1"
    path = u.protocol === 'http:' || u.protocol === 'https:' ? u.pathname : `/${u.host}${u.pathname}`;
    path += u.search;
  } catch {
    path = url.startsWith('/') ? url : `/${url}`;
  }
  path = path.replace(/\/+$/, '') || '/';
  return NOT_A_DESTINATION.test(path) ? null : path;
}

export function remember(url: string | null | undefined, now: number): Intent | null {
  const href = intentPath(url);
  return href ? { href, at: now } : null;
}

/** A stored intent still worth opening: well formed, under 24 hours old. */
export function stillWanted(raw: unknown, now: number): string | null {
  if (!raw || typeof raw !== 'object') return null;
  const { href, at } = raw as Partial<Intent>;
  if (typeof href !== 'string' || typeof at !== 'number') return null;
  if (now - at > INTENT_MAX_AGE_MS || now < at) return null;
  return intentPath(href);
}
