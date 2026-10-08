---
name: db-migration
description: Create an UmnyAut Supabase Postgres migration that follows project data rules — numbered SQL file in packages/db/supabase/migrations, RLS enabled with zero policies, atomic ops as SQL functions, backward compatible, regenerated TS types and a server/db query function. Use when the user asks «добавь таблицу …», "create a migration for project_opens", "add column account_id to projects", "new SQL function hit_limit". Do NOT use for read-only data queries, changes to the ProjectData JSON shape only (that is a TS schema migration in packages/calc/project), or Supabase dashboard settings.
---

# DB Migration

Keeps “the browser never touches the DB” true as the schema grows. Source spec: `docs/skills/db-migration.md` (v1.0). Tables and rules: `docs/code/server-api-and-data.md`. Load the `supabase:supabase` skill for Supabase specifics; delegate larger changes to the `platform-engineer` agent if available.

## Outputs

- `packages/db/supabase/migrations/NNNN_<snake_name>.sql` (create by hand with the next number; `supabase migration new` would use a timestamp)
- Regenerated `packages/db/src/types.ts`
- Updated/added function in `packages/db/src/queries/` and caller in `apps/web/server/db/`
- API test against local Supabase if behaviour changed

## Workflow

1. Read existing migrations → next sequential number and current schema. **Never edit an applied migration.**
2. Write SQL:
   - `create table …;` then `alter table … enable row level security;` — **no `create policy`, ever.**
   - Indexes for lookup keys.
   - Atomic counters/limits as functions (`security definer`, `set search_path = ''`, fully qualified names), called via `rpc()`.
3. **Backward compatible**: additive in one release (nullable column → backfill → enforce in a later migration). The previous app image must run on the new schema (rollback = previous image).
4. **Retention**: unbounded tables get a `pg_cron` cleanup job (projects unopened 12 months, error reports > 1 year, expired limit windows).
5. **Personal data**: if the change stores names, phones or similar — stop and flag it (needs the lawyer's answer before stage 3; `master` block is kept separable).
6. Apply locally (`pnpm --filter @umnyaut/db db:start`, then `pnpm --filter @umnyaut/db db:reset`), regenerate types (`pnpm --filter @umnyaut/db db:types`), update query functions, run API tests and `tsc`.
7. Optionally run Supabase advisors (security/performance) on **dev only** and report.
8. Never apply to the Supabase project from here — it is the prod DB; CI applies migrations on merge to `main`.

## Acceptance checklist

- [ ] Every new table has RLS enabled and zero policies
- [ ] Next sequential file number; earlier files untouched
- [ ] Types regenerated and committed; typecheck passes
- [ ] Change is additive/backward compatible, or explicitly justified
