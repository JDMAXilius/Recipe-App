-- SB-6: wrap auth.uid() as (select auth.uid()) in RLS policies so Postgres
-- evaluates it once per query instead of once per row (advisor: auth_rls_initplan).
-- Logic is unchanged — only the evaluation plan improves.

drop policy if exists "hm_delete_self" on public.household_members;
create policy "hm_delete_self" on public.household_members
  for delete
  using (user_id = (select auth.uid()));

drop policy if exists "hm_insert_self" on public.household_members;
create policy "hm_insert_self" on public.household_members
  for insert
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from households h
      where h.id = household_members.household_id
        and h.created_by = (select auth.uid())
    )
  );

drop policy if exists "hm_update_self" on public.household_members;
create policy "hm_update_self" on public.household_members
  for update
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and private.is_household_member(household_id)
  );

drop policy if exists "households_insert" on public.households;
create policy "households_insert" on public.households
  for insert
  with check (created_by = (select auth.uid()));

drop policy if exists "households_select" on public.households;
create policy "households_select" on public.households
  for select
  using (
    created_by = (select auth.uid())
    or private.is_household_member(id)
  );
