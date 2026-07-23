-- collab_lists + collab_items — household lists (S3). The capability token IS
-- the membership: possession = read/add/check rights, owner can revoke.
-- Named exception (database.md §RLS stance): NO anon table SELECT on either
-- table — bare selects would enumerate every live token. All member access
-- goes through the token-keyed SECURITY DEFINER functions (20260721090009):
--   get_collab_list(token), add_collab_item(...), set_collab_item_checked(...),
--   delete_collab_item(...).
-- collab_lists keeps owner-only RLS so the owner can create and revoke.
-- collab_items has RLS ENABLED and deliberately ZERO policies: no path to an
-- item row except the DEFINER functions (or the service role).

create table if not exists public.collab_lists (
  token text primary key,
  owner_user_id text not null,
  created_at timestamp default now(),
  revoked_at timestamp
);

create table if not exists public.collab_items (
  id serial primary key,
  token text not null,
  name text not null,
  amount text,
  added_by_name text not null,
  checked boolean not null default false,
  checked_by_name text,
  created_at timestamp default now()
);

alter table public.collab_lists enable row level security;
alter table public.collab_items enable row level security;

-- owner-only on collab_lists (create / see own / revoke / delete)
drop policy if exists "collab_lists_select_own" on public.collab_lists;
create policy "collab_lists_select_own" on public.collab_lists
  for select to authenticated
  using ((select auth.uid())::text = owner_user_id);

drop policy if exists "collab_lists_insert_own" on public.collab_lists;
create policy "collab_lists_insert_own" on public.collab_lists
  for insert to authenticated
  with check ((select auth.uid())::text = owner_user_id);

drop policy if exists "collab_lists_update_own" on public.collab_lists;
create policy "collab_lists_update_own" on public.collab_lists
  for update to authenticated
  using ((select auth.uid())::text = owner_user_id)
  with check ((select auth.uid())::text = owner_user_id);

drop policy if exists "collab_lists_delete_own" on public.collab_lists;
create policy "collab_lists_delete_own" on public.collab_lists
  for delete to authenticated
  using ((select auth.uid())::text = owner_user_id);

-- collab_items: RLS on, no policies — intentional (see header comment).
