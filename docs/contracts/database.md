# Contract — Database (Supabase schema is law)

Status: M0 draft · Owner: security-builder (`supabase/migrations/`)
Generated types: `src/types/database.ts` — regenerate after EVERY migration;
a migration PR without the regenerated types fails review.

## The 9 tables (live schema, project `mepzfdefanfpnrvydyty`)

| Table | PK | Purpose | Owner column |
|---|---|---|---|
| `favorites` | id | saved seed recipes (paw) | `user_id` |
| `recipes` | id | user imports/creations | `user_id` |
| `plan_entries` | id | week planner rows | `user_id` |
| `seed_nutrition` | recipe_id | cached engine output for seed recipes | — (public read) |
| `recipe_shares` | slug | public share links | `user_id` |
| `list_shares` | token | shopping-list share snapshots | `user_id` |
| `collab_lists` | token | household list roots | `owner_user_id` |
| `collab_items` | id | household list items | via `token` → collab_lists |
| `resolved_ingredients` | id | AI-resolver cache | — (service writes) |

Column detail is `src/types/database.ts` — the generated file IS the contract
for shapes; this doc is the contract for meaning and policy.

## Conventions (carried over from v1, non-negotiable)

- `user_id` is `auth.uid()` as text. INSERT policies must force it; never
  trust a client-supplied owner column.
- Recipe id convention: seed recipes = numeric TheMealDB ids; user recipes =
  `u-<recipes.id>` when referenced as text (e.g. `plan_entries.recipe_id`).
  Branded types `SeedId` / `UserRecipeId` (see engine.md §Types) encode this
  at compile time.
- Timestamps: new tables use `timestamptz`. Existing `timestamp` columns
  keep their type until cutover (no migration churn mid-rebuild).
- `recipes.visibility`: `'private' | 'public'` (v1 values — schema.js:35;
  live rows contain 'public'). A CHECK constraint with THESE values lands
  with the v2 migrations; the v1 app keeps writing them until cutover.

## RLS stance (M2 packet acceptance)

- RLS ENABLED on every table, policies in the same migration that creates
  or alters the table.
- Default: owner-only CRUD (`auth.uid()::text = user_id`).
- Named exceptions (policy must cite this contract):
  - `seed_nutrition`: anon SELECT (public seed data); writes service-role only.
  - `recipe_shares` / `list_shares` / `collab_*`: **NO anon table SELECT** —
    a table policy cannot express "must know the slug", so anon SELECT would
    make capability URLs enumerable (`select *` dumps every active share).
    Reads go through SECURITY DEFINER Postgres functions taking the exact
    key (`get_recipe_share(slug)`, `get_list_share(token)`,
    `get_collab_list(token)`, item CRUD equivalents) that return only the
    matching non-revoked row(s). Explicit `search_path`, `REVOKE` default
    EXECUTE where not needed. These are DB functions, NOT edge functions —
    the 5-edge-function limit (FRAMEWORK §5) stands.
  - Writes on shares/collab: owner-only via RLS; collab item writes via the
    token-keyed SECURITY DEFINER functions (possession = membership,
    owner can revoke).
  - `resolved_ingredients`: service-role write, anon read.
- Every policy ships with its attack test: user B attempts CRUD on user A's
  rows and must fail (see testing.md §RLS attacks).

## Change control

Schema changes only via migration packets owned by security-builder. A
migration packet's `owner_path` is **`supabase/migrations/` PLUS
`src/types/database.ts`** — the regenerated types travel in the same diff
(otherwise the regenerate-on-migration rule and the diff-scope rule
deadlock). Any other agent needing a column files a `contract_gap`.
