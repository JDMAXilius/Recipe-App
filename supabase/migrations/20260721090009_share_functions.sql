-- SECURITY DEFINER functions — the ONLY read/write path for capability-URL
-- data (database.md §RLS stance). Each is keyed on the exact slug/token and
-- returns only the matching row(s); bare table SELECTs stay impossible for
-- anon/authenticated, so share URLs are never enumerable.
--
-- Every function: explicit empty search_path + fully-qualified names,
-- explicit REVOKE (Postgres grants EXECUTE to PUBLIC by default) then
-- explicit GRANT to exactly the roles that need it.
--
-- Status vocabulary returned to clients: 'ok' | 'revoked' | 'missing'.
-- Zero rows = unknown slug/token (client renders 404); 'revoked' = 410.

-- ---------------------------------------------------------------- recipe share
create or replace function public.get_recipe_share(p_slug text)
returns table (status text, recipe jsonb)
language sql
security definer
set search_path = ''
stable
as $$
  select
    case
      when s.revoked_at is not null then 'revoked'
      when r.id is null then 'missing'
      else 'ok'
    end as status,
    case
      when s.revoked_at is not null or r.id is null then null
      -- never leak the owner's user_id to a share-page visitor
      else to_jsonb(r) - 'user_id'
    end as recipe
  from public.recipe_shares s
  left join public.recipes r on r.id = s.recipe_id
  where s.slug = p_slug;
$$;

revoke execute on function public.get_recipe_share(text) from public, anon, authenticated;
grant execute on function public.get_recipe_share(text) to anon, authenticated, service_role;

-- ------------------------------------------------------------------ list share
create or replace function public.get_list_share(p_token text)
returns table (status text, payload jsonb)
language sql
security definer
set search_path = ''
stable
as $$
  select
    case when s.revoked_at is not null then 'revoked' else 'ok' end as status,
    case when s.revoked_at is not null then null else s.payload end as payload
  from public.list_shares s
  where s.token = p_token;
$$;

revoke execute on function public.get_list_share(text) from public, anon, authenticated;
grant execute on function public.get_list_share(text) to anon, authenticated, service_role;

-- ----------------------------------------------------------------- collab list
-- v1 required auth on every collab route (possession + signed in), so these
-- four are granted to authenticated only — never anon.
create or replace function public.get_collab_list(p_token text)
returns table (status text, token text, is_mine boolean, items jsonb)
language sql
security definer
set search_path = ''
stable
as $$
  select
    case when l.revoked_at is not null then 'revoked' else 'ok' end as status,
    l.token,
    l.owner_user_id = (select auth.uid())::text as is_mine,
    case
      when l.revoked_at is not null then '[]'::jsonb
      else coalesce(
        (select jsonb_agg(to_jsonb(i) order by i.id)
           from public.collab_items i
          where i.token = l.token),
        '[]'::jsonb)
    end as items
  from public.collab_lists l
  where l.token = p_token;
$$;

revoke execute on function public.get_collab_list(text) from public, anon, authenticated;
grant execute on function public.get_collab_list(text) to authenticated, service_role;

-- Input limits mirror v1 validate.js: name 1..200, amount ..60, display 1..40.
create or replace function public.add_collab_item(
  p_token text, p_name text, p_amount text, p_display_name text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := left(btrim(coalesce(p_name, '')), 200);
  v_amount text := nullif(left(btrim(coalesce(p_amount, '')), 60), '');
  v_display text := left(btrim(coalesce(p_display_name, '')), 40);
  v_row public.collab_items;
begin
  if v_name = '' or v_display = '' then
    raise exception 'invalid_input';
  end if;
  perform 1 from public.collab_lists l
    where l.token = p_token and l.revoked_at is null;
  if not found then
    raise exception 'list_not_live';
  end if;
  insert into public.collab_items (token, name, amount, added_by_name)
    values (p_token, v_name, v_amount, v_display)
    returning * into v_row;
  return to_jsonb(v_row);
end;
$$;

revoke execute on function public.add_collab_item(text, text, text, text) from public, anon, authenticated;
grant execute on function public.add_collab_item(text, text, text, text) to authenticated, service_role;

create or replace function public.set_collab_item_checked(
  p_token text, p_id integer, p_checked boolean, p_display_name text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_display text := left(btrim(coalesce(p_display_name, '')), 40);
  v_row public.collab_items;
begin
  if v_display = '' or p_checked is null then
    raise exception 'invalid_input';
  end if;
  perform 1 from public.collab_lists l
    where l.token = p_token and l.revoked_at is null;
  if not found then
    raise exception 'list_not_live';
  end if;
  update public.collab_items i
     set checked = p_checked,
         checked_by_name = case when p_checked then v_display else null end
   where i.token = p_token and i.id = p_id
  returning * into v_row;
  if not found then
    raise exception 'item_not_found';
  end if;
  return to_jsonb(v_row);
end;
$$;

revoke execute on function public.set_collab_item_checked(text, integer, boolean, text) from public, anon, authenticated;
grant execute on function public.set_collab_item_checked(text, integer, boolean, text) to authenticated, service_role;

-- Household trust model: anyone holding the token can erase a line.
create or replace function public.delete_collab_item(p_token text, p_id integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform 1 from public.collab_lists l
    where l.token = p_token and l.revoked_at is null;
  if not found then
    raise exception 'list_not_live';
  end if;
  delete from public.collab_items i
   where i.token = p_token and i.id = p_id;
  return found;
end;
$$;

revoke execute on function public.delete_collab_item(text, integer) from public, anon, authenticated;
grant execute on function public.delete_collab_item(text, integer) to authenticated, service_role;

-- ------------------------------------------------------- account-data deletion
-- One transaction for every owned row (the v1 half-deleted-account bug is the
-- reason this is a single function, not sequential PostgREST deletes).
-- Service-role ONLY — called by the delete-account edge function; the auth
-- user and storage photos are handled there.
create or replace function public.admin_delete_user_data(p_user_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.favorites where user_id = p_user_id;
  delete from public.recipes where user_id = p_user_id;
  delete from public.plan_entries where user_id = p_user_id;
  -- capability URLs outlive the rows they point at — delete outright,
  -- a revoked row would still carry the user_id
  delete from public.recipe_shares where user_id = p_user_id;
  delete from public.list_shares where user_id = p_user_id;
  -- owned collab lists die with their owner (no member registry to hand
  -- them to); lists merely joined belong to someone else and are untouched
  delete from public.collab_items i
   using public.collab_lists l
   where i.token = l.token and l.owner_user_id = p_user_id;
  delete from public.collab_lists where owner_user_id = p_user_id;
end;
$$;

revoke execute on function public.admin_delete_user_data(text) from public, anon, authenticated;
grant execute on function public.admin_delete_user_data(text) to service_role;
