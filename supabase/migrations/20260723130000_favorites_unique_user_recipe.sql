-- favorites had no uniqueness on (user_id, recipe_id): a re-save inserted a
-- duplicate row (the insertFavorite "re-save is a no-op" comment was aspirational).
-- No duplicates exist today; add the constraint so the idempotent upsert
-- (insertFavorite → upsert onConflict ignoreDuplicates) holds.
alter table public.favorites
  add constraint favorites_user_recipe_unique unique (user_id, recipe_id);
