-- profiles (R0.4, ADR-0010): food preferences on the account, so a new
-- phone keeps them and the first-run answers have a home. One row per user,
-- own row only; deleted with the account. The phone keeps a cache (kv).
-- Applied 2026-11-06. The app syncs it only under flowV2, because allergies
-- on the server change the App Privacy answers.
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  household jsonb not null default '{"adults": 2, "kids": 0}'::jsonb,
  diet text not null default 'none' check (diet in ('none', 'vegetarian', 'vegan')),
  allergies text[] not null default '{}' check (cardinality(allergies) <= 9),
  skips text[] not null default '{}' check (cardinality(skips) <= 12),
  cuisines text[] not null default '{}' check (cardinality(cuisines) <= 20),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
create policy profiles_select_own on public.profiles
  for select to authenticated using (user_id = (select auth.uid()));
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy profiles_update_own on public.profiles
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
