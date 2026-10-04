// delete-account — App Store 5.1.1(v). The user id comes ONLY from the
// verified access token, never from the body. Order matters and is kept from
// v1: rows first (one transaction via admin_delete_user_data — the v1
// half-deleted-account incident is why it's a single DB function), then
// storage photos, then RevenueCat, then the auth user last — the reverse
// order would strand data no one can sign in to reach. Service-role key only
// via Deno.env; never logged.
import { getUserId, json, preflight, rateLimited, serviceClient } from "../_shared/http.ts";

const PHOTO_BUCKET = "recipe-photos";

// Storage's list() pages at 100 — page until the folder is empty rather than
// deleting the first page and calling it done.
// ponytail: hard page cap as a runaway guard — 5k photos would be a different
// problem anyway.
const MAX_PHOTO_PAGES = 50;
// deno-lint-ignore no-explicit-any
async function deleteUserPhotos(admin: any, userId: string): Promise<number> {
  let removed = 0;
  for (let page = 0; page < MAX_PHOTO_PAGES; page++) {
    const { data, error } = await admin.storage.from(PHOTO_BUCKET).list(userId, { limit: 100 });
    // A storage failure must NOT fail the request: the rows are already gone
    // and the deletion genuinely succeeded. An honest short count beats a 500.
    if (error) {
      console.error("photo cleanup: list failed", error.message);
      break;
    }
    if (!data?.length) break;
    const { error: removeError } = await admin.storage
      .from(PHOTO_BUCKET)
      // deno-lint-ignore no-explicit-any
      .remove(data.map((object: any) => `${userId}/${object.name}`));
    if (removeError) {
      console.error("photo cleanup: remove failed", removeError.message);
      break;
    }
    removed += data.length;
    if (data.length < 100) break;
  }
  return removed;
}

// RevenueCat's app_user_id IS the Supabase uid (AuthProvider.tsx Purchases.logIn).
// Best-effort, like photo cleanup: the account is already gone from our side
// by this point, so a RevenueCat hiccup must not turn into a 500 — it's their
// record of a subscription, not ours.
async function deleteRevenueCatSubscriber(userId: string): Promise<boolean> {
  const key = Deno.env.get("REVENUECAT_SECRET_KEY");
  if (!key) return false; // not configured — nothing to clean up against
  try {
    const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(8000),
    });
    // 404 = RevenueCat never saw this user (no purchase attempt) — not an error.
    if (!res.ok && res.status !== 404) {
      console.error("revenuecat cleanup failed", res.status);
      return false;
    }
    return true;
  } catch (error) {
    console.error("revenuecat cleanup failed", (error as Error).message);
    return false;
  }
}

// Sign in with Apple token revocation — Apple requires apps offering SIWA to
// revoke the user's tokens when they delete their account. The app sends a
// fresh authorization code (one Apple sheet tap); we exchange it for a refresh
// token and revoke that. Best-effort like the steps above: a revocation hiccup
// must not leave the account half-deleted. Secrets (Supabase function env):
// APPLE_SIWA_KEY (.p8 contents), APPLE_SIWA_KEY_ID, APPLE_TEAM_ID, APPLE_CLIENT_ID.
const b64url = (b: ArrayBuffer | Uint8Array | string) =>
  btoa(typeof b === "string" ? b : String.fromCharCode(...new Uint8Array(b as ArrayBuffer)))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

async function appleClientSecret(): Promise<{ secret: string; clientId: string } | null> {
  const pem = Deno.env.get("APPLE_SIWA_KEY");
  const kid = Deno.env.get("APPLE_SIWA_KEY_ID");
  const team = Deno.env.get("APPLE_TEAM_ID");
  const clientId = Deno.env.get("APPLE_CLIENT_ID");
  if (!pem || !kid || !team || !clientId) return null;
  const der = Uint8Array.from(atob(pem.replace(/-----[^-]+-----|\s/g, "")), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const now = Math.floor(Date.now() / 1000);
  const input = `${b64url(JSON.stringify({ alg: "ES256", kid }))}.${b64url(
    JSON.stringify({ iss: team, iat: now, exp: now + 300, aud: "https://appleid.apple.com", sub: clientId }),
  )}`;
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(input));
  return { secret: `${input}.${b64url(sig)}`, clientId };
}

async function revokeAppleTokens(code: string): Promise<boolean> {
  try {
    const creds = await appleClientSecret();
    if (!creds) return false; // not configured
    const form = (o: Record<string, string>) => new URLSearchParams(o);
    const tokenRes = await fetch("https://appleid.apple.com/auth/token", {
      method: "POST",
      body: form({ grant_type: "authorization_code", code, client_id: creds.clientId, client_secret: creds.secret }),
      signal: AbortSignal.timeout(8000),
    });
    const tokens = await tokenRes.json();
    const token = tokens.refresh_token ?? tokens.access_token;
    if (!token) {
      console.error("apple revoke: token exchange failed", tokenRes.status, tokens.error);
      return false;
    }
    const revokeRes = await fetch("https://appleid.apple.com/auth/revoke", {
      method: "POST",
      body: form({
        client_id: creds.clientId,
        client_secret: creds.secret,
        token,
        token_type_hint: tokens.refresh_token ? "refresh_token" : "access_token",
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!revokeRes.ok) console.error("apple revoke failed", revokeRes.status);
    return revokeRes.ok;
  } catch (error) {
    console.error("apple revoke failed", (error as Error).message);
    return false;
  }
}

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== "POST" && req.method !== "DELETE") {
    return json(405, { error: "POST or DELETE only" });
  }

  const userId = await getUserId(req);
  if (!userId) return json(401, { error: "Missing or invalid access token" });
  // Irreversible and never done twice in a row — v1 destructiveLimiter tier.
  if (rateLimited(`del:${userId}`, 5, 15 * 60 * 1000)) {
    return json(429, { error: "Too many requests — give it a few minutes and try again" });
  }

  const admin = serviceClient();
  try {
    // ONE transaction for every owned row (see 20260721090009).
    const { error } = await admin.rpc("admin_delete_user_data", { p_user_id: userId });
    if (error) throw new Error(error.message);

    // Photos live in Storage, not Postgres — and the bucket is public, so
    // anything left behind stays fetchable by direct URL. Same 5.1.1(v)
    // reason the auth user goes.
    const photosDeleted = await deleteUserPhotos(admin, userId);

    // RevenueCat holds its own subscriber record (purchase/entitlement
    // history) keyed on this same uid — clear it before the auth user goes,
    // same reasoning as photos: after deleteUser, nothing can re-derive the id.
    const revenueCatDeleted = await deleteRevenueCatSubscriber(userId);

    // Apple account? Revoke its Sign in with Apple tokens (code from the app).
    let appleRevoked: boolean | null = null;
    const body = await req.json().catch(() => ({}));
    if (typeof body?.appleAuthorizationCode === "string" && body.appleAuthorizationCode) {
      appleRevoked = await revokeAppleTokens(body.appleAuthorizationCode);
    }

    // Only once the data is safely gone do we drop the login.
    const { error: authError } = await admin.auth.admin.deleteUser(userId);

    return json(200, { dataDeleted: true, authUserDeleted: !authError, photosDeleted, revenueCatDeleted, appleRevoked });
  } catch (error) {
    console.error("delete account failed", (error as Error).message);
    return json(500, { error: "Something went wrong" });
  }
});
