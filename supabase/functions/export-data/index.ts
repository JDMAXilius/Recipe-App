// export-data (R7.4, privacy): "Download my data". Returns the caller's own
// rows as one JSON document. It reads with the caller's token, so RLS decides
// what's included (their rows, nothing else); no service role. Product
// events are write-only by design (no client read), so they aren't listed.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getUserId, json, preflight, rateLimitedDurable } from "../_shared/http.ts";

const TABLES = ["profiles", "recipes", "favorites", "plan_entries", "recipe_shares", "list_shares", "household_members", "memberships", "shopping_lists", "agent_actions"] as const;

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== "POST") return json(405, { error: "POST only" });
  const userId = await getUserId(req);
  if (!userId) return json(401, { error: "Missing or invalid access token" });
  if (await rateLimitedDurable(`export:${userId}`, 5, 60 * 60 * 1000)) {
    return json(429, { error: "You just downloaded your data. Try again in a while." });
  }
  const asUser = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("authorization") ?? "" } },
    auth: { persistSession: false },
  });
  const out: Record<string, unknown> = { exported_at: new Date().toISOString(), user_id: userId };
  for (const table of TABLES) {
    const { data, error } = await asUser.from(table).select("*");
    out[table] = error ? { error: "not available" } : data;
  }
  return json(200, out);
});
