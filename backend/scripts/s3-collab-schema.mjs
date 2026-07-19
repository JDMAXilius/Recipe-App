// S3 collaborative-list schema — idempotent. Run from backend/:
//   node --env-file=.env scripts/s3-collab-schema.mjs
//
// These two tables back the shared shopping list ("Our list"). They are
// defined in src/db/schema.js (collabListsTable / collabItemsTable) but were
// never pushed to the live DB, so every /api/lists call 500s
// ("relation collab_lists does not exist") and the app shows "Shared lists
// aren't switched on for this kitchen yet." Creating them turns the feature on.
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

// collab_lists — the capability token IS the membership.
await sql.unsafe(`
  create table if not exists collab_lists (
    token text primary key,
    owner_user_id text not null,
    created_at timestamptz default now(),
    revoked_at timestamptz
  )`);

// collab_items — rows on a shared list; names denormalized at write time.
await sql.unsafe(`
  create table if not exists collab_items (
    id serial primary key,
    token text not null,
    name text not null,
    amount text,
    added_by_name text not null,
    checked boolean not null default false,
    checked_by_name text,
    created_at timestamptz default now()
  )`);

// The list-read query filters by token; index it.
await sql.unsafe(`create index if not exists collab_items_token_idx on collab_items (token)`);

// Defense-in-depth (matches favorites/recipes/plan_entries from b0-hardening):
// RLS on, no client policy — the Express backend connects as the table owner
// and bypasses RLS, so the feature keeps working while a future direct client
// can never touch these tables without an explicit policy.
await sql.unsafe(`alter table collab_lists enable row level security`);
await sql.unsafe(`alter table collab_items enable row level security`);

console.log("S3 collab schema applied (collab_lists, collab_items).");
await sql.end();
