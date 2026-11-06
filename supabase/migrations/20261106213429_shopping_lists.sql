-- R0.11, applied 2026-11-06 as 20261106213429 (RLS suite 104/104 locally): the
-- personal shopping list's state on the account (ticks, extras, dropped
-- dishes, removed rows — the same blob the phone keeps in kv
-- 'shoppingState'). The rows themselves still rebuild from the plan. The phone
-- is the offline truth; under flowV2 every save is mirrored here and a read
-- takes the newer copy, so a new phone gets the list and the agent (1.2) and
-- widgets can read and change it. A shared kitchen's list stays in
-- household_list_state. Own row only; deleted with the account.
create table if not exists public.shopping_lists (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb check (pg_column_size(state) <= 65536),
  saved_at timestamptz not null default now()
);

alter table public.shopping_lists enable row level security;
create policy shopping_lists_select_own on public.shopping_lists
  for select to authenticated using (user_id = (select auth.uid()));
create policy shopping_lists_insert_own on public.shopping_lists
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy shopping_lists_update_own on public.shopping_lists
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
