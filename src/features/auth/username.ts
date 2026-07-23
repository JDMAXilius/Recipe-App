// Who you are in Otto, in one place (ported from mobile/lib/username.js).
//
// The name lives in Supabase Auth's user_metadata — no table, no migration:
// it travels with the session the app already holds. Sign in with Apple hands
// us addresses like `zrz2p6fhgc@privaterelay.appleid.com`, so an email is a
// poor way to tell someone who they are; a name they chose is a good one.
//
// Everything here is pure and supabase-free, so the name rules unit-test via
// node's type stripping without pulling in the RN client. saveUsername lives in
// auth.queries.ts (the only place that touches supabase).

export const MAX_USERNAME = 24;

// Minimal shape shared with @supabase/supabase-js User — structural, so the
// real User satisfies it without this module importing supabase types.
export interface NamedUser {
  email?: string | null;
  user_metadata?: { username?: string | null } | null;
}

// Last-resort name derived from the email's local part. Private-relay addresses
// derive to gibberish, so an unset name falls back to "Chef" (the warm default)
// rather than to nonsense — see displayNameFor.
export const nameFromEmail = (email: string | null | undefined): string => {
  const raw = String(email || '').split('@')[0].split(/[._-]/)[0];
  return raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : '';
};

// Apple's relay local-part is a random token — deriving a "name" from it just
// produces a different unreadable string, so treat it as no name at all.
const isRelayEmail = (email: string | null | undefined): boolean =>
  /@privaterelay\.appleid\.com$/i.test(String(email || ''));

// What to actually render. Never returns empty: the UI always has something.
export function displayNameFor(user: NamedUser | null | undefined, fallback = 'Chef'): string {
  const stored = String(user?.user_metadata?.username || '').trim();
  if (stored) return stored;
  if (isRelayEmail(user?.email)) return fallback;
  return nameFromEmail(user?.email) || fallback;
}

// True when the user has actually chosen a name (vs. us guessing one).
export const hasUsername = (user: NamedUser | null | undefined): boolean =>
  Boolean(String(user?.user_metadata?.username || '').trim());

// Trim, collapse inner whitespace, cap length. Returns "" for nothing usable —
// callers treat that as "clear the name", not as a valid value.
export const cleanUsername = (value: string | null | undefined): string =>
  String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, MAX_USERNAME);
