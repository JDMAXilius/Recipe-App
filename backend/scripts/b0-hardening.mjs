// B0.1 hardening (TERMINAL_TICKET_B0_B1 §B0.1) — idempotent, run from backend/:
//   node --env-file=.env scripts/b0-hardening.mjs
//
// 1. recipes.visibility  — P10 §4 column (was in schema.js but never pushed)
// 2. Row-Level Security  — belt-and-suspenders today (Express owns scoping via
//    requireAuth + WHERE user_id); becomes the real boundary the moment the
//    client talks to Supabase directly (Storage/Realtime/PostgREST). The
//    backend connects as the table OWNER, so owner-bypass keeps Express
//    working; policies below only govern non-owner roles (anon/authenticated).
// 3. user_id indexes     — every query on these tables filters by user_id.
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

const steps = [
  // -- P10 §4 column the code already expects
  `alter table recipes add column if not exists visibility text not null default 'private'`,

  // -- RLS on, with per-user policies for the API roles (auth.uid() is uuid; user_id is text)
  `alter table favorites enable row level security`,
  `alter table recipes enable row level security`,
  `alter table plan_entries enable row level security`,

  `drop policy if exists "own favorites" on favorites`,
  `create policy "own favorites" on favorites for all to authenticated
     using ((select auth.uid())::text = user_id)
     with check ((select auth.uid())::text = user_id)`,

  `drop policy if exists "own recipes" on recipes`,
  `create policy "own recipes" on recipes for all to authenticated
     using ((select auth.uid())::text = user_id)
     with check ((select auth.uid())::text = user_id)`,

  // Discover-social Phase 2 groundwork: public recipes are readable by anyone signed in.
  `drop policy if exists "public recipes readable" on recipes`,
  `create policy "public recipes readable" on recipes for select to authenticated
     using (visibility = 'public')`,

  `drop policy if exists "own plan entries" on plan_entries`,
  `create policy "own plan entries" on plan_entries for all to authenticated
     using ((select auth.uid())::text = user_id)
     with check ((select auth.uid())::text = user_id)`,

  // -- user_id indexes (all reads filter on user_id; plan also filters by day)
  `create index if not exists favorites_user_id_idx on favorites (user_id)`,
  `create index if not exists recipes_user_id_idx on recipes (user_id)`,
  `create index if not exists plan_entries_user_day_idx on plan_entries (user_id, day)`,
];

for (const stmt of steps) {
  await sql.unsafe(stmt);
  console.log("ok:", stmt.split("\n")[0].trim());
}

await sql.end();
console.log("B0.1 hardening applied.");
