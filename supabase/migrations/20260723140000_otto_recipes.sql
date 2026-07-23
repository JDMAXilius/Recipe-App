-- otto_recipes — serving copy of the medallion "silver" layer (docs/tickets/OWN_RECIPE_DB.md).
-- RLS posture mirrors seed_nutrition (database.md §RLS stance): anon SELECT (public
-- catalogue data); writes are service-role only, so NO insert/update/delete policies
-- exist — the deploy script writes as the service role, which bypasses RLS.

create table if not exists public.otto_recipes (
  id text primary key,
  canonical jsonb not null,
  provenance jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.otto_recipes enable row level security;

drop policy if exists "otto_recipes_read_all" on public.otto_recipes;
create policy "otto_recipes_read_all" on public.otto_recipes
  for select to anon, authenticated
  using (true);
