// Server-side Otto Club check — pure rules, no I/O, so node --test can pin
// them (membership.test.mjs). http.ts wires these to the database and the
// RevenueCat REST API.
//
// Why this exists (audit 2026-10-04): the paywall is enforced on the phone, but
// every signed-in account could still call the paid AI functions directly with
// its own token. With the hard paywall (1.0.20) the server has to agree with the
// app, or the gate is decoration. The switch is an env var because 1.0.19 (build
// 41, in review) has a free tier that calls these functions without a
// membership: REQUIRE_CLUB stays unset until 1.0.20 is live.

export type MembershipRow = { expires_at: string | null | undefined } | null | undefined;

/** `REQUIRE_CLUB=on` turns the gate on; anything else leaves it off. */
export function clubRequired(env: string | undefined): boolean {
  return (env ?? "").trim().toLowerCase() === "on";
}

/** A mirrored row counts while its expiry is in the future. SANDBOX rows count
 *  too: Apple's reviewer buys in the sandbox and must get in. */
export function isActiveMembership(row: MembershipRow, now: Date = new Date()): boolean {
  const raw = row?.expires_at;
  if (!raw) return false;
  const expires = Date.parse(raw);
  return Number.isFinite(expires) && expires > now.getTime();
}

/** RevenueCat GET /v1/subscribers/{id} → the `club` entitlement's expiry, or
 *  null when the subscriber has none. Lifetime/promotional grants carry no
 *  expires_date; mirror them far-future like the webhook does. */
export function entitlementExpiry(subscriber: unknown, entitlement = "club"): string | null {
  const ent = (subscriber as { entitlements?: Record<string, { expires_date?: string | null }> } | null)
    ?.entitlements?.[entitlement];
  if (!ent) return null;
  return ent.expires_date ?? "9999-12-31T00:00:00Z";
}
