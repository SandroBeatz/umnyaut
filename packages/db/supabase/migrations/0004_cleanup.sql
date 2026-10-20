-- 0004_cleanup: daily retention job (server-api-and-data.md, tech spec §16).
--   * projects unopened for 12 months (project_opens go with them);
--   * error reports older than a year;
--   * rate-limit windows older than a day: they key on salted IP hashes, kept a day (tech spec §16); the longest
--     window is an hour.

create function public.cleanup()
returns void
language sql
security invoker
set search_path = ''
as $$
  delete from public.projects where last_opened_at < now() - interval '12 months';
  delete from public.error_reports where created_at < now() - interval '1 year';
  delete from public.rate_limits where window_start < now() - interval '1 day';
$$;

revoke execute on function public.cleanup() from public, anon, authenticated;
grant execute on function public.cleanup() to service_role;

-- 03:17 UTC, outside the evening peak in all four countries. Scheduling by name replaces an existing job.
select cron.schedule('umnyaut-cleanup', '17 3 * * *', 'select public.cleanup()');
