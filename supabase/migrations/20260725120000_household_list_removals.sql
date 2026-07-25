-- Hand-removed rows sync across the household (ticket BUILD34_LIST_SYNC §2).
-- A removal is a row like a check-off is: same (household_id, item_key) upsert,
-- same realtime channel (table already in supabase_realtime), same RLS (the
-- `hls_all` FOR ALL policy covers new columns with no change).
-- `removed_sources` carries the RECIPE IDS the removed amount came from — the
-- same identity the client keeps locally (shoppingList.ts RemovedEntry), fixed
-- to ids BEFORE this migration so title-keying never reaches the schema (4a
-- gate).
alter table public.household_list_state
  add column if not exists removed boolean not null default false,
  add column if not exists removed_sources text[];
