-- Review-swarm fixes (applied via MCP 2026-07-22):
-- (1) plan_entries/recipes RLS was owner-only, so the "shared" shopping list
--     only ever saw the caller's own dishes. Let household co-members read each
--     other's plan + recipes so the aggregation actually aggregates.
-- (2) hm_insert_self only checked user_id = auth.uid(), letting a signed-in user
--     add themselves to ANY household by UUID, bypassing the invite code. Gate
--     self-insert to households you created; all other joins go through the
--     join_household RPC (SECURITY DEFINER, which validates the code).

create or replace function public.shares_household(other uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1
    from public.household_members me
    join public.household_members them on them.household_id = me.household_id
    where me.user_id = auth.uid() and them.user_id = other
  );
$$;
revoke execute on function public.shares_household(uuid) from public;
grant execute on function public.shares_household(uuid) to authenticated;

create policy plan_entries_household_read on public.plan_entries
  for select using (public.shares_household(user_id::uuid));

create policy recipes_household_read on public.recipes
  for select using (public.shares_household(user_id::uuid));

drop policy hm_insert_self on public.household_members;
create policy hm_insert_self on public.household_members for insert
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.households h where h.id = household_id and h.created_by = auth.uid())
  );

drop policy hm_update_self on public.household_members;
create policy hm_update_self on public.household_members for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.is_household_member(household_id));
