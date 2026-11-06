-- A3: households.created_by cascades from auth.users, so deleting a kitchen's
-- creator deleted it for every member. Account deletion (admin_delete_user_data,
-- called by delete-account before the auth user goes) now hands a shared
-- kitchen to its longest-standing other member; a kitchen nobody else is in
-- goes with the account.
-- NOT YET APPLIED: the apply waits on a confirmation (the function body
-- deletes rows) that never reached Juan. Run it from the SQL editor, then
-- rename this file to the version Supabase records.
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

  update public.households h
     set created_by = (
       select m.user_id from public.household_members m
        where m.household_id = h.id and m.user_id <> uid
        order by m.joined_at limit 1)
   where h.created_by = uid
     and exists (select 1 from public.household_members m
                  where m.household_id = h.id and m.user_id <> uid);
  delete from public.household_members where user_id = uid;
  delete from public.households where created_by = uid;
end;
$function$;
