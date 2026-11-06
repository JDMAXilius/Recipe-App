-- R0.13, applied 2026-11-06 as 20261106213056 (RLS suite 98/98 on a local
-- stack first): two foundations for Otto changing things for you (1.2).
--
-- 1. AI consent on the account (ADR-0006 amendment, scenario S11). The phone
--    keeps its cached answer; the account copy follows the person to a new
--    phone and covers surfaces with no sheet to ask (Siri, widgets). The
--    answer names the provider: a yes for one provider is not a yes for the
--    next, so a new provider means asking again.
alter table public.profiles
  add column if not exists ai_consent text check (ai_consent in ('granted', 'declined')),
  add column if not exists ai_consent_provider text check (char_length(ai_consent_provider) <= 40),
  add column if not exists ai_consent_at timestamptz;

-- 2. agent_actions: every change Otto makes on someone's behalf, with the
--    inverse that undoes it. Drives Undo and the "Otto did" list. Written by
--    the agent edge function WITH THE PERSON'S TOKEN, so RLS is the boundary;
--    idempotency_key (hash of the model's call) stops a retried call from
--    acting twice. Own rows only; deleted with the account.
create table if not exists public.agent_actions (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  idempotency_key text not null check (char_length(idempotency_key) between 8 and 128),
  action text not null check (char_length(action) between 1 and 64),
  input jsonb not null default '{}'::jsonb check (pg_column_size(input) <= 16384),
  inverse jsonb check (inverse is null or pg_column_size(inverse) <= 16384),
  summary text not null check (char_length(summary) between 1 and 200),
  created_at timestamptz not null default now(),
  undone_at timestamptz,
  unique (user_id, idempotency_key)
);
create index if not exists agent_actions_user_recent on public.agent_actions (user_id, created_at desc);

alter table public.agent_actions enable row level security;
create policy agent_actions_select_own on public.agent_actions
  for select to authenticated using (user_id = (select auth.uid()));
create policy agent_actions_insert_own on public.agent_actions
  for insert to authenticated with check (user_id = (select auth.uid()) and undone_at is null);
-- The only change after the fact is marking it undone.
create policy agent_actions_update_own on public.agent_actions
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
revoke update on public.agent_actions from authenticated;
grant update (undone_at) on public.agent_actions to authenticated;
