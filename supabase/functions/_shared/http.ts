// Shared plumbing for the 5 edge functions (FRAMEWORK §5).
// Service-role key comes ONLY from Deno.env and is never logged or echoed.
import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { clubRequired, entitlementExpiry, isActiveMembership } from "./membership.ts";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // bearer-token API, no cookies — CORS is not the boundary
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
};

export const json = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });

export const preflight = (req: Request): Response | null =>
  req.method === "OPTIONS" ? new Response("ok", { headers: corsHeaders }) : null;

// Verifies the Supabase access token and derives the user id from it —
// never trust a client-supplied user id.
export async function getUserId(req: Request): Promise<string | null> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  const anon = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );
  const { data, error } = await anon.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user.id;
}

export const serviceClient = (): SupabaseClient =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

// Otto Club on the server (audit 2026-10-04). The paid AI functions call this
// after getUserId. Off (REQUIRE_CLUB unset) → null, nothing changes. On → a
// 402 Response for a non-member, null for a member.
//
// Source of truth order: the `memberships` mirror the webhook keeps (one indexed
// read), then RevenueCat's REST API for a user with no row yet — the webhook can
// lag a fresh purchase by seconds, and a promotional grant (the demo account)
// may never have fired one. A confirmed REST answer is written back so the next
// call is a plain read. RevenueCat unreachable with no row → 503, not a free
// pass: this gate exists to bound spend.
export const CLUB_REQUIRED_MESSAGE = "This needs Otto Club. Start your free week in Account.";

export async function requireClub(userId: string): Promise<Response | null> {
  if (!clubRequired(Deno.env.get("REQUIRE_CLUB"))) return null;
  const admin = serviceClient();
  const { data: row } = await admin
    .from("memberships")
    .select("expires_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (isActiveMembership(row)) return null;
  // An expired row is a real answer: no fallback, no spend.
  if (row) return json(402, { error: CLUB_REQUIRED_MESSAGE });

  const key = Deno.env.get("REVENUECAT_SECRET_KEY");
  if (!key) return json(503, { error: "Otto Club can't be checked right now. Try again in a moment." });
  try {
    const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${userId}`, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) throw new Error(`revenuecat ${res.status}`);
    const { subscriber } = await res.json();
    const expiresAt = entitlementExpiry(subscriber);
    if (expiresAt) {
      // Mirror it like the webhook would; a failure here only costs the next
      // call one more REST lookup.
      await admin.from("memberships").upsert({
        user_id: userId,
        expires_at: expiresAt,
        product_id: subscriber?.entitlements?.club?.product_identifier ?? null,
        store: null,
        environment: null,
        updated_at: new Date().toISOString(),
      });
    }
    return isActiveMembership({ expires_at: expiresAt }) ? null : json(402, { error: CLUB_REQUIRED_MESSAGE });
  } catch (error) {
    console.error("club check failed", (error as Error).message);
    return json(503, { error: "Otto Club can't be checked right now. Try again in a moment." });
  }
}

// Per-user sliding-window rate limit for the costly (AI/destructive) paths.
// ponytail: isolate-local Map — resets on cold start and doesn't share across
// isolates; upgrade to a Postgres/Redis counter if abuse ever outruns it.
const buckets = new Map<string, number[]>();
export function rateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return true;
  }
  hits.push(now);
  buckets.set(key, hits);
  return false;
}
