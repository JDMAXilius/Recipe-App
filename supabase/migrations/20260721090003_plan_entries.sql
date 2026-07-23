-- plan_entries — Otto's week planner rows. Owner-only CRUD.

create table if not exists public.plan_entries (
  id serial primary key,
  user_id text not null,
  day date not null,
  recipe_id text, -- "52772" (seed) or "u-12" (user); null = note-only row
  title text not null,
  image text,
  category text,
  note text,
  cooked boolean not null default false,
  created_at timestamp default now()
);

alter table public.plan_entries enable row level security;

drop policy if exists "plan_entries_select_own" on public.plan_entries;
create policy "plan_entries_select_own" on public.plan_entries
  for select to authenticated
  using ((select auth.uid())::text = user_id);

drop policy if exists "plan_entries_insert_own" on public.plan_entries;
create policy "plan_entries_insert_own" on public.plan_entries
  for insert to authenticated
  with check ((select auth.uid())::text = user_id);

drop policy if exists "plan_entries_update_own" on public.plan_entries;
create policy "plan_entries_update_own" on public.plan_entries
  for update to authenticated
  using ((select auth.uid())::text = user_id)
  with check ((select auth.uid())::text = user_id);

drop policy if exists "plan_entries_delete_own" on public.plan_entries;
create policy "plan_entries_delete_own" on public.plan_entries
  for delete to authenticated
  using ((select auth.uid())::text = user_id);
