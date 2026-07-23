-- recipes — user imports/creations. Owner-only CRUD.
-- visibility CHECK uses the v1 values 'private' | 'public'
-- (docs/contracts/database.md §Conventions — live rows contain 'public').

create table if not exists public.recipes (
  id serial primary key,
  user_id text not null,
  source text not null,
  source_url text,
  source_name text,
  title text not null,
  image text,
  category text,
  area text,
  servings integer,
  ingredients jsonb not null default '[]'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  youtube_url text,
  visibility text not null default 'private',
  nutrition jsonb,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- CHECK added separately so it also lands when the table pre-exists (live).
do $$ begin
  alter table public.recipes
    add constraint recipes_visibility_check
    check (visibility in ('private', 'public'));
exception when duplicate_object then null;
end $$;

alter table public.recipes enable row level security;

drop policy if exists "recipes_select_own" on public.recipes;
create policy "recipes_select_own" on public.recipes
  for select to authenticated
  using ((select auth.uid())::text = user_id);

drop policy if exists "recipes_insert_own" on public.recipes;
create policy "recipes_insert_own" on public.recipes
  for insert to authenticated
  with check ((select auth.uid())::text = user_id);

drop policy if exists "recipes_update_own" on public.recipes;
create policy "recipes_update_own" on public.recipes
  for update to authenticated
  using ((select auth.uid())::text = user_id)
  with check ((select auth.uid())::text = user_id);

drop policy if exists "recipes_delete_own" on public.recipes;
create policy "recipes_delete_own" on public.recipes
  for delete to authenticated
  using ((select auth.uid())::text = user_id);
