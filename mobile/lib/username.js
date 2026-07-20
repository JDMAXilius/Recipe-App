// Who you are in Otto, in one place.
//
// The name lives in Supabase Auth's user_metadata — no table, no migration, no
// backend route: it travels with the session the app already holds. Sign in
// with Apple hands us addresses like `zrz2p6fhgc@privaterelay.appleid.com`, so
// an email is a poor way to tell someone who they are; a name they chose is a
// good one.
//
// Everything above saveUsername is pure, and supabase is imported lazily inside
// it, so the name rules can be unit-tested without pulling in the RN client.

export const MAX_USERNAME = 24;

// Last-resort name derived from the email's local part. Private-relay
// addresses derive to gibberish, so an unset name falls back to "Chef" (the
// app's warm default) rather than to nonsense — see displayNameFor.
export const nameFromEmail = (email) => {
  const raw = String(email || "").split("@")[0].split(/[._-]/)[0];
  return raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : "";
};

// Apple's relay local-part is a random token — deriving a "name" from it just
// produces a different unreadable string, so treat it as no name at all.
const isRelayEmail = (email) => /@privaterelay\.appleid\.com$/i.test(String(email || ""));

// What to actually render. Never returns empty: the UI always has something.
export function displayNameFor(user, fallback = "Chef") {
  const stored = String(user?.user_metadata?.username || "").trim();
  if (stored) return stored;
  if (isRelayEmail(user?.email)) return fallback;
  return nameFromEmail(user?.email) || fallback;
}

// True when the user has actually chosen a name (vs. us guessing one).
export const hasUsername = (user) =>
  Boolean(String(user?.user_metadata?.username || "").trim());

// Trim, collapse inner whitespace, cap length. Returns "" for nothing usable —
// callers treat that as "clear the name", not as a valid value.
export const cleanUsername = (value) =>
  String(value ?? "").trim().replace(/\s+/g, " ").slice(0, MAX_USERNAME);

// Persist to user_metadata. Returns the saved name so the caller can render it
// without waiting for the auth listener to fire. Throws on failure — the
// screen decides what to say.
export async function saveUsername(value) {
  const username = cleanUsername(value);
  const { supabase } = await import("./supabase");
  const { data, error } = await supabase.auth.updateUser({ data: { username } });
  if (error) throw error;
  return data?.user?.user_metadata?.username ?? username;
}
