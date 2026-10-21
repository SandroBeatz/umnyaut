-- 0005_rls_auto_enable_revoke: Supabase's `rls_auto_enable()` (the `ensure_rls` event trigger that turns RLS on for
-- new tables) is SECURITY DEFINER in `public` and executable by everyone, so it shows in the API as
-- `/rest/v1/rpc/rls_auto_enable` (advisor lints 0028/0029). The event trigger keeps working without EXECUTE grants;
-- only the API roles lose it. The function is created by the platform, not by our migrations: skip where it is absent.

do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end
$$;
