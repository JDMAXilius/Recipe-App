// RLS attack tests (testing.md §RLS attacks; database.md §RLS stance).
// Plain node script — no framework, no secrets: committed anon key + two
// throwaway sign-ups. User B attempts CRUD on user A's rows across EVERY
// table, and tries to enumerate shares/collab with bare selects. The attack
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

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const env = readFileSync(join(root, ".env.development"), "utf8");
const URL_ = env.match(/^EXPO_PUBLIC_SUPABASE_URL=(.+)$/m)?.[1]?.trim();
const ANON = env.match(/^EXPO_PUBLIC_SUPABASE_ANON_KEY=(.+)$/m)?.[1]?.trim();
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
  ["collab_lists", "owner_user_id", () => ({ token: tok() })],
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
  // one collab item on A's list, via the DEFINER function (the only path)
  const item = await rest("/rest/v1/rpc/add_collab_item", {
    method: "POST",
    token: A.token,
    body: { p_token: A_ROWS.collab_lists.token, p_name: "milk", p_amount: "1 l", p_display_name: "Ana" },
  });
  check("seed: A adds collab item via rpc", item.status === 200 && item.data?.id, JSON.stringify(item.data));
  A_ROWS.collab_item = item.data;
}

function pkFilter(table, row) {
  if (table === "recipe_shares") return `slug=eq.${row.slug}`;
  if (table === "list_shares" || table === "collab_lists") return `token=eq.${row.token}`;
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

  // collab_items has NO policies — even an authed bare select must be empty
  const items = await rest("/rest/v1/collab_items?select=*", { token: B.token });
  check("attack: B's bare SELECT on collab_items is empty", items.status === 200 && rows(items).length === 0, `got ${rows(items).length}`);
}

async function enumerationAsAnon() {
  // shares/collab: NO anon table SELECT — a bare select must never dump tokens
  for (const table of ["recipe_shares", "list_shares", "collab_lists", "collab_items"]) {
    const r = await rest(`/rest/v1/${table}?select=*`);
    check(`enum: anon bare SELECT on ${table} yields nothing`, rows(r).length === 0, `status ${r.status}, ${rows(r).length} rows`);
  }
  // named exceptions: public reads ARE allowed
  let r = await rest("/rest/v1/seed_nutrition?select=recipe_id&limit=1");
  check("enum: anon CAN read seed_nutrition", r.status === 200, `status ${r.status}`);
  r = await rest("/rest/v1/resolved_ingredients?select=name&limit=1");
  check("enum: anon CAN read resolved_ingredients", r.status === 200, `status ${r.status}`);
  // but not write them
  r = await rest("/rest/v1/seed_nutrition", { method: "POST", body: { recipe_id: "999999999", nutrition: {} }, headers: REP });
  check("enum: anon cannot write seed_nutrition", r.status >= 400, `status ${r.status}`);
  r = await rest("/rest/v1/resolved_ingredients", { method: "POST", body: { name: `x-${tok()}`, tier: "miss" }, headers: REP });
  check("enum: anon cannot write resolved_ingredients", r.status >= 400, `status ${r.status}`);
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

  // collab: authenticated-only; possession = membership (B holds A's token → allowed BY DESIGN)
  r = await rest("/rest/v1/rpc/get_collab_list", { method: "POST", body: { p_token: A_ROWS.collab_lists.token } });
  check("fn: anon cannot call get_collab_list", r.status >= 400, `status ${r.status}`);

  r = await rest("/rest/v1/rpc/get_collab_list", { method: "POST", token: B.token, body: { p_token: A_ROWS.collab_lists.token } });
  check("fn: B with the token CAN read the collab list (possession = membership)", r.status === 200 && rows(r)[0]?.status === "ok", JSON.stringify(r.data));

  const add = await rest("/rest/v1/rpc/add_collab_item", {
    method: "POST",
    token: B.token,
    body: { p_token: A_ROWS.collab_lists.token, p_name: "eggs", p_amount: null, p_display_name: "Ben" },
  });
  check("fn: B with the token can add an item", add.status === 200 && add.data?.id, JSON.stringify(add.data));

  r = await rest("/rest/v1/rpc/set_collab_item_checked", {
    method: "POST",
    token: B.token,
    body: { p_token: A_ROWS.collab_lists.token, p_id: add.data?.id, p_checked: true, p_display_name: "Ben" },
  });
  check("fn: B can check an item", r.status === 200 && r.data?.checked === true, JSON.stringify(r.data));

  // wrong token → nothing (functions never confirm other lists' items)
  r = await rest("/rest/v1/rpc/set_collab_item_checked", {
    method: "POST",
    token: B.token,
    body: { p_token: tok(), p_id: A_ROWS.collab_item?.id, p_checked: true, p_display_name: "Ben" },
  });
  check("fn: a wrong collab token is rejected", r.status >= 400, `status ${r.status}`);

  // only the owner can revoke the list (table RLS)
  r = await rest(`/rest/v1/collab_lists?token=eq.${A_ROWS.collab_lists.token}`, {
    method: "PATCH",
    token: B.token,
    body: { revoked_at: new Date().toISOString() },
    headers: REP,
  });
  check("fn: B cannot revoke A's collab list", r.status < 300 ? rows(r).length === 0 : true, JSON.stringify(r.data));

  // admin function is service-role only
  r = await rest("/rest/v1/rpc/admin_delete_user_data", { method: "POST", token: B.token, body: { p_user_id: A.id } });
  check("fn: B cannot call admin_delete_user_data", r.status >= 400, `status ${r.status}`);
}

const A = await signUp("a");
const B = await signUp("b");
console.log(`Signed up throwaway users A=${A.email} B=${B.email} (disposable; cleanup is manual/service-role)`);

await seedAsA(A);
await attackAsB(A, B);
await enumerationAsAnon();
await definerFunctions(A, B);

console.log(`\nRLS attack run: ${pass} passed, ${fail} failed`);
for (const f of failures) console.error(`  FAIL ${f}`);
process.exit(fail ? 1 : 0);
