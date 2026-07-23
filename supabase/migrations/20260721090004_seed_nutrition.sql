-- seed_nutrition — compute-once nutrition cache for seed (TheMealDB) recipes.
-- Named exception (database.md §RLS stance): anon SELECT (public seed data);
-- writes are service-role only, so NO insert/update/delete policies exist —
-- the service role bypasses RLS.

create table if not exists public.seed_nutrition (
  recipe_id text primary key,
  nutrition jsonb not null,
  computed_at timestamptz not null default now()
);

alter table public.seed_nutrition enable row level security;

drop policy if exists "seed_nutrition_read_all" on public.seed_nutrition;
create policy "seed_nutrition_read_all" on public.seed_nutrition
  for select to anon, authenticated
  using (true);
