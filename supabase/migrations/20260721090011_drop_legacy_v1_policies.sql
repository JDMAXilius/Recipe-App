-- Drop the broad v1 policies from add_collab_and_share_rls_policies. Postgres
-- ORs permissive policies, so these widened the granular v2 set that landed in
-- 090001–090010:
--   "own recipe shares" (ALL) let a user mint a share for ANOTHER user's recipe
--       — the v2 INSERT/UPDATE ownership check was bypassed via the OR;
--   "own collab items" (ALL) broke collab_items' zero-policy design (direct
--       CRUD bypassing the SECURITY DEFINER functions);
--   "public recipes readable" (SELECT) leaked other users' recipes;
--   the remaining "own X" ALL policies duplicated the v2 owner-only rules.
-- The v2 files' drop-if-exists only matched v2 policy NAMES, so these v1-named
-- policies survived. Drop them by their exact names — v1's server reaches these
-- tables through the Postgres owner role (RLS-exempt), so nothing on main breaks.
drop policy if exists "own favorites" on public.favorites;
drop policy if exists "own recipes" on public.recipes;
drop policy if exists "public recipes readable" on public.recipes;
drop policy if exists "own plan entries" on public.plan_entries;
drop policy if exists "own recipe shares" on public.recipe_shares;
drop policy if exists "own list shares" on public.list_shares;
drop policy if exists "own collab lists" on public.collab_lists;
drop policy if exists "own collab items" on public.collab_items;
drop policy if exists "seed nutrition readable" on public.seed_nutrition;
