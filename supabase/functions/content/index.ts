// content — TheMealDB passthrough. Exists ONLY to keep the supporter key out
// of the app bundle (an IPA is unzippable; env here is not). Same dumb shape
// as v1 /api/content/:endpoint: endpoint allowlist, param allowlist, response
// forwarded verbatim, TTL cache with stale-on-error.
// No user auth — Discover works before signup (the anon-key JWT satisfies the
// platform's verify_jwt). Supabase's built-in per-IP limits guard the key.
import { z } from "npm:zod@4";
import { corsHeaders, json, preflight } from "../_shared/http.ts";

// v2 (supporter) API ONLY — no free-tier fallback. THEMEALDB_KEY MUST be set as
// a Supabase secret; the value never lives in this repo (it's a supporter key,
// kept server-side, never the app bundle). Without it, content refuses (503)
// rather than silently serving the limited free "1"/v1 catalog.
const MEALDB_KEY = Deno.env.get("THEMEALDB_KEY");
const BASE_URL = MEALDB_KEY ? `https://www.themealdb.com/api/json/v2/${MEALDB_KEY}` : null;

const querySchema = z.object({
  endpoint: z.enum(["search.php", "lookup.php", "random.php", "categories.php", "filter.php", "list.php"]),
  // TheMealDB's whole query vocabulary; anything else is dropped, not forwarded.
  s: z.string().max(200).optional(),
  i: z.string().max(200).optional(),
  a: z.string().max(200).optional(),
  c: z.string().max(200).optional(),
  f: z.string().max(200).optional(),
});

// random.php deliberately absent — same URL, different meal each call.
const TTL_MS: Record<string, number> = {
  "lookup.php": 24 * 60 * 60 * 1000,
  "categories.php": 24 * 60 * 60 * 1000,
  "list.php": 24 * 60 * 60 * 1000,
  "search.php": 60 * 60 * 1000,
  "filter.php": 60 * 60 * 1000,
};
const CACHE_MAX = 500;
// ponytail: isolate-local LRU, resets on cold start — fine for a static-ish
// upstream; move behind a CDN cache if TheMealDB quota ever hurts.
const cache = new Map<string, { freshUntil: number; body: unknown }>();

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== "GET") return json(405, { error: "GET only" });
  // No supporter key → refuse, don't degrade to the free catalog.
  if (!BASE_URL) return json(503, { error: "The recipe library isn't configured yet." });

  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    endpoint: url.pathname.split("/").filter(Boolean).pop(),
    ...Object.fromEntries(url.searchParams),
  });
  if (!parsed.success) return json(404, { error: "Unknown content endpoint" });
  const { endpoint, ...params } = parsed.data;

  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (typeof v === "string") query.set(k, v);
  const ttl = TTL_MS[endpoint];
  const key = `${endpoint}?${query}`;
  const cached = ttl ? cache.get(key) : undefined;
  if (cached && cached.freshUntil > Date.now()) {
    cache.delete(key);
    cache.set(key, cached); // re-insert = mark recently used
    return json(200, cached.body);
  }

  try {
    const upstream = await fetch(`${BASE_URL}/${endpoint}?${query}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!upstream.ok) throw new Error(`TheMealDB answered ${upstream.status}`);
    const body = await upstream.json();
    if (ttl) {
      cache.delete(key);
      cache.set(key, { freshUntil: Date.now() + ttl, body });
      while (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value!);
    }
    return json(200, body);
  } catch (error) {
    // Stale beats a spinner: yesterday's truth about a near-static catalogue.
    if (cached) return json(200, cached.body);
    console.error("content passthrough failed", endpoint, (error as Error).message);
    return new Response(JSON.stringify({ error: "Couldn't reach the recipe library" }), {
      status: 502,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
});
