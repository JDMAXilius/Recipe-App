-- recipe-photos storage bucket — policies like tables get policies
-- (security-builder doctrine). Photos live at `${userId}/${timestamp}.${ext}`,
-- so ownership is the first path segment.
-- Public bucket (recipe images render in shares and cards); INSERT only into
-- your own folder; NO user-facing UPDATE/DELETE — cleanup is service-role
-- only, via the delete-account edge function (v1 decision, kept).

insert into storage.buckets (id, name, public)
values ('recipe-photos', 'recipe-photos', true)
on conflict (id) do nothing;

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
