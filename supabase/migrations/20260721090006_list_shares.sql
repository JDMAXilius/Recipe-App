-- list_shares — shopping-list share snapshots ("send my husband the list").
-- Named exception (database.md §RLS stance): NO anon table SELECT — anon
-- reads go ONLY through get_list_share(token) (20260721090009).
-- Owner-only CRUD otherwise; INSERT forces user_id.

create table if not exists public.list_shares (
  token text primary key,
  user_id text not null,
  payload jsonb not null,
  created_at timestamp default now(),
  revoked_at timestamp
);

alter table public.list_shares enable row level security;

drop policy if exists "list_shares_select_own" on public.list_shares;
create policy "list_shares_select_own" on public.list_shares
  for select to authenticated
  using ((select auth.uid())::text = user_id);

drop policy if exists "list_shares_insert_own" on public.list_shares;
create policy "list_shares_insert_own" on public.list_shares
  for insert to authenticated
  with check ((select auth.uid())::text = user_id);

drop policy if exists "list_shares_update_own" on public.list_shares;
create policy "list_shares_update_own" on public.list_shares
  for update to authenticated
  using ((select auth.uid())::text = user_id)
  with check ((select auth.uid())::text = user_id);

drop policy if exists "list_shares_delete_own" on public.list_shares;
create policy "list_shares_delete_own" on public.list_shares
  for delete to authenticated
  using ((select auth.uid())::text = user_id);
