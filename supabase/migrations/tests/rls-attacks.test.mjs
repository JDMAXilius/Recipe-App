// RLS attack tests (testing.md §RLS attacks; database.md §RLS stance).
// Plain node script — no framework, no secrets: committed anon key + two
// throwaway sign-ups. User B attempts CRUD on user A's rows across EVERY
// table, and tries to enumerate shares and kitchens with bare selects. The attack
// FAILING is the acceptance criterion.
//
// Run:   node supabase/migrations/tests/rls-attacks.test.mjs
// Runnable ONLY after the 202607210900xx migrations are applied to the
// project. If sign-up is blocked (email confirmation required), the run
// exits 2 — move it to a terminal environment per testing.md.
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// RLS_URL / RLS_ANON_KEY point the suite at a local stack (CI: `supabase
// start`, then this script). Without them it reads .env.development, which is
// the PRODUCTION project: that run creates two real throwaway accounts.
const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const env = process.env.RLS_URL ? "" : readFileSync(join(root, ".env.development"), "utf8");
const URL_ = process.env.RLS_URL ?? env.match(/^EXPO_PUBLIC_SUPABASE_URL=(.+)$/m)?.[1]?.trim();
const ANON = process.env.RLS_ANON_KEY ?? env.match(/^EXPO_PUBLIC_SUPABASE_ANON_KEY=(.+)$/m)?.[1]?.trim();
if (!URL_ || !ANON) {
  console.error("Missing EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY in .env.development");
  process.exit(2);
}

let pass = 0;
let fail = 0;
const failures = [];
function check(name, cond, detail = "") {
  if (cond) {
    pass++;
  } else {
    fail++;
    failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function rest(path, { method = "GET", token = null, body, headers = {} } = {}) {
  const res = await fetch(`${URL_}${path}`, {
    method,
    headers: {
      apikey: ANON,
      authorization: `Bearer ${token || ANON}`,
      "content-type": "application/json",
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* 204 etc. */
  }
  return { status: res.status, data };
}

async function signUp(label) {
  const email = `otto-rls-${Date.now()}-${label}@example.com`;
  const { status, data } = await rest("/auth/v1/signup", {
    method: "POST",
    body: { email, password: `Rls-attack-${randomBytes(8).toString("hex")}` },
  });
  const token = data?.access_token;
  const id = data?.user?.id ?? data?.id;
  if (status !== 200 || !token || !id) {
    console.error(
      `Throwaway sign-up (${label}) did not return a session (status ${status}).\n` +
        "Likely email confirmation is required in this environment — run this " +
        "script from the terminal per testing.md §Credentials, or temporarily " +
        "enable auto-confirm on a Supabase BRANCH (never weaken prod).",
    );
    process.exit(2);
  }
  return { token, id, email };
}

// PostgREST helpers — representation so a filtered write shows as [].
const REP = { Prefer: "return=representation" };
const rows = (r) => (Array.isArray(r.data) ? r.data : []);

const OWNER_TABLES = [
  // [table, owner column, seed row factory]
  ["favorites", "user_id", () => ({ recipe_id: 52772, title: "RLS seed favorite" })],
  ["recipes", "user_id", () => ({ source: "manual", title: "RLS seed recipe", ingredients: [], steps: [] })],
  ["plan_entries", "user_id", () => ({ day: "2026-07-21", title: "RLS seed plan row" })],
  // recipe_shares seeded separately (needs an owned recipe id)
  ["list_shares", "user_id", () => ({ token: tok(), payload: { items: [] } })],
];

const tok = () => randomBytes(9).toString("base64url");

const A_ROWS = {}; // table -> seeded row

async function seedAsA(A) {
  for (const [table, ownerCol, make] of OWNER_TABLES) {
    const body = { ...make(), [ownerCol]: A.id };
    const r = await rest(`/rest/v1/${table}`, { method: "POST", token: A.token, body, headers: REP });
    check(`seed: A inserts own ${table} row`, r.status === 201 && rows(r).length === 1, JSON.stringify(r.data));
    A_ROWS[table] = rows(r)[0];
  }
  // recipe share for A's own recipe
  const shareBody = { slug: tok(), recipe_id: A_ROWS.recipes.id, user_id: A.id };
  const r = await rest("/rest/v1/recipe_shares", { method: "POST", token: A.token, body: shareBody, headers: REP });
  check("seed: A shares own recipe", r.status === 201 && rows(r).length === 1, JSON.stringify(r.data));
  A_ROWS.recipe_shares = rows(r)[0];
  // a kitchen (household) A owns, A as its member, one shared list row
  const hh = await rest("/rest/v1/households", {
    method: "POST", token: A.token, headers: REP,
    body: { name: "RLS seed kitchen", invite_code: tok(), created_by: A.id },
  });
  check("seed: A creates own household", hh.status === 201 && rows(hh).length === 1, JSON.stringify(hh.data));
  A_ROWS.households = rows(hh)[0];
  // No return=representation here, same as the app: the read-back would run
  // the member SELECT policy before this very row makes A a member.
  const hm = await rest("/rest/v1/household_members", {
    method: "POST", token: A.token,
    body: { household_id: A_ROWS.households?.id, user_id: A.id, display_name: "Ana" },
  });
  check("seed: A joins own household", hm.status === 201, JSON.stringify(hm.data));
  const ls = await rest("/rest/v1/household_list_state", {
    method: "POST", token: A.token, headers: REP,
    body: { household_id: A_ROWS.households?.id, item_key: "milk", checked: false },
  });
  check("seed: A writes shared list state", ls.status === 201, JSON.stringify(ls.data));
}

function pkFilter(table, row) {
  if (table === "recipe_shares") return `slug=eq.${row.slug}`;
  if (table === "list_shares") return `token=eq.${row.token}`;
  return `id=eq.${row.id}`;
}

async function attackAsB(A, B) {
  const tables = [...OWNER_TABLES.map(([t, c]) => [t, c]), ["recipe_shares", "user_id"]];
  for (const [table, ownerCol] of tables) {
    const row = A_ROWS[table];
    const filter = pkFilter(table, row);

    // read A's row
    let r = await rest(`/rest/v1/${table}?${filter}`, { token: B.token });
    check(`attack: B cannot SELECT A's ${table} row`, r.status === 200 && rows(r).length === 0, `got ${rows(r).length} rows`);

    // full-table enumeration
    r = await rest(`/rest/v1/${table}?select=*`, { token: B.token });
    check(`attack: B's bare SELECT on ${table} returns nothing of A's`, rows(r).every((x) => x[ownerCol] !== A.id), `leaked ${rows(r).length} rows`);

    // update A's row
    r = await rest(`/rest/v1/${table}?${filter}`, {
      method: "PATCH",
      token: B.token,
      body: table === "plan_entries" ? { note: "hacked" } : table === "favorites" ? { title: "hacked" } : table === "recipes" ? { title: "hacked" } : { revoked_at: new Date().toISOString() },
      headers: REP,
    });
    check(`attack: B cannot UPDATE A's ${table} row`, r.status < 300 ? rows(r).length === 0 : true, JSON.stringify(r.data));

    // steal ownership
    r = await rest(`/rest/v1/${table}?${filter}`, {
      method: "PATCH",
      token: B.token,
      body: { [ownerCol]: B.id },
      headers: REP,
    });
    check(`attack: B cannot reassign A's ${table} row to himself`, r.status >= 400 || rows(r).length === 0, JSON.stringify(r.data));

    // delete A's row
    r = await rest(`/rest/v1/${table}?${filter}`, { method: "DELETE", token: B.token, headers: REP });
    check(`attack: B cannot DELETE A's ${table} row`, r.status < 300 ? rows(r).length === 0 : true, JSON.stringify(r.data));

    // spoof an INSERT carrying A's user id
    const [, , make] = OWNER_TABLES.find(([t]) => t === table) || [];
    const spoof = table === "recipe_shares"
      ? { slug: tok(), recipe_id: A_ROWS.recipes.id, user_id: A.id }
      : { ...make(), [ownerCol]: A.id };
    r = await rest(`/rest/v1/${table}`, { method: "POST", token: B.token, body: spoof, headers: REP });
    check(`attack: B cannot INSERT into ${table} as A`, r.status >= 400, `status ${r.status}`);

    // row still intact for A
    r = await rest(`/rest/v1/${table}?${filter}`, { token: A.token });
    check(`post: A's ${table} row survived the attack`, rows(r).length === 1, `got ${rows(r).length}`);
  }

  // B shares A's recipe under B's own user_id (ownership subquery must block it)
  const r = await rest("/rest/v1/recipe_shares", {
    method: "POST",
    token: B.token,
    body: { slug: tok(), recipe_id: A_ROWS.recipes.id, user_id: B.id },
    headers: REP,
  });
  check("attack: B cannot mint a share for A's recipe", r.status >= 400, `status ${r.status}`);

  // Kitchens: B is not a member of A's household, so every read is empty and
  // B cannot add himself (hm_insert_self: only the creator inserts directly;
  // everyone else goes through join_household with the invite code).
  const hid = A_ROWS.households?.id;
  for (const [table, filter] of [
    ["households", `id=eq.${hid}`],
    ["household_members", `household_id=eq.${hid}`],
    ["household_list_state", `household_id=eq.${hid}`],
  ]) {
    const got = await rest(`/rest/v1/${table}?${filter}`, { token: B.token });
    check(`attack: B cannot SELECT A's ${table}`, rows(got).length === 0, `got ${rows(got).length}`);
  }
  let h = await rest("/rest/v1/household_members", {
    method: "POST", token: B.token, headers: REP,
    body: { household_id: hid, user_id: B.id, display_name: "Ben" },
  });
  check("attack: B cannot insert himself into A's household", h.status >= 400, `status ${h.status}`);
  h = await rest("/rest/v1/household_list_state", {
    method: "POST", token: B.token, headers: REP,
    body: { household_id: hid, item_key: "hacked", checked: true },
  });
  check("attack: B cannot write A's shared list", h.status >= 400, `status ${h.status}`);

  // memberships are written only by the RevenueCat webhook (service role).
  // A signed-in user granting himself Otto Club is the attack that costs money.
  h = await rest("/rest/v1/memberships", {
    method: "POST", token: B.token, headers: REP,
    body: { user_id: B.id, expires_at: "2099-01-01T00:00:00Z", product_id: "otto_club_yearly" },
  });
  check("attack: B cannot grant himself a membership", h.status >= 400, `status ${h.status}`);
}

async function enumerationAsAnon(B) {
  const B_TOKEN = B.token;
  // shares/kitchens/memberships: NO anon table SELECT — a bare select must never dump tokens
  for (const table of ["recipe_shares", "list_shares", "households", "household_members", "household_list_state", "memberships"]) {
    const r = await rest(`/rest/v1/${table}?select=*`);
    check(`enum: anon bare SELECT on ${table} yields nothing`, rows(r).length === 0, `status ${r.status}, ${rows(r).length} rows`);
  }
  // named exceptions: public reads ARE allowed. Assert ROWS come back, not just
  // status 200 — RLS-enabled + no-anon-policy also returns 200 with [], so a
  // deleted read policy would false-PASS a status-only check (prod has rows).
  let r = await rest("/rest/v1/seed_nutrition?select=recipe_id&limit=1");
  // Public by design (catalogue caches); a fresh local stack has no rows, so
  // readability is the claim, not a row count.
  check("enum: anon CAN read seed_nutrition", r.status === 200 && Array.isArray(rows(r)), `status ${r.status}`);
  r = await rest("/rest/v1/resolved_ingredients?select=name&limit=1");
  check("enum: anon CAN read resolved_ingredients", r.status === 200 && Array.isArray(rows(r)), `status ${r.status}`);
  // but neither anon NOR an authenticated user may write them (service-role only).
  // A stray `to authenticated` INSERT policy would let any signed-in user poison
  // the shared nutrition cache for everyone — attack both roles.
  for (const [who, hdr] of [["anon", { headers: REP }], ["authed B", { token: B_TOKEN, headers: REP }]]) {
    r = await rest("/rest/v1/seed_nutrition", { method: "POST", body: { recipe_id: "999999999", nutrition: {} }, ...hdr });
    check(`enum: ${who} cannot write seed_nutrition`, r.status === 401 || r.status === 403, `status ${r.status}`);
    r = await rest("/rest/v1/resolved_ingredients", { method: "POST", body: { name: `x-${tok()}`, tier: "miss" }, ...hdr });
    check(`enum: ${who} cannot write resolved_ingredients`, r.status === 401 || r.status === 403, `status ${r.status}`);
  }
}

async function definerFunctions(A, B) {
  // exact-key reads work for the capability holder
  let r = await rest("/rest/v1/rpc/get_recipe_share", { method: "POST", body: { p_slug: A_ROWS.recipe_shares.slug } });
  check("fn: anon get_recipe_share(slug) returns the share", r.status === 200 && rows(r)[0]?.status === "ok", JSON.stringify(r.data));
  check("fn: shared recipe payload carries no user_id", !("user_id" in (rows(r)[0]?.recipe || {})), JSON.stringify(rows(r)[0]?.recipe));

  r = await rest("/rest/v1/rpc/get_recipe_share", { method: "POST", body: { p_slug: tok() } });
  check("fn: wrong slug returns no rows", r.status === 200 && rows(r).length === 0, JSON.stringify(r.data));

  r = await rest("/rest/v1/rpc/get_list_share", { method: "POST", body: { p_token: A_ROWS.list_shares.token } });
  check("fn: anon get_list_share(token) returns the snapshot", r.status === 200 && rows(r)[0]?.status === "ok", JSON.stringify(r.data));

  // admin function is service-role only — must be DENIED (403), not MISSING (404).
  // A 404 would mean the account-deletion function was never created yet still
  // "pass" a status>=400 check, so distinguish the two explicitly.
  // Distinguish DENIED (403/401, intended) from MISSING (404) — a status>=400
  // check alone would green-light a never-created function. Service-role can't
  // be exercised here (the rest helper pins the anon apikey); positive-existence
  // is covered at the terminal apply step, noted in the report-back.
  r = await rest("/rest/v1/rpc/admin_delete_user_data", { method: "POST", token: B.token, body: { p_user_id: A.id } });
  check("fn: B call of admin_delete_user_data is DENIED not missing", r.status === 403 || r.status === 401, `status ${r.status} (404 = function absent!)`);
}

// app_events (R0.8): insert own only; nobody reads, changes or deletes.
// household_join_attempts + join limit (A2).
async function eventsAndJoins(A, B) {
  const row = (user_id) => ({ user_id, device_id: "rls-device-0001", name: "paywall_viewed", props: { variant: "generic" }, occurred_at: new Date().toISOString() });
  let r = await rest("/rest/v1/app_events", { method: "POST", token: A.token, body: row(A.id) });
  check("events: A can write A's event", r.status === 201, `status ${r.status} ${JSON.stringify(r.data)}`);
  r = await rest("/rest/v1/app_events", { method: "POST", token: B.token, body: row(A.id) });
  check("events: B cannot write an event as A", r.status === 401 || r.status === 403, `status ${r.status}`);
  r = await rest("/rest/v1/app_events", { method: "POST", body: row(A.id) });
  check("events: anon cannot write events", r.status === 401 || r.status === 403, `status ${r.status}`);
  for (const [who, token] of [["A", A.token], ["B", B.token], ["anon", null]]) {
    r = await rest("/rest/v1/app_events?select=id", { token });
    check(`events: ${who} reads no events`, r.status === 200 && rows(r).length === 0, `status ${r.status}, ${rows(r).length} rows`);
  }
  r = await rest(`/rest/v1/app_events?user_id=eq.${A.id}`, { method: "DELETE", token: A.token, headers: { prefer: "return=representation" } });
  check("events: A cannot delete A's events", (r.status === 200 && rows(r).length === 0) || r.status === 401 || r.status === 403, `status ${r.status}`);

  r = await rest("/rest/v1/household_join_attempts?select=user_id", { token: B.token });
  check("joins: attempts are not readable", r.status === 200 && rows(r).length === 0, `status ${r.status}, ${rows(r).length} rows`);
  r = await rest("/rest/v1/rpc/join_household", { method: "POST", token: B.token, body: { code: "ZZZZZZ" } });
  check("joins: a wrong code answers null, not an error", r.status === 200 && r.data === null, `status ${r.status} ${JSON.stringify(r.data)}`);
  for (let i = 0; i < 9; i++) await rest("/rest/v1/rpc/join_household", { method: "POST", token: B.token, body: { code: "ZZZZZZ" } });
  r = await rest("/rest/v1/rpc/join_household", { method: "POST", token: B.token, body: { code: "ZZZZZZ" } });
  check("joins: the 11th try in 15 minutes is refused", r.status >= 400 && /Too many tries/.test(JSON.stringify(r.data)), `status ${r.status} ${JSON.stringify(r.data)}`);
  r = await rest("/rest/v1/rpc/join_household", { method: "POST", body: { code: "ZZZZZZ" } });
  // Refused by the grant (401/403) or by the function itself ("Sign in…").
  check("joins: anon cannot join", r.status === 401 || r.status === 403 || (r.status === 400 && /Sign in/.test(JSON.stringify(r.data))), `status ${r.status} ${JSON.stringify(r.data)}`);
}

// profiles (R0.4): own row only.
async function profilesOwnRow(A, B) {
  let r = await rest("/rest/v1/profiles", { method: "POST", token: A.token, body: { user_id: A.id, diet: "vegan", allergies: ["peanut"] } });
  check("profiles: A can write A's row", r.status === 201, `status ${r.status} ${JSON.stringify(r.data)}`);
  r = await rest("/rest/v1/profiles", { method: "POST", token: B.token, body: { user_id: A.id, diet: "none" } });
  check("profiles: B cannot write A's row", r.status === 401 || r.status === 403 || r.status === 409, `status ${r.status}`);
  r = await rest(`/rest/v1/profiles?user_id=eq.${A.id}&select=user_id`, { token: B.token });
  check("profiles: B reads none of A's", r.status === 200 && rows(r).length === 0, `status ${r.status}, ${rows(r).length} rows`);
  r = await rest(`/rest/v1/profiles?user_id=eq.${A.id}`, { method: "PATCH", token: B.token, body: { diet: "none" }, headers: { prefer: "return=representation" } });
  check("profiles: B cannot change A's", r.status === 200 && rows(r).length === 0, `status ${r.status}`);
  r = await rest("/rest/v1/profiles?select=user_id");
  check("profiles: anon reads none", r.status === 200 && rows(r).length === 0, `status ${r.status}, ${rows(r).length} rows`);
  r = await rest(`/rest/v1/profiles?user_id=eq.${A.id}&select=diet`, { token: A.token });
  check("profiles: A reads A's own", r.status === 200 && rows(r)[0]?.diet === "vegan", JSON.stringify(r.data));
}

// rate_limits (R0.12): only the service role may record or read hits.
async function rateLimitsServiceOnly(A) {
  for (const [who, token] of [["anon", null], ["A", A.token]]) {
    const r = await rest("/rest/v1/rpc/rate_limit_hit", { method: "POST", token, body: { p_key: `x:${A.id}`, p_limit: 1, p_window_seconds: 60 } });
    check(`limits: ${who} cannot call rate_limit_hit`, r.status >= 400, `status ${r.status} ${JSON.stringify(r.data)}`);
  }
  const r = await rest("/rest/v1/rate_limits?select=key", { token: A.token });
  check("limits: the table is not readable", r.status === 200 && rows(r).length === 0, `status ${r.status}, ${rows(r).length} rows`);
}

const A = await signUp("a");
const B = await signUp("b");
console.log(`Signed up throwaway users A=${A.email} B=${B.email} (deleted at the end via delete-account)`);

await seedAsA(A);
await attackAsB(A, B);
await enumerationAsAnon(B);
await definerFunctions(A, B);
await eventsAndJoins(A, B);
await profilesOwnRow(A, B);
await rateLimitsServiceOnly(A);

// Clean up through the real account-deletion path, so the run leaves nothing
// behind in prod AND exercises delete-account end to end.
// A local stack (RLS_URL) runs without edge functions and is thrown away
// whole, so there is nothing to clean.
for (const u of process.env.RLS_URL ? [] : [A, B]) {
  const r = await rest("/functions/v1/delete-account", { method: "POST", token: u.token });
  check(`cleanup: delete-account removes ${u.email}`, r.status === 200, `status ${r.status} ${JSON.stringify(r.data)}`);
}

console.log(`\nRLS attack run: ${pass} passed, ${fail} failed`);
for (const f of failures) console.error(`  FAIL ${f}`);
process.exit(fail ? 1 : 0);
