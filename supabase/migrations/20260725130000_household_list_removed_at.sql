-- When a removal was made, distinct from updated_at (which every check-off
-- bumps). Needed so a future expiry rule (BUILD34 ticket 4b) applies to shared
-- households too, not just personal lists — otherwise the rule silently
-- exempts every household. Applied to prod 2026-07-25 via MCP.
alter table public.household_list_state
  add column if not exists removed_at timestamptz;
