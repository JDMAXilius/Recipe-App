// S2 share-link schema — idempotent. Run from backend/:
//   node --env-file=.env scripts/s2-share-schema.mjs
//
// Same failure as S3's collab tables, one feature earlier and still live in
// production: recipe_shares and list_shares are defined in src/db/schema.js
// but were never pushed to the live DB. So today:
//   - "Share this recipe" → POST /api/recipes/:id/share 500s
//   - "Send the shopping list" → POST /api/share/list 500s
// Both callers catch the failure and quietly fall back to a plain-text share,
// which is why this looked like a design choice rather than a broken feature.
// Creating the tables switches the real capability links on.
//
// Found 2026-07-19 by seeding every user-owned table against the live DB while
// testing account deletion — the endpoints were never exercised against prod.
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

// recipe_shares — unguessable slug → one user recipe. Owner-revocable.
await sql.unsafe(`
  create table if not exists recipe_shares (
    slug text primary key,
    recipe_id integer not null,
    user_id text not null,
    created_at timestamptz default now(),
    revoked_at timestamptz
  )`);

// list_shares — a read-only shopping-list snapshot; the recipient needs no account.
await sql.unsafe(`
  create table if not exists list_shares (
    token text primary key,
    user_id text not null,
    payload jsonb not null,
    created_at timestamptz default now(),
    revoked_at timestamptz
  )`);

// Mint checks for an existing live share by recipe_id; deletion sweeps by user_id.
await sql.unsafe(`create index if not exists recipe_shares_recipe_id_idx on recipe_shares (recipe_id)`);
await sql.unsafe(`create index if not exists recipe_shares_user_id_idx on recipe_shares (user_id)`);
await sql.unsafe(`create index if not exists list_shares_user_id_idx on list_shares (user_id)`);

// Defense-in-depth, matching every other table: RLS on, no client policy — the
// Express backend connects as the table owner and bypasses RLS, so a future
// direct-from-client call can never read these without an explicit policy.
await sql.unsafe(`alter table recipe_shares enable row level security`);
await sql.unsafe(`alter table list_shares enable row level security`);

console.log("S2 share schema applied (recipe_shares, list_shares).");
await sql.end();
