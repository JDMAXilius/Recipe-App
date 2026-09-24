-- SB-6 (part 2): merge the two permissive SELECT policies on plan_entries and
-- recipes into one each. private.shares_household() always returns false when
-- auth.uid() is null (anon), so the anon-facing "household_read" policy never
-- actually granted anon anything — merging into one authenticated-only policy
-- is equivalent, not a narrowing, and clears the multiple_permissive_policies
-- advisor warning.

drop policy if exists "plan_entries_select_own" on public.plan_entries;
drop policy if exists "plan_entries_household_read" on public.plan_entries;
create policy "plan_entries_select" on public.plan_entries
  for select to authenticated
  using (
    (select auth.uid())::text = user_id
    or private.shares_household(user_id::uuid)
  );

drop policy if exists "recipes_select_own" on public.recipes;
drop policy if exists "recipes_household_read" on public.recipes;
create policy "recipes_select" on public.recipes
  for select to authenticated
  using (
    (select auth.uid())::text = user_id
    or private.shares_household(user_id::uuid)
  );
