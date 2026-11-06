-- app_events (R0.8, docs/product/TRACKING_PLAN.md): first-party product
-- events, no SDK. RLS: a signed-in user may insert their own rows; with no
-- other policy, clients can't read, change or delete any. Rows go with the
-- account (on delete cascade). Applied 2026-11-06.
create table if not exists public.app_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id text not null check (char_length(device_id) between 8 and 64),
  name text not null check (name ~ '^[a-z][a-z0-9_]{2,40}$'),
  props jsonb not null default '{}'::jsonb check (octet_length(props::text) <= 2048),
  app_version text check (app_version is null or char_length(app_version) <= 32),
  occurred_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists app_events_user_created_idx on public.app_events (user_id, created_at);
create index if not exists app_events_name_created_idx on public.app_events (name, created_at);

alter table public.app_events enable row level security;
create policy app_events_insert_own on public.app_events
  for insert to authenticated
  with check (user_id = (select auth.uid()));
