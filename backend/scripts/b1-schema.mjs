// B1.3 schema additions — idempotent. Run from backend/:
//   node --env-file=.env scripts/b1-schema.mjs
// recipes.nutrition — computed per-serving nutrition (null until computed).
// seed_nutrition   — compute-once cache for TheMealDB/test-batch recipes.
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

await sql.unsafe(`alter table recipes add column if not exists nutrition jsonb`);
await sql.unsafe(`
  create table if not exists seed_nutrition (
    recipe_id text primary key,
    nutrition jsonb not null,
    computed_at timestamptz not null default now()
  )`);
// Seed cache is server-owned reference data, but RLS on so a future direct
// client can read and never write.
await sql.unsafe(`alter table seed_nutrition enable row level security`);
await sql.unsafe(`drop policy if exists "seed nutrition readable" on seed_nutrition`);
await sql.unsafe(`create policy "seed nutrition readable" on seed_nutrition
  for select to authenticated using (true)`);

console.log("B1.3 schema applied.");
await sql.end();
