COMMENT ON FUNCTION public.get_list_share(text) IS
  'SECURITY DEFINER by design: resolves a shared shopping-list token for an '
  'anonymous or signed-in visitor who received a share link. Validates the '
  'token internally (checks revocation) and returns only the list snapshot '
  'stored in list_shares.payload, which never contains the owner''s user_id. '
  'Callable by anon and authenticated intentionally; do not revoke EXECUTE.';
