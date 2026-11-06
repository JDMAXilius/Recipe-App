-- A2 part 2: a signed-in account could walk the 6-character code space; now
-- at most 10 join tries per 15 minutes. A wrong code RETURNS null instead of
-- raising: an exception would roll back the attempt row, and failed guesses
-- are what must be counted (the app says "No kitchen with that code").
-- Existing grants (authenticated only) are kept by create or replace.
-- Applied 2026-11-06. Old attempt rows are not pruned yet (small, indexed).
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
  select count(*) into tries from public.household_join_attempts
    where user_id = auth.uid() and at > now() - interval '15 minutes';
  if tries >= 10 then raise exception 'Too many tries. Wait a few minutes and try again.'; end if;
  insert into public.household_join_attempts(user_id) values (auth.uid());

  select id into hid from public.households where invite_code = upper(trim(code));
  if hid is null then return null; end if;
  insert into public.household_members(household_id, user_id)
    values (hid, auth.uid()) on conflict do nothing;
  return hid;
end; $function$;
