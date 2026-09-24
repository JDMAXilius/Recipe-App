-- SB-5 (2026-09-24): document why these SECURITY DEFINER functions are
-- intentionally callable by anon/authenticated, so the Supabase advisor
-- warning reads as a known, accepted design rather than an open finding.

COMMENT ON FUNCTION public.get_list_share(text) IS
  'SECURITY DEFINER by design: resolves a shared shopping-list token for an '
  'anonymous or signed-in visitor who received a share link. The function '
  'itself validates the token and returns only that list''s public view '
  '(owner user_id is stripped) — it never exposes arbitrary rows. Callable '
  'by anon and authenticated intentionally; do not revoke EXECUTE.';

COMMENT ON FUNCTION public.get_recipe_share(text) IS
  'SECURITY DEFINER by design: resolves a shared recipe snapshot for an '
  'anonymous or signed-in visitor who received a share link. Validates the '
  'slug internally and returns only that recipe''s public view (owner '
  'user_id is stripped) — it never exposes arbitrary rows. Callable by '
  'anon and authenticated intentionally; do not revoke EXECUTE.';

COMMENT ON FUNCTION public.join_household(text) IS
  'SECURITY DEFINER by design: lets a signed-in user redeem a household '
  'invite code they were given out of band. Validates the code internally '
  'before inserting a household_members row for the caller''s own uid — '
  'it never lets a caller act as anyone else. Callable by authenticated '
  'intentionally; do not revoke EXECUTE.';
