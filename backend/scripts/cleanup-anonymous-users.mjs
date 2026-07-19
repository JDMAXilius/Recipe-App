// Prune stale anonymous (guest) users. Run from backend/:
//   node --env-file=.env scripts/cleanup-anonymous-users.mjs            # DRY RUN — reports only
//   node --env-file=.env scripts/cleanup-anonymous-users.mjs --apply    # actually deletes
//   node --env-file=.env scripts/cleanup-anonymous-users.mjs --days 60  # change the cutoff
//
// Why this exists: `signInAnonymously()` is an UNAUTHENTICATED endpoint that
// writes a row to auth.users on every call. Guests who never convert accumulate
// forever, and the endpoint is trivially abusable — Supabase's own guidance is
// CAPTCHA plus periodic cleanup. This is the cleanup half.
//
// Safety rules, in order:
//   1. DRY RUN by default. Deleting users is not something to trigger by typo.
//   2. Only users with `is_anonymous: true` are ever considered. A real account
//      is never touched, whatever its age.
//   3. A guest that OWNS DATA is skipped, even past the cutoff — they are mid-use
//      (or mid-conversion), and their recipes/plans/saves are real work. Only
//      empty, expired guests are removed.
// Deleting the auth user cascades nothing on its own, hence rule 3: rows keyed to
// a deleted uid would be orphaned, not cleaned.
import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const DAYS = Number(args[args.indexOf("--days") + 1]) || (args.includes("--days") ? NaN : 30);

if (!Number.isFinite(DAYS) || DAYS < 1) {
  console.error("--days must be a positive number");
  process.exit(1);
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("SUPABASE_SERVICE_ROLE_KEY is required (admin API).");
  process.exit(1);
}

const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const sql = postgres(process.env.DATABASE_URL, { prepare: false });
const cutoff = new Date(Date.now() - DAYS * 86400000);

// Page through every user; the admin API caps a page at 1000.
const anonymous = [];
for (let page = 1; ; page++) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) throw new Error(`listUsers failed: ${error.message}`);
  anonymous.push(...data.users.filter((u) => u.is_anonymous));
  if (data.users.length < 1000) break;
}

const expired = anonymous.filter((u) => new Date(u.created_at) < cutoff);

// One query for all of them rather than three per user.
const ids = expired.map((u) => u.id);
const withData = new Set();
if (ids.length > 0) {
  const rows = await sql`
    select user_id from recipes where user_id = any(${ids})
    union select user_id from favorites where user_id = any(${ids})
    union select user_id from plan_entries where user_id = any(${ids})
    union select owner_user_id as user_id from collab_lists where owner_user_id = any(${ids})`;
  rows.forEach((r) => withData.add(r.user_id));
}

const deletable = expired.filter((u) => !withData.has(u.id));

console.log(`anonymous users:      ${anonymous.length}`);
console.log(`older than ${DAYS}d:        ${expired.length}`);
console.log(`  ...holding data:    ${withData.size}  (skipped — real work to lose)`);
console.log(`  ...empty:           ${deletable.length}  ${APPLY ? "→ deleting" : "→ would delete"}`);

if (!APPLY) {
  console.log(`\nDRY RUN. Re-run with --apply to delete those ${deletable.length}.`);
  await sql.end();
  process.exit(0);
}

let done = 0;
for (const u of deletable) {
  const { error } = await admin.auth.admin.deleteUser(u.id);
  if (error) console.error(`  FAILED ${u.id}: ${error.message}`);
  else done++;
}
console.log(`\ndeleted ${done}/${deletable.length}`);
await sql.end();
