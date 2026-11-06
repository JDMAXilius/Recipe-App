-- Recipe size (ADR-0013, three magic moments plan): a recipe makes a batch
-- (yield: 1 loaf) that divides into servings in a natural unit (10 slices).
-- servings stays the count and the only nutrition divisor; these columns add
-- the words. Additive and nullable: existing rows and older app builds are
-- unaffected, and a null size reads as "N servings".
-- NOT APPLIED automatically: apply with Juan's go-ahead, then regenerate
-- src/types/database.ts and turn on EXPO_PUBLIC_FLOW_V2.

alter table public.recipes
  add column if not exists yield_qty numeric
    check (yield_qty is null or (yield_qty > 0 and yield_qty <= 200)),
  add column if not exists yield_unit text
    check (yield_unit is null or char_length(yield_unit) between 1 and 24),
  add column if not exists serving_unit text
    check (serving_unit is null or char_length(serving_unit) between 1 and 24);

comment on column public.recipes.yield_qty is 'Batch size, e.g. 1 (loaf). Null = the batch is just its servings.';
comment on column public.recipes.yield_unit is 'Batch unit, e.g. loaf, pie, tray, pot. Null with yield_qty.';
comment on column public.recipes.serving_unit is 'Unit one serving is counted in, e.g. slice, piece, bowl. Null = serving.';
