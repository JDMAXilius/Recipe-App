-- Security-advisor remediation (linter 0028/0029):
-- (1) Drop dead v1 collab-list RPCs + tables — unused by v2 (present only in the
--     generated types; v2 collaborates via households/household_list_state).
-- (2) Move the two RLS-policy helpers into a private, non-exposed schema so
--     PostgREST cannot serve them via /rest/v1/rpc, while the RLS policies
--     (recreated below) still call them. No behavior change.
-- The remaining flagged functions (get_recipe_share, get_list_share,
-- join_household) are intentional public/authenticated API and are kept.

-- 1. dead v1 collab code -----------------------------------------------------
drop function if exists public.get_collab_list(text);
drop function if exists public.add_collab_item(text, text, text, text);
drop function if exists public.delete_collab_item(text, integer);
drop function if exists public.set_collab_item_checked(text, integer, boolean, text);
drop table if exists public.collab_items;
drop table if exists public.collab_lists;

-- 2. private schema + relocated helpers --------------------------------------
create schema if not exists private;
grant usage on schema private to authenticated, service_role;

create function private.is_household_member(hid uuid)
returns boolean language sql stable security definer set search_path = 'public' as $$
  select exists(
    select 1 from public.household_members
    where household_id = hid and user_id = auth.uid()
  );
$$;

create function private.shares_household(other uuid)
returns boolean language sql stable security definer set search_path = 'public' as $$
  select exists (
    select 1
    from public.household_members me
    join public.household_members them on them.household_id = me.household_id
    where me.user_id = auth.uid() and them.user_id = other
  );
$$;

revoke execute on function private.is_household_member(uuid) from public;
revoke execute on function private.shares_household(uuid) from public;
grant execute on function private.is_household_member(uuid) to authenticated, service_role;
grant execute on function private.shares_household(uuid) to authenticated, service_role;

-- 3. recreate the 6 dependent policies to use the private helpers ------------
drop policy hls_all on public.household_list_state;
create policy hls_all on public.household_list_state for all
  using (private.is_household_member(household_id))
  with check (private.is_household_member(household_id));

drop policy hm_select on public.household_members;
create policy hm_select on public.household_members for select
  using (private.is_household_member(household_id));

drop policy hm_update_self on public.household_members;
create policy hm_update_self on public.household_members for update
  using (user_id = auth.uid())
  with check ((user_id = auth.uid()) and private.is_household_member(household_id));

drop policy households_select on public.households;
create policy households_select on public.households for select
  using ((created_by = auth.uid()) or private.is_household_member(id));

drop policy plan_entries_household_read on public.plan_entries;
create policy plan_entries_household_read on public.plan_entries for select
  using (private.shares_household((user_id)::uuid));

drop policy recipes_household_read on public.recipes;
create policy recipes_household_read on public.recipes for select
  using (private.shares_household((user_id)::uuid));

-- 4. remove the now-unreferenced public helpers ------------------------------
drop function public.is_household_member(uuid);
drop function public.shares_household(uuid);
