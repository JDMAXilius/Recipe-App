-- recipe-photos storage bucket — policies like tables get policies
-- (security-builder doctrine). Photos live at `${userId}/${timestamp}.${ext}`,
-- so ownership is the first path segment.
-- Public bucket (recipe images render in shares and cards); INSERT only into
-- your own folder; NO user-facing UPDATE/DELETE — cleanup is service-role
-- only, via the delete-account edge function (v1 decision, kept).
--
-- FAIL-SOFT: on hosted projects `storage.objects` is owned by
-- supabase_storage_admin, so the migration-runner role (postgres) cannot
-- CREATE/DROP POLICY on it — a raw statement would ERROR and abort the whole
-- migration chain, leaving history half-applied (refuter finding, M2). We wrap
-- the policy work in a DO block that swallows insufficient_privilege and raises
-- a NOTICE instead. If it's skipped, the terminal creates these two policies
-- via the dashboard/Storage API (documented in the ticket 02 report-back).

insert into storage.buckets (id, name, public)
values ('recipe-photos', 'recipe-photos', true)
on conflict (id) do nothing;

do $$
begin
  drop policy if exists "recipe_photos_public_read" on storage.objects;
  create policy "recipe_photos_public_read" on storage.objects
    for select to anon, authenticated
    using (bucket_id = 'recipe-photos');

  drop policy if exists "recipe_photos_insert_own_folder" on storage.objects;
  create policy "recipe_photos_insert_own_folder" on storage.objects
    for insert to authenticated
    with check (
      bucket_id = 'recipe-photos'
      and (storage.foldername(name))[1] = (select auth.uid())::text
    );
exception
  when insufficient_privilege then
    raise notice 'storage.objects policies skipped (owned by supabase_storage_admin) — create them via the dashboard: recipe_photos_public_read (SELECT anon+authenticated), recipe_photos_insert_own_folder (INSERT authenticated, first path segment = auth.uid())';
end $$;
