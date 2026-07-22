-- recipe_shares — public share links. Capability URLs: the slug is a CSPRNG
-- token, never enumerable.
-- Named exception (database.md §RLS stance): NO anon table SELECT — a table
-- policy cannot express "must know the slug"; anon reads go ONLY through the
-- SECURITY DEFINER function get_recipe_share(slug) (20260721090009).
-- Writes are owner-only via RLS. INSERT additionally requires the shared
-- recipe to belong to the sharer (v1 minted shares only for owned recipes).

create table if not exists public.recipe_shares (
  slug text primary key,
  recipe_id integer not null,
  user_id text not null,
  created_at timestamp default now(),
  revoked_at timestamp
);

alter table public.recipe_shares enable row level security;

drop policy if exists "recipe_shares_select_own" on public.recipe_shares;
create policy "recipe_shares_select_own" on public.recipe_shares
  for select to authenticated
  using ((select auth.uid())::text = user_id);

drop policy if exists "recipe_shares_insert_own" on public.recipe_shares;
create policy "recipe_shares_insert_own" on public.recipe_shares
  for insert to authenticated
  with check (
    (select auth.uid())::text = user_id
    and exists (
      select 1 from public.recipes r
      where r.id = recipe_id and r.user_id = (select auth.uid())::text
    )
  );

drop policy if exists "recipe_shares_update_own" on public.recipe_shares;
create policy "recipe_shares_update_own" on public.recipe_shares
  for update to authenticated
  using ((select auth.uid())::text = user_id)
  with check ((select auth.uid())::text = user_id);

drop policy if exists "recipe_shares_delete_own" on public.recipe_shares;
create policy "recipe_shares_delete_own" on public.recipe_shares
  for delete to authenticated
  using ((select auth.uid())::text = user_id);
