---
spec_version: 1.0
date: 2026-10-08
status: built
skill_slug: db-migration
skill_name: DB Migration
targets: [claude-code, codex, universal]
---

# DB Migration — Skill Specification

> Spec v1.0 · 2026-10-08 · status: built · [Skills index](../README.md)

## 1. Purpose

Creates a Supabase Postgres migration that respects the project's data rules: numbered SQL file in `packages/db/supabase/migrations`, RLS enabled with **no policies**, atomic operations as SQL functions, backward compatibility with the previous app version, regenerated TS types, and a query function in `server/db`. Keeps the “browser never touches the DB” guarantee intact as the schema grows.

## 2. When to trigger

Should trigger: «добавь таблицу …», “create a migration for `project_opens`”, “add column `account_id` to projects”, “new SQL function `hit_limit`”.

Should NOT trigger: querying data for analysis (read-only SQL); changing `ProjectData` JSON shape only (that's a `calc/project` schema migration in TS); Supabase dashboard settings.

## 3. Inputs

Description of the change; current migrations; `docs/code/server-api-and-data.md`.

## 4. Outputs

- `packages/db/supabase/migrations/NNNN_<snake_name>.sql` (create the file by hand with the next number; `supabase migration new` would use a timestamp)
- Regenerated `packages/db/src/types.ts`
- Updated/added function in `packages/db/src/queries/` and its caller in `apps/web/server/db/`
- Test against local Supabase if behaviour changed

## 5. Workflow

1. Read existing migrations to get the next number and current schema; never edit an applied migration.
2. Write SQL: `create table … ; alter table … enable row level security;` — **no `create policy`**. Indexes for lookup keys. Atomic counters/limits as `security definer` functions with fixed `search_path`.
3. Backward compatibility: additive changes only in one release (add nullable column, backfill, then enforce in a later migration). Old code must run on the new schema (rollback = previous image).
4. Retention: if the table grows unbounded, add/update the `pg_cron` cleanup job.
5. Personal data check: if the change stores anything personal, stop and flag it (requires the lawyer answer before stage 3).
6. Apply locally (`supabase db reset` / `migration up`), regenerate types, update query functions, run API tests.
7. Optionally run Supabase advisors (security/performance) and report findings.

## 6. Resources

Supabase CLI; Supabase MCP / skill for docs and advisors; `docs/code/server-api-and-data.md`.

## 7. Examples

- “Add `project_opens`” → `0002_project_opens.sql` with PK `(project_id, day)`, RLS on, function `project_touch(id)` incrementing count when > 1 h since last open; types regenerated.
- “Add `account_id` to projects” → nullable uuid column + index; no NOT NULL yet; `server/db/projects.ts` accepts optional account.

## 8. Acceptance criteria

- Every new table has `enable row level security` and zero policies.
- File name is the next sequential number; no edits to earlier files.
- Types regenerated and committed; typecheck passes.
- Change is additive/backward compatible or explicitly justified.

## 9. Target adaptation

### 9.1 Claude Code
`.claude/skills/db-migration/SKILL.md`; may use the Supabase plugin skill for best practices; delegate to `platform-engineer` for larger changes.

### 9.2 Codex / AGENTS.md
`## Skill: db-migration` with the rules list.

### 9.3 Universal
Follow the workflow; verify with the acceptance list.

## 10. Materialization log

| Tool | Location | Built from spec v | Date |
|---|---|---|---|
| claude-code | .claude/skills/db-migration/ | 1.0 | 2026-10-08 |
| codex | AGENTS.md#skill-db-migration | — | — |

## 11. Changelog

- v1.0 — Initial spec from tech spec §9, §15, §16.
