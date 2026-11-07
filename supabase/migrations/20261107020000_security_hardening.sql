-- Security hardening from the 2026-11-06 audit. PARTLY APPLIED (2026-11-07):
-- done = the invite columns + index (security_hardening_1_invite_columns) and
-- join_household + rotate_invite_code (security_hardening_2_join_and_rotate).
-- NOT YET: remove_household_member, the resolved_ingredients policy drop, the
-- list_shares cap and the recipe-photos limits + delete policy (their applies
-- ask a confirmation). Split into its applied versions once all of it is in.
--
-- 1. resolved_ingredients: the nutrition cache held every name a person typed
--    (private recipes included) and anyone with the public key could read it.
--    Only resolve-nutrition reads it, with the service role. No client policy.
drop policy if exists "resolved_ingredients_read_all" on public.resolved_ingredients;

-- 2. list_shares: an anonymous-readable payload needs a size cap.
alter table public.list_shares drop constraint if exists list_shares_payload_size;
alter table public.list_shares add constraint list_shares_payload_size
  check (octet_length(payload::text) <= 65536) not valid;

-- 3. Kitchen invites: a 6-character code could be guessed with enough free
--    accounts, and a guessed joiner reads the members' recipes and plans.
--    Codes now expire, the owner can issue a new one (10 characters) and remove
--    a member, and failed joins are capped across ALL accounts, not just per
--    account. Old 6-character codes keep working until they expire.
alter table public.households
  add column if not exists invite_expires_at timestamptz not null default (now() + interval '14 days');
alter table public.household_join_attempts add column if not exists ok boolean not null default false;
create index if not exists household_join_attempts_failed_at on public.household_join_attempts (at) where not ok;

create or replace function public.join_household(code text)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  hid uuid;
  tries int;
  failed int;
begin
  if auth.uid() is null then raise exception 'Sign in to join a kitchen'; end if;
  select count(*) into tries from public.household_join_attempts
    where user_id = auth.uid() and at > now() - interval '15 minutes';
  if tries >= 10 then raise exception 'Too many tries. Wait a few minutes and try again.'; end if;
  -- Everyone's wrong guesses together: a swarm of new accounts can't brute-force codes.
  select count(*) into failed from public.household_join_attempts
    where not ok and at > now() - interval '15 minutes';
  if failed >= 100 then raise exception 'Joining is busy right now. Try again in a few minutes.'; end if;

  select id into hid from public.households
    where invite_code = upper(trim(code)) and invite_expires_at > now();
  insert into public.household_join_attempts(user_id, ok) values (auth.uid(), hid is not null);
  if hid is null then return null; end if;
  insert into public.household_members(household_id, user_id)
    values (hid, auth.uid()) on conflict do nothing;
  return hid;
end; $function$;
revoke all on function public.join_household(text) from public, anon;
grant execute on function public.join_household(text) to authenticated;

-- The owner (the kitchen's creator) issues a fresh 10-character code; the old
-- one stops working at once.
create or replace function public.rotate_invite_code()
returns text
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  bytes bytea;
  fresh text := '';
  i int;
  hid uuid;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  select id into hid from public.households where created_by = auth.uid() limit 1;
  if hid is null then raise exception 'Only the person who started the kitchen can do that'; end if;
  bytes := extensions.gen_random_bytes(10);
  for i in 0..9 loop
    fresh := fresh || substr(alphabet, (get_byte(bytes, i) % 32) + 1, 1);
  end loop;
  update public.households set invite_code = fresh, invite_expires_at = now() + interval '14 days' where id = hid;
  return fresh;
end; $function$;
revoke all on function public.rotate_invite_code() from public, anon;
grant execute on function public.rotate_invite_code() to authenticated;

-- The owner removes someone from the kitchen (never themselves: they leave).
create or replace function public.remove_household_member(member uuid)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  hid uuid;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  if member = auth.uid() then raise exception 'Use Leave to leave the kitchen'; end if;
  select id into hid from public.households where created_by = auth.uid() limit 1;
  if hid is null then raise exception 'Only the person who started the kitchen can do that'; end if;
  delete from public.household_members where household_id = hid and user_id = member;
  return found;
end; $function$;
revoke all on function public.remove_household_member(uuid) from public, anon;
grant execute on function public.remove_household_member(uuid) to authenticated;

-- 4. recipe-photos: images only, 10 MB, and people can delete their own.
update storage.buckets
  set file_size_limit = 10485760, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
  where id = 'recipe-photos';
do $$
begin
  drop policy if exists "recipe_photos_delete_own_folder" on storage.objects;
  create policy "recipe_photos_delete_own_folder" on storage.objects
    for delete to authenticated
    using (bucket_id = 'recipe-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
exception
  when insufficient_privilege then
    raise notice 'storage delete policy skipped: create recipe_photos_delete_own_folder in the dashboard (DELETE authenticated, first path segment = auth.uid())';
end $$;
