---
version: 1.2
date: 2026-10-08
category: code
---

# Server API and Data

> Version 1.2 · 2026-10-08 · [Code](../code/)

## Overview

The server exists for four jobs only: **saved projects**, the **Telegram webhook**, **AI recognition**, and **error reports** (plus anonymous event counters and a health check). Everything that can be computed or stored on the device stays out of the database.

**The browser never talks to Supabase directly.** All requests go through our route handlers; the Supabase secret key exists only on the server. There are no accounts until the paid master mode (stage 4).

> Status: planned. Source: technical spec §9, §11, §16, §17.

## Architecture

### Tables (until paid master mode)

| Table | Key fields | Purpose |
|---|---|---|
| `projects` | `id` (8 chars), `data jsonb`, `schema_version`, `country`, `edit_token_hash`, `tg_user_id`, `created_at`, `updated_at`, `last_opened_at` | Saved projects and calculations |
| `project_opens` | `project_id`, `day`, `count` | Return metric (reopened within 7 days) |
| `tg_users` | `id` (Telegram id), `country`, `created_at`, `last_seen_at` | Owners of “My calculations”. No name/username stored |
| `ai_usage` | `subject`, `feature`, `day`, `count`, `cost_microusd` | Daily limits and monthly AI ceiling |
| `rate_limits` | `key`, `window_start`, `count` | Daily API limits |
| `events_daily` | `day`, `event`, `tool`, `country`, `source`, `count` | Anonymous event totals (north-star metric independent of cookie consent) |
| `error_reports` | `tool`, `tool_version`, `input jsonb`, `message`, `page_url`, `status`, `created_at` | “Report an error” button |

### Database rules

- **RLS enabled on every table with zero policies** — the public key opens nothing. Server uses the secret key from platform secrets.
- Atomic operations are SQL functions called via `rpc()`: `hit_limit(key, max, window)`, `ai_usage_add(...)`, `project_touch(id)`.
- `projects.data` validated by Zod, capped at 32 KB; contains dimensions, materials, formula versions — no personal data (until master header in stage 3).
- Project id: 8 random chars without look-alikes (`0/O`, `1/l`). Enumeration blocked by read limits.
- Migrations: numbered SQL files (`NNNN_<snake_name>.sql`, created by hand — not `supabase migration new`, which uses timestamps) in `packages/db/supabase/migrations` (Supabase CLI workdir = `packages/db`), applied by Supabase CLI from CI (`deploy.yml` on merge to `main`) and locally with `db:reset`. Baseline `0001_init.sql` enables `pgcrypto` and `pg_cron` and revokes default privileges for `anon`/`authenticated` in `public`. TS types generated from schema and committed.
- Cleanup via `pg_cron` daily: projects unopened for 12 months, error reports > 1 year, expired limit windows.
- Backup: weekly `pg_dump` from GitHub Actions to private storage while on the Free plan.
- Region: Frankfurt. **One** Free project `umnyaut`, used by prod only; local development uses Supabase in Docker; preview/staging run without a DB (see [Environments and CI/CD](../deploy/environments-and-ci.md)).
- Server code accesses the DB **only through `server/db` functions**, so adding `account_id` later is a one-place change.

### Project ownership without accounts

On create the server returns an `editToken`; the browser stores it in localStorage, the DB stores only its hash. Anyone with the link can view and “Save as my own” (creates a copy). Inside Telegram, ownership = Telegram user id.

### Project data

```ts
interface ProjectData {
  schemaVersion: 1;
  title?: string;
  country: 'RU' | 'KZ' | 'BY' | 'KG';
  rooms: ProjectRoom[];                 // exactly one in v1
  master?: MasterSheet;                 // light master mode, stage 3 — reserve the field now
}
interface ProjectRoom { id: string; name: string; room: Room; works: ProjectWork[] }
interface ProjectWork {
  tool: ToolId;
  toolVersion: number;                  // formula version at save time
  input: Record<string, unknown>;       // only non-default fields
  prices?: Record<string, number>;      // pack price by item key
}
```

Only **input** is stored; results are recomputed on every open so formula fixes reach old projects. Schema migrations live in `packages/calc/project`; the server returns data as-is, the browser migrates on open.

### Route handlers

| Method & path | Does | Limit |
|---|---|---|
| `POST /api/projects` | Create project → `id`, `editToken` | 20/h per IP |
| `GET /api/projects/[id]` | Return project, mark open | 120/min per IP |
| `PUT /api/projects/[id]` | Update by `editToken` | 60/min |
| `DELETE /api/projects/[id]` | Delete by `editToken` | 20/h |
| `POST /api/projects/[id]/copy` | Copy for a new owner | 20/h |
| `POST /api/reports` | Error report (with honeypot field) | 5/h |
| `POST /api/e` | Increment anonymous event counter (`sendBeacon`) | 300/min per IP |
| `POST /api/ai/label` · `/plan` · `/describe` | AI recognition | Daily per device |
| `POST /api/tg/webhook` | Telegram updates | Secret header |
| `GET, POST /api/tg/calcs` | “My calculations” list / bind project | `initData` signature |
| `GET /api/health` | App + DB check for monitoring and deploy | — |

### API rules

- Request and response bodies validated by Zod. One envelope: `{ ok: true, data }` or `{ ok: false, error: { code, message } }`.
- JSON ≤ 64 KB; image ≤ 4 MB (browser downscales beforehand).
- Only same-origin requests (`Origin` header check). No session cookies.
- `/p/[id]` reads the project directly via `server/db`, not via HTTP to its own API.
- One log line per request: path, status, duration. Never IP or project contents.
- Rate limiting: in-process counter (bursts) + Postgres counters (daily). IPs stored only as salted daily hash.

## Configuration

`SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `APP_ENV`. Local development uses Supabase in Docker via Supabase CLI. Free plan limits: 500 MB DB, pauses after a week of inactivity (daily health check keeps it awake). Upgrade to Pro ($25/mo) with the first paying user.

## Usage

Saving flow (planner):

1. Draft always in localStorage `umnyaut:planner:draft`.
2. First “Save” → `POST /api/projects` → link `/p/<id>`; afterwards autosave with 2 s debounce via `PUT`.
3. `/p/<id>` is SSR with the shopping list; owner (has `editToken`) gets edit mode, others get view + “Save as my own”.
4. Link preview title from dimensions: “Список покупок: комната 19,8 м²” — never names/phones.
5. A reopen counts if > 1 h after the previous open.

Data deletion: owner via `DELETE /api/projects/[id]`; bot `/forget` removes the Telegram user and unbinds projects; email requests handled manually with the same two operations.

Later stages add without restructuring: `accounts`, `price_lists`, `clients`, `subscriptions`, `projects.account_id` (stage 4, Supabase Auth with email OTP; httpOnly session cookie, still no browser→DB), `payments` (behind `PaymentProvider`), `widgets`, `ai_credits`.

## Cross-references

- [Architecture Overview](../architecture/overview.md) — server-only boundary, platform layer
- [Calculation Engine](../code/calc-engine.md) — `Room`, `mergeItems`, tool versions
- [Telegram Bot](../integrations/telegram-bot.md) — webhook and `initData` auth
- [AI Vision](../integrations/ai-vision.md) — `/api/ai/*` pipeline and `ai_usage`
- [SEO and Analytics](../business/seo-and-analytics.md) — `events_daily`
- [Environments and CI/CD](../deploy/environments-and-ci.md) — migrations in CI, backups
- Skill spec: [db-migration](../skills/db-migration.md); agent spec: [platform-engineer](../agents/platform-engineer.md)

## File Structure

| Path | Description |
|---|---|
| `packages/db/supabase/migrations/NNNN_*.sql` | Numbered migrations |
| `packages/db/supabase/config.toml` | Local stack config (`pnpm --filter @umnyaut/db db:start`; auth, storage, realtime off) |
| `packages/db/src/types.ts` | Generated DB types |
| `packages/db/src/queries/` | Query functions |
| `apps/web/server/db/` | Server-side DB access (only entry point) |
| `apps/web/server/limits/` | In-memory + Postgres rate limiting |
| `apps/web/server/platform/` | Env, client IP, `after()` |
| `apps/web/app/api/**/route.ts` | Route handlers |
| `apps/web/app/p/[id]/page.tsx` | Saved project page |
