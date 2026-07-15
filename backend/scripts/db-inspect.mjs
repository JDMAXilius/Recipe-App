// Quick live-DB inspection: tables, RLS state, policies, indexes, drizzle journal.
// Run from backend/: node --env-file=.env scripts/db-inspect.mjs
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

const tables = await sql`
  select c.relname as table, c.relrowsecurity as rls_enabled,
         (select count(*) from pg_policies p where p.tablename = c.relname) as policies
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
  order by 1`;
console.log("TABLES:", JSON.stringify(tables, null, 1));

const cols = await sql`
  select table_name, column_name, data_type
  from information_schema.columns
  where table_schema = 'public'
  order by table_name, ordinal_position`;
console.log("COLUMNS:", JSON.stringify(cols));

const idx = await sql`
  select tablename, indexname from pg_indexes where schemaname='public' order by 1`;
console.log("INDEXES:", JSON.stringify(idx, null, 1));

const journal = await sql`
  select hash, created_at from drizzle.__drizzle_migrations order by created_at`
  .catch((e) => `no drizzle journal: ${e.message}`);
console.log("DRIZZLE JOURNAL:", JSON.stringify(journal));

await sql.end();
