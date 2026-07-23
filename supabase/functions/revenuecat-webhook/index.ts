// revenuecat-webhook — RevenueCat fires this on every subscription event
// (purchase, renewal, cancellation, expiration, billing issue...). Standalone
// on purpose: no CORS, no user JWT (deployed with verify_jwt off) — auth is
// the shared secret RevenueCat sends in its Authorization header.
//
// We deliberately do NOT derive membership state from the event payload:
// webhook delivery order isn't guaranteed, and replaying stale events would
// regress expires_at. Instead every event triggers a fetch of the subscriber's
// CURRENT entitlement from the RevenueCat API and mirrors that. Idempotent by
// construction.
//
// Secrets (edge function env): RC_WEBHOOK_SECRET (same value configured as the
// webhook's Authorization header in RevenueCat), REVENUECAT_SECRET_KEY (sk_).
import { createClient } from "jsr:@supabase/supabase-js@2";

const ENTITLEMENT = "club";
// RevenueCat app_user_id is our Supabase auth uid. Anonymous SDK ids
// ($RCAnonymousID:...) can't map to an account row — acknowledge and skip.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const json = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method !== "POST") return json(405, { error: "POST only" });

  const secret = Deno.env.get("RC_WEBHOOK_SECRET");
  const auth = req.headers.get("authorization") ?? "";
  // Missing secret fails closed. RevenueCat sends the header value verbatim.
  if (!secret || (auth !== secret && auth !== `Bearer ${secret}`)) {
    return json(401, { error: "unauthorized" });
  }

  const body = await req.json().catch(() => null);
  const appUserId: unknown = body?.event?.app_user_id;
  if (typeof appUserId !== "string" || !UUID.test(appUserId)) {
    return json(200, { ignored: "no supabase user id" });
  }

  const rcRes = await fetch(
    `https://api.revenuecat.com/v1/subscribers/${appUserId}`,
    { headers: { Authorization: `Bearer ${Deno.env.get("REVENUECAT_SECRET_KEY")}` } },
  );
  // Non-2xx → 502 so RevenueCat retries the webhook later.
  if (!rcRes.ok) {
    console.error("revenuecat fetch failed", rcRes.status);
    return json(502, { error: "revenuecat fetch failed" });
  }
  const { subscriber } = await rcRes.json();
  const ent = subscriber?.entitlements?.[ENTITLEMENT];

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  // Lifetime/promotional grants can have no expires_date — mirror them as
  // far-future instead of dropping the row.
  const expiresAt = ent ? (ent.expires_date ?? "9999-12-31T00:00:00Z") : null;

  if (!expiresAt) {
    // No entitlement at all (refund, transfer away) — remove the row; an
    // expired-but-present row is kept by the upsert branch for history.
    const { error } = await admin.from("memberships").delete().eq("user_id", appUserId);
    if (error) return json(502, { error: "db delete failed" });
    return json(200, { member: false });
  }

  const { error } = await admin.from("memberships").upsert({
    user_id: appUserId,
    expires_at: expiresAt,
    product_id: ent.product_identifier ?? null,
    store: body?.event?.store ?? null,
    environment: body?.event?.environment ?? null,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    console.error("membership upsert failed", error.message);
    return json(502, { error: "db upsert failed" });
  }
  return json(200, { member: true, expires_at: expiresAt });
});
