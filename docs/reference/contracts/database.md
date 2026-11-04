# Contract — Database (Supabase schema is law)

Status: current · Last verified against code at commit 675f136b · 2026-11-04

Owner: security-builder (`supabase/migrations/`)
Generated types: `src/types/database.ts` — regenerate after EVERY migration;
a migration PR without the regenerated types fails review.

## The 12 tables (final state of `supabase/migrations/`, project `mepzfdefanfpnrvydyty`)

| Table | PK | Purpose | Owner column |
|---|---|---|---|
| `favorites` | id | saved seed recipes (paw) | `user_id` |
| `recipes` | id | user imports/creations (household co-members can read) | `user_id` |
| `plan_entries` | id | week planner rows (household co-members can read) | `user_id` |
| `seed_nutrition` | recipe_id | cached engine output for seed recipes | — (public read) |
| `recipe_shares` | slug | public share links | `user_id` |
| `list_shares` | token | shopping-list share snapshots | `user_id` |
| `resolved_ingredients` | id | AI-resolver cache (`name` unique) | — (service writes) |
| `households` | id (uuid) | a shared kitchen; `invite_code` unique | `created_by` |
| `household_members` | (household_id, user_id) | who is in which household | `user_id` |
| `household_list_state` | (household_id, item_key) | shared shopping-list check-offs, custom items, removals (Realtime) | via `household_id` → membership |
| `otto_recipes` | id | Otto's curated recipe catalogue (`canonical` + `provenance` jsonb) | — (public read, service writes) |
| `memberships` | user_id | Otto Club state mirrored from RevenueCat | `user_id` (read own; service writes) |

`collab_lists` / `collab_items` (v1) were dropped in
`20260723120000_harden_security_definer_functions.sql`; shared lists are
households now. RLS helpers `is_household_member` / `shares_household` live in
the non-exposed `private` schema.

Column detail is `src/types/database.ts` — the generated file IS the contract
for shapes; this doc is the contract for meaning and policy.

## Conventions (carried over from v1, non-negotiable)

- `user_id` is `auth.uid()` as text on the v1-era tables; the newer tables
  (`households*`, `memberships`) use `uuid` referencing `auth.users`. INSERT
  policies must force it; never trust a client-supplied owner column.
- Recipe id convention: seed recipes = numeric TheMealDB ids; user recipes =
  `u-<recipes.id>` when referenced as text (e.g. `plan_entries.recipe_id`).
  Branded types `SeedId` / `UserRecipeId` (see engine.md §Types) encode this
  at compile time.
- Timestamps: new tables use `timestamptz`. Existing `timestamp` columns
  keep their type until cutover (no migration churn mid-rebuild).
- `recipes.visibility`: `'private' | 'public'` (v1 values — schema.js:35;
  live rows contain 'public'), enforced by the `recipes_visibility_check`
  CHECK constraint in `20260721090002_recipes.sql`.

## RLS stance (M2 packet acceptance)

- RLS ENABLED on every table, policies in the same migration that creates
  or alters the table.
- Default: owner-only CRUD (`auth.uid()::text = user_id`).
- Named exceptions (policy must cite this contract):
  - `seed_nutrition`: anon SELECT (public seed data); writes service-role only.
  - `recipe_shares` / `list_shares`: **NO anon table SELECT** —
    a table policy cannot express "must know the slug", so anon SELECT would
    make capability URLs enumerable (`select *` dumps every active share).
    Reads go through SECURITY DEFINER Postgres functions taking the exact
    key (`get_recipe_share(slug)`, `get_list_share(token)`) that return only
    the matching non-revoked row. Explicit `search_path`, `REVOKE` default
    EXECUTE where not needed. These are DB functions, NOT edge functions.
  - Writes on shares: owner-only via RLS.
  - Households: members read the household, its members and its list state
    (`hls_all` FOR ALL for members); self-insert into `household_members`
    only for a household you created — every other join goes through the
    `join_household(code)` SECURITY DEFINER RPC, which validates the code.
  - `recipes` / `plan_entries` SELECT: owner OR a household co-member
    (`private.shares_household`), authenticated only.
  - `otto_recipes`: anon + authenticated SELECT; writes service-role only.
  - `resolved_ingredients`: service-role write, anon read.
  - `memberships`: authenticated SELECT of your own row only; no client
    writes — `revenuecat-webhook` (and `requireClub`) write as service role.
- Every policy ships with its attack test: user B attempts CRUD on user A's
  rows and must fail (see testing.md §RLS attacks).

## Change control

Schema changes only via migration packets owned by security-builder. A
migration packet's `owner_path` is **`supabase/migrations/` PLUS
`src/types/database.ts`** — the regenerated types travel in the same diff
(otherwise the regenerate-on-migration rule and the diff-scope rule
deadlock). Any other agent needing a column files a `contract_gap`.
