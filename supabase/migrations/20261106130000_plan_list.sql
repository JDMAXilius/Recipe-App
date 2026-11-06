-- A plan day is an ordered free list (ADR-0013): items in any order, each
-- with an optional label. Additive and nullable: existing rows keep their
-- insert order (position null sorts after positioned rows, see
-- src/features/planner/plan.list.ts) and older app builds are unaffected.
-- NOT APPLIED automatically: apply with Juan's go-ahead, then regenerate
-- src/types/database.ts and turn on EXPO_PUBLIC_FLOW_V2.

alter table public.plan_entries
  add column if not exists position double precision,
  add column if not exists label text
    check (label is null or char_length(label) between 1 and 24),
  add column if not exists kind text not null default 'recipe'
    check (kind in ('recipe', 'food', 'leftover', 'note', 'out'));

-- Leftovers used to be tagged in `note`; carry the tag into `kind`.
update public.plan_entries set kind = 'leftover' where note = 'leftovers' and kind = 'recipe';

create index if not exists plan_entries_user_day_position_idx
  on public.plan_entries (user_id, day, position);

comment on column public.plan_entries.position is 'Fractional order within the day; null = insert order (legacy rows).';
comment on column public.plan_entries.label is 'Optional user label: breakfast, lunch, dinner, snack or their own word.';
comment on column public.plan_entries.kind is 'recipe | food (no recipe, e.g. an apple) | leftover | note | out (eating out).';
