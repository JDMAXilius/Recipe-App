-- resolved_ingredients — durable AI-resolver cache (name → USDA food row).
-- Named exception (database.md §RLS stance): anon read, service-role write.
-- No insert/update/delete policies — only the resolve-nutrition edge function
-- (service role, bypasses RLS) writes here.

create table if not exists public.resolved_ingredients (
  id serial primary key,
  name text not null unique,
  food jsonb,
  tier text not null, -- "table" | "usda-search" | "miss"
  resolved_at timestamp default now()
);

alter table public.resolved_ingredients enable row level security;

drop policy if exists "resolved_ingredients_read_all" on public.resolved_ingredients;
create policy "resolved_ingredients_read_all" on public.resolved_ingredients
  for select to anon, authenticated
  using (true);
