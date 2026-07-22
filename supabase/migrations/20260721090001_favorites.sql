-- favorites — saved seed recipes (paw). Owner-only CRUD.
-- docs/contracts/database.md §RLS stance: default owner-only, INSERT forces user_id.
-- Idempotent: the live project (mepzfdefanfpnrvydyty) already holds this table;
-- CREATE IF NOT EXISTS + drop/recreate policies makes apply safe either way.

create table if not exists public.favorites (
  id serial primary key,
  user_id text not null,
  recipe_id integer not null,
  title text not null,
  image text,
  cook_time text,
  servings text,
  category text,
  created_at timestamp default now()
);

alter table public.favorites enable row level security;

drop policy if exists "favorites_select_own" on public.favorites;
create policy "favorites_select_own" on public.favorites
  for select to authenticated
  using ((select auth.uid())::text = user_id);

drop policy if exists "favorites_insert_own" on public.favorites;
create policy "favorites_insert_own" on public.favorites
  for insert to authenticated
  with check ((select auth.uid())::text = user_id);

drop policy if exists "favorites_update_own" on public.favorites;
create policy "favorites_update_own" on public.favorites
  for update to authenticated
  using ((select auth.uid())::text = user_id)
  with check ((select auth.uid())::text = user_id);

drop policy if exists "favorites_delete_own" on public.favorites;
create policy "favorites_delete_own" on public.favorites
  for delete to authenticated
  using ((select auth.uid())::text = user_id);
