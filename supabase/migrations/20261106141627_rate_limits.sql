-- Durable rate limits (R0.12): the edge functions' per-user limits used an
-- in-memory Map per isolate (reset on cold start, not shared). One row per
-- key with its recent hit times; the function trims, counts and records in
-- one statement under a row lock. Only the service role may use it: the
-- function refuses any other caller, and the table has RLS on, no policies.
-- Applied 2026-11-06.
create table if not exists public.rate_limits (
  key text primary key check (char_length(key) <= 200),
  hits timestamptz[] not null default '{}'
);
alter table public.rate_limits enable row level security;

create or replace function public.rate_limit_hit(p_key text, p_limit int, p_window_seconds int)
returns boolean
language plpgsql
security definer
set search_path to ''
as $function$
declare
  recent timestamptz[];
begin
  if coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'role', '') <> 'service_role' then
    raise exception 'not allowed';
  end if;
  select coalesce(array(select h from unnest(r.hits) h where h > now() - make_interval(secs => p_window_seconds)), '{}')
    into recent from public.rate_limits r where r.key = p_key for update;
  recent := coalesce(recent, '{}');
  if cardinality(recent) >= p_limit then
    update public.rate_limits set hits = recent where key = p_key;
    return true;
  end if;
  insert into public.rate_limits(key, hits) values (p_key, recent || now())
    on conflict (key) do update set hits = excluded.hits;
  return false;
end;
$function$;
