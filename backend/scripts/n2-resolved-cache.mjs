// N2 — durable resolver cache table (idempotent, run from backend/ against prod):
//   node --env-file=.env scripts/n2-resolved-cache.mjs
// Same pattern as b0/b1/s2/s3: any new schema.js table needs its script run on
// prod, since the repo has no live migration journal. RLS enabled with no
// policies — backend connects as owner (bypass); PostgREST roles get nothing.
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

await sql`CREATE TABLE IF NOT EXISTS resolved_ingredients (
  id serial PRIMARY KEY,
  name text NOT NULL UNIQUE,
  food jsonb,
  tier text NOT NULL,
  resolved_at timestamptz DEFAULT now()
)`;
await sql`ALTER TABLE resolved_ingredients ENABLE ROW LEVEL SECURITY`;
console.log("resolved_ingredients ready (idempotent)");
await sql.end();
