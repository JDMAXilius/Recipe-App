-- D1 (release-readiness): the three household foreign keys had no covering
-- index. This matters most on ACCOUNT DELETION, which is a shipped feature
-- (delete-account cascades through auth.users) — an unindexed FK turns each
-- cascade into a sequential scan. Cheap, zero-risk, do it before testers
-- arrive. Applied to prod 2026-07-25 via MCP.
create index if not exists household_list_state_updated_by_idx
  on public.household_list_state (updated_by);
create index if not exists household_members_user_id_idx
  on public.household_members (user_id);
create index if not exists households_created_by_idx
  on public.households (created_by);
