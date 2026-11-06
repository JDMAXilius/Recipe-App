-- Household safety (architecture findings A2, A3; release 1.0.24). NOT YET APPLIED:
-- the apply on 2026-11-06 waited on a confirmation that got no answer.
--
-- A2: join_household had no attempt limit, so a signed-in account could walk
-- the 6-character code space. Each call is now counted; more than 10 tries in
-- 15 minutes is refused. A wrong code now returns null (the app says "No
-- kitchen with that code"). Attempts are written only by this SECURITY DEFINER
-- function (RLS on, no policies: no one reads or writes them through the API).
--
-- A3: households.created_by cascades from auth.users, so deleting the
-- creator's account deleted the kitchen for every member. Account deletion
-- (admin_delete_user_data, called by delete-account before the auth user is
-- removed) now hands each kitchen the account created to its longest-standing
-- other member; a kitchen with nobody else in it goes with the account.

create table if not exists public.household_join_attempts (
  user_id uuid not null references auth.users(id) on delete cascade,
  at timestamptz not null default now()
);
create index if not exists household_join_attempts_user_at_idx
  on public.household_join_attempts (user_id, at);
alter table public.household_join_attempts enable row level security;

create or replace function public.join_household(code text)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  hid uuid;
  tries int;
begin
  if auth.uid() is null then raise exception 'Sign in to join a kitchen'; end if;
  delete from public.household_join_attempts where at < now() - interval '1 day';
  select count(*) into tries from public.household_join_attempts
    where user_id = auth.uid() and at > now() - interval '15 minutes';
  if tries >= 10 then raise exception 'Too many tries. Wait a few minutes and try again.'; end if;
  insert into public.household_join_attempts(user_id) values (auth.uid());

  -- A wrong code RETURNS null rather than raising: an exception would roll
  -- back the attempt row above, and failed guesses are what must be counted.
  select id into hid from public.households where invite_code = upper(trim(code));
  if hid is null then return null; end if;
  insert into public.household_members(household_id, user_id)
    values (hid, auth.uid()) on conflict do nothing;
  return hid;
end; $function$;

revoke execute on function public.join_household(text) from public, anon;
grant execute on function public.join_household(text) to authenticated;

create or replace function public.admin_delete_user_data(p_user_id text)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  uid uuid := p_user_id::uuid;
begin
  delete from public.favorites where user_id = p_user_id;
  delete from public.recipes where user_id = p_user_id;
  delete from public.plan_entries where user_id = p_user_id;
  delete from public.recipe_shares where user_id = p_user_id;
  delete from public.list_shares where user_id = p_user_id;

  -- A3: a kitchen outlives its creator when anyone else is in it.
  update public.households h
     set created_by = (
       select m.user_id from public.household_members m
        where m.household_id = h.id and m.user_id <> uid
        order by m.joined_at limit 1)
   where h.created_by = uid
     and exists (select 1 from public.household_members m
                  where m.household_id = h.id and m.user_id <> uid);
  delete from public.household_members where user_id = uid;
  delete from public.households where created_by = uid; -- kitchens nobody else is in
end;
$function$;
