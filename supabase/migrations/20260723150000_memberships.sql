-- memberships — server-side Otto Club state, written ONLY by the
-- revenuecat-webhook edge function (service role). Clients read their own row;
-- there are deliberately no client INSERT/UPDATE/DELETE policies — the store
-- (via RevenueCat) is the source of truth, never the app.
-- Active membership = expires_at > now().

create table if not exists public.memberships (
  user_id uuid primary key references auth.users (id) on delete cascade,
  expires_at timestamptz not null,
  product_id text,
  store text,
  environment text, -- SANDBOX | PRODUCTION — never gate prod features on SANDBOX rows
  updated_at timestamptz not null default now()
);

alter table public.memberships enable row level security;

drop policy if exists "memberships_select_own" on public.memberships;
create policy "memberships_select_own" on public.memberships
  for select to authenticated
  using ((select auth.uid()) = user_id);
