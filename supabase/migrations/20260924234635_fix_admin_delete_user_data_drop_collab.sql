-- Account deletion was failing in production: admin_delete_user_data still
-- deleted from collab_items/collab_lists, which were dropped when kitchens
-- (households) replaced collab lists. Every delete-account call returned 500
-- with 'relation "public.collab_items" does not exist' (found 2026-09-24 by
-- supabase/migrations/tests/rls-attacks.test.mjs). Kitchens and memberships
-- need no lines here: their rows cascade from auth.users when delete-account
-- drops the login last (households, household_members, memberships ON DELETE
-- CASCADE; household_list_state.updated_by ON DELETE SET NULL).
create or replace function public.admin_delete_user_data(p_user_id text)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
begin
  delete from public.favorites where user_id = p_user_id;
  delete from public.recipes where user_id = p_user_id;
  delete from public.plan_entries where user_id = p_user_id;
  delete from public.recipe_shares where user_id = p_user_id;
  delete from public.list_shares where user_id = p_user_id;
end;
$function$;
