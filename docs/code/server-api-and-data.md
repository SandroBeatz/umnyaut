---
version: 1.5
date: 2026-10-21
category: code
---

# Server API and Data

> Version 1.5 · 2026-10-21 · [Code](../code/)

## Overview

The server exists for four jobs only: **saved projects**, the **Telegram webhook**, **AI recognition**, and **error reports** (plus anonymous event counters and a health check). Everything that can be computed or stored on the device stays out of the database.

**The browser never talks to Supabase directly.** All requests go through our route handlers; the Supabase secret key exists only on the server. There are no accounts until the paid master mode (stage 4).

> Status: projects, reports and limits implemented (Phase 7, 2026-10-20); events, Telegram and AI planned. Source: technical spec §9, §11, §16, §17; rooms-and-estimate spec (Р14, short link).

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
- Atomic operations are SQL functions called via `rpc()`: `hit_limit(key, max, window)`, `project_touch(id)`, `event_add(...)`, `cleanup()`; later `ai_usage_add(...)`. `security invoker`, `search_path = ''`.
- **Every function revokes `EXECUTE` from `public, anon, authenticated` and grants it to `service_role`.** `0001_init`'s `alter default privileges in schema public revoke … from public` does not take back the global `EXECUTE` that `PUBLIC` gets on new functions (Postgres applies schema-level default privileges on top of the global ones) — a migration test caught this.
- `projects.data` validated by Zod, capped at 32 KB of compact JSON on the server (the DB check is a looser 64 KB backstop: `jsonb::text` adds a space after every `:` and `,`); contains dimensions, materials, formula versions — no personal data (until master header in stage 3).
- Project id: 8 random chars without look-alikes (`0/O`, `1/l`). Enumeration blocked by read limits.
- Migrations: numbered SQL files (`NNNN_<snake_name>.sql`, created by hand — not `supabase migration new`, which uses timestamps) in `packages/db/supabase/migrations` (Supabase CLI workdir = `packages/db`), applied by Supabase CLI from CI (`deploy.yml` on merge to `main`) and locally with `db:reset`. Baseline `0001_init.sql` enables `pgcrypto` and `pg_cron` and revokes default privileges for `anon`/`authenticated` in `public`. TS types generated from schema and committed.
- Cleanup via `pg_cron` daily: projects unopened for 12 months, error reports > 1 year, expired limit windows.
- Backup: weekly `pg_dump` from GitHub Actions to private storage while on the Free plan.
- Region: Frankfurt. **One** Free project `umnyaut`, used by prod only; local development uses Supabase in Docker; preview/staging run without a DB (see [Environments and CI/CD](../deploy/environments-and-ci.md)).
- Server code accesses the DB **only through `server/db` functions**, so adding `account_id` later is a one-place change.

### Project ownership without accounts

A project is an **estimate snapshot behind a short link** (owner, 2026-10-20; rooms-and-estimate spec Р14). On create the server returns an `editToken` (256 random bits, base64url); the browser stores it in localStorage, the DB stores only its SHA-256. The owner pressing «Ссылка» again refreshes the same link (`PUT`); anyone else with the link only views it — no copy, no «Забрать себе», no autosave. A wrong or missing token answers `404`, like a missing project, so nobody learns that an id exists. Inside Telegram, ownership = Telegram user id (Phase 12).

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
| `PUT /api/projects/[id]` | Refresh by `editToken` (`X-Edit-Token` header) | 60/min |
| `DELETE /api/projects/[id]` | Delete by `editToken` (`X-Edit-Token` header) | 20/h |
| `POST /api/reports` | Error report (with honeypot field) | 5/h |
| `POST /api/e` | Increment anonymous event counter (`sendBeacon`): body `{ event, tool?, country?, source? }`, only `EventMap` names (else 400), unknown tool or country stored as `""`, other fields dropped; `204` | 300/min per IP (memory) |
| `POST /api/ai/label` · `/plan` · `/describe` | AI recognition | Daily per device |
| `POST /api/tg/webhook` | Telegram updates | Secret header |
| `GET, POST /api/tg/calcs` | “My calculations” list / bind project | `initData` signature |
| `GET /api/health` | App + DB check for monitoring and deploy | — |

### API rules

- Request and response bodies validated by Zod. One envelope: `{ ok: true, data }` or `{ ok: false, error: { code, message } }`.
- JSON ≤ 64 KB, read as a stream and cut off past the cap (chunked uploads carry no `Content-Length`); Caddy caps `/api/*` bodies at 4 MB; image ≤ 4 MB (browser downscales beforehand). U+0000 in a body → `400` (Postgres text cannot hold it); a DB check, length or range error → `400 invalid_body`, not `500`.
- Caddy's access log drops `X-Edit-Token`, `Cookie` and `X-Forwarded-For` and masks IPs to the subnet.
- Only same-origin requests: a foreign `Origin` → `403 bad_origin`; a write without `Origin` too (browsers always send it on POST/PUT/DELETE). No session cookies.
- `trailingSlash: true` applies to the API: call `/api/projects/`, `/api/reports/` — without the slash Next answers `308`.
- Error codes: `bad_origin` 403, `invalid_json` / `invalid_body` 400, `too_large` 413, `not_found` 404, `rate_limited` 429 (+ `Retry-After`), `db_unavailable` 503 (no DB: staging, previews), `internal` 500. Messages are English for developers; the UI maps codes to catalog strings. Responses are `Cache-Control: private, no-store`.
- `projects.data` accepts only the current schema (estimate schema 2) on write; older data migrates in the browser.
- Error reports keep the page **path** only (query and hash dropped) and the tool input ≤ 32 KB; a filled honeypot field `website` gets the same `201` and is dropped.
- `/p/[id]` reads the project directly via `server/db`, not via HTTP to its own API.
- One log line per request: path, status, duration. Never IP or project contents.
- Rate limiting: per-minute rules (`GET`, `PUT`) in an in-process fixed-window counter; per-hour rules (create, delete, reports) in Postgres `hit_limit`, so they survive restarts and the blue/green switch. Without a DB every rule falls back to memory. The key is `rule:hash`, where hash = HMAC-SHA256 of the IP with a salt derived from the secret key and the UTC date — never the IP itself (`server/limits`).

## Configuration

`SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `APP_ENV`. Local development uses Supabase in Docker via Supabase CLI. Free plan limits: 500 MB DB, pauses after a week of inactivity (daily health check keeps it awake). Upgrade to Pro ($25/mo) with the first paying user.

## Usage

Anonymous counter (P9.2, P9.3): `track()` (`shared/analytics`) sends every event to `/api/e/` regardless of consent — `navigator.sendBeacon` with a text body (no preflight; the server parses JSON whatever the content type), `fetch(..., { keepalive: true })` when the beacon is refused. Only name, tool, country and source leave the browser; the server adds 1 to today's row via `event_add`. The server's `COUNTED_EVENTS` must equal the `EventMap` names — `api.test.ts` fails `tsc` otherwise. No DB (staging) → `503`, ignored by the beacon.

Sharing flow (estimate, P17.17, `features/estimate-link`):

1. The estimate always lives in localStorage (`entities/estimate`); without a DB «Ссылка» keeps the `#s=` snapshot (Р14).
2. First «Ссылка» or «Отправить» → `POST /api/projects/` with `{ data: snapshotOf(estimate) }` (no totals, drafts, active room) → `{ id, editToken }`, link `/p/<id>/`; `{ estimateId, id, editToken }` goes to localStorage `umnyaut:estimate:link:v1`. Any other failure (no DB, offline, 413, 429) → the `#` link. The link is copied through a `ClipboardItem` built in the tap, so Safari allows it after the network call.
3. «Ссылка» after edits → `PUT /api/projects/<id>/` with the token in `X-Edit-Token` — the same link shows the new snapshot. `404` (deleted, cleaned up, or the token lost) → create a new link.
4. `/p/<id>/` (P7.4) is dynamic SSR, read-only, `noindex, nofollow`, `private, no-store`; `server/pages/loadSharedProject` reads through `server/db` (React `cache()` — page and metadata read once), applies the API read limit and counts the open after the response. Unknown id, no DB or over the limit → 404. The browser migrates the data and renders the same document as `/spisok/prosmotr/`, with «Расчёт обновлён» when a calc was saved with an older formula version.
5. Link preview title from the size of the estimate: «Список покупок: 2 комнаты · 5 расчётов» — never the estimate's name (it may hold a person's name).
6. A reopen counts if > 1 h after the previous open (`project_touch`, run after the response).
7. «Удалить ссылку» shows under the export buttons once this device holds a link for the estimate; a toast asks once («Удалить»), then `DELETE /api/projects/<id>/` with the token. `404` counts as deleted; the saved link is forgotten, so the next «Ссылка» makes a new one.

Data deletion: owner via «Удалить ссылку» (`DELETE /api/projects/[id]`); bot `/forget` removes the Telegram user and unbinds projects; email requests handled manually with the same two operations.

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
| `packages/db/src/types.ts` | DB types (`db:types`; hand-written from 0001–0004 until the local stack runs) |
| `packages/db/src/queries/` | Query functions |
| `packages/db/src/migrations.test.ts` | Migrations on PGlite (Postgres in WASM): RLS, privileges, functions, cleanup — no Docker |
| `apps/web/server/db/` | Server-side DB access (only entry point) |
| `apps/web/server/limits/` | In-memory + Postgres rate limiting |
| `apps/web/server/platform/` | Env, client IP, `after()` |
| `apps/web/server/http/` | Envelope, `ApiError`, Origin check, JSON body cap, `handle()` (limit + one log line) |
| `apps/web/server/api/` | Handlers behind the route files; `api.test.ts` runs them against an in-memory DB |
| `apps/web/app/api/**/route.ts` | Route handlers |
| `apps/web/app/p/[id]/page.tsx` | Saved project page |
