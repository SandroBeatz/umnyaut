-- 0001_init: baseline. No tables yet — they arrive in Phase 7 (P7.1).
-- Project data rules (docs/code/server-api-and-data.md):
--   * RLS enabled on every table with ZERO policies; only the server (secret key) reads or writes.
--   * Atomic operations are SQL functions called via rpc().
--   * Migrations are backward compatible; never edit an applied migration.

-- Random project ids and editToken hashing.
create extension if not exists pgcrypto with schema extensions;

-- Daily cleanup jobs (old projects, error reports, limit windows).
create extension if not exists pg_cron with schema pg_catalog;

-- The browser never talks to Supabase: new tables, functions and sequences in `public`
-- are not reachable by the publishable key roles unless a migration grants it explicitly.
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated, public;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
