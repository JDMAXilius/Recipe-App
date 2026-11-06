-- A2 part 1 (architecture findings, release 1.0.24): where join attempts are
-- counted. Written only by join_household (SECURITY DEFINER); RLS on with no
-- policies, so nobody reads or writes it through the API. Applied 2026-11-06.
create table if not exists public.household_join_attempts (
  user_id uuid not null references auth.users(id) on delete cascade,
  at timestamptz not null default now()
);
create index if not exists household_join_attempts_user_at_idx
  on public.household_join_attempts (user_id, at);
alter table public.household_join_attempts enable row level security;
