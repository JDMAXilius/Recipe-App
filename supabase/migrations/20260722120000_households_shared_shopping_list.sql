-- Households: a small group that shares a shopping list. Applied via MCP on
-- 2026-07-22; recorded here for repo history.
create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Our kitchen',
  invite_code text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text,
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create table if not exists public.household_list_state (
  household_id uuid not null references public.households(id) on delete cascade,
  item_key text not null,
  checked boolean not null default false,
  custom_name text,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (household_id, item_key)
);

create or replace function public.is_household_member(hid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists(
    select 1 from public.household_members
    where household_id = hid and user_id = auth.uid()
  );
$$;

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_list_state enable row level security;

create policy households_select on public.households for select
  using (created_by = auth.uid() or public.is_household_member(id));
create policy households_insert on public.households for insert
  with check (created_by = auth.uid());

create policy hm_select on public.household_members for select
  using (public.is_household_member(household_id));
create policy hm_insert_self on public.household_members for insert
  with check (user_id = auth.uid());
create policy hm_update_self on public.household_members for update
  using (user_id = auth.uid());
create policy hm_delete_self on public.household_members for delete
  using (user_id = auth.uid());

create policy hls_all on public.household_list_state for all
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

create or replace function public.join_household(code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare hid uuid;
begin
  select id into hid from public.households where invite_code = upper(trim(code));
  if hid is null then raise exception 'No kitchen with that code'; end if;
  insert into public.household_members(household_id, user_id)
    values (hid, auth.uid()) on conflict do nothing;
  return hid;
end; $$;

alter publication supabase_realtime add table public.household_list_state;
alter publication supabase_realtime add table public.household_members;
