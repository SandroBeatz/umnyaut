---
version: 1.1
date: 2026-10-09
category: plan
---

# Progress Log

> Version 1.1 · 2026-10-09 · [Plan](../plan/)

## Overview

A dated journal of every finished step on UmnyAut: what was done, where it landed (branch, commit, PR, deploy) and which plan task it closes. The [Development Plan](./development-plan.md) says **what** must be done; this log says **what actually happened and when**, including steps that deviated from the plan or were not in it at all.

The log exists so that anyone — the owner, a new contributor, or an AI agent starting a fresh session — can reconstruct the project's state without reading the whole git history or chat transcripts.

## Rules

1. **Every finished step gets an entry** — code, docs, infra, account setup, a decision. If it changed the project state, it is logged.
2. **Same change set as the work.** The entry is added in the same commit (or PR) as the step itself. Steps with no commit (an account created, a Vercel setting changed) get an entry in the next docs commit.
3. **Tick the plan.** If the step closes a task, tick its checkbox in [development-plan.md](./development-plan.md) in the same change. A partially done task stays unticked; the entry says what is left.
4. **Newest first.** One `###` heading per day (`YYYY-MM-DD`), entries below it in the order they happened.
5. **Deviations are explicit.** If a step was done differently from the plan or the reference docs, the entry has a **Deviation** line saying what differs and whether the docs need updating.
6. **No secrets.** Never paste keys, tokens or passwords — name the store they went into instead.
7. Entries are short: one line of what + a few labelled lines. Details belong in the commit message, PR or reference docs; link to them.

## Data Model

Each entry:

```markdown
- **<Plan ID or —>** <what was done, one line>
  - Where: <branch> · <commit/PR> · <deploy/environment, if any>
  - Notes: <what is left, follow-ups> (optional)
  - Deviation: <how it differs from plan/docs> (optional)
```

- **Plan ID** — task ID from the Development Plan (`P0.2`, `P5.4`), several separated by commas, or `—` for unplanned work.
- **Where** — short commit SHA (7 chars), PR number, and the environment it reached (`staging`, `prod`, `Vercel`).

## Log

### 2026-10-09

- **—** Decision (owner): AI features use an inexpensive **Gemini** model instead of Anthropic. Env `ANTHROPIC_API_KEY`/`ANTHROPIC_BASE_URL` → `GEMINI_API_KEY`/`GEMINI_BASE_URL` (`env.ts`, tests, `.env.example`); SDK `@google/genai` planned for P14.4; tiers fast = Flash-Lite, accurate = Flash, model ids verified at implementation.
  - Where: `feature/phase-2-infra`
  - Notes: Gemini API does not serve RU/BY, so prod (Timeweb, RU) still needs a relay outside RU via `GEMINI_BASE_URL`. Use a billing-enabled project (free-tier data may be used by Google). Account A31 changed to Google AI Studio.
  - Deviation: RU tech spec and AGENTS.md said Anthropic; AGENTS.md, AI vision, architecture, environments, runbook, accounts, dependencies and plan updated; RU spec not.
- **P2.2, P2.6 (partly)** Prod server bought (A06): Timeweb Cloud, Cloud NSK 40 (Novosibirsk, RU), 2 vCPU, 2 GB RAM, 40 GB NVMe, Ubuntu; IP kept out of the repo, goes to `DEPLOY_HOST`. Confirmed split: `develop` → Vercel staging with a plain Next build; `main` → image built in GitHub Actions → GHCR → VPS blue/green, nothing built on the server. Added [Prod Server Runbook](../deploy/prod-server-runbook.md). `bootstrap.sh`: several deploy keys (CI + owner), root by key only (refuses to run without a root key), 2 GB swap. `compose.yml`: `mem_limit: 768m` per slot. Vercel: `apps/web/vercel.json` (Next.js, `noindex`), removed root `vercel.json` and `stub/`.
  - Where: `feature/phase-2-infra`
  - Notes: before merging into `develop` the owner sets Vercel Root Directory `apps/web`, production branch `develop`, `ENABLE_EXPERIMENTAL_COREPACK=1`, `APP_ENV` — likely fix for the failing Vercel deploys (pnpm 12 vs Vercel's default pnpm 10). Server side done the same day: bootstrap ran on Ubuntu 26.04 (password SSH off, `deploy` user with CI key `umnyaut-gha` + owner key, ufw, 2 GB swap, Docker 29.9 + Compose 5.6), `/srv/umnyaut/{.env,web.env}` created, temporary `DOMAIN=129-101-115-71.sslip.io` until DNS; Caddy started with a 503 placeholder and obtained Let's Encrypt certificates. Outbound: GHCR, Docker Hub, Supabase, Telegram, Let's Encrypt OK; Anthropic `403 Request not allowed`. GitHub: environment `prod-vps` (branch `main` only) with `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS`; repo variables `DEPLOY_HOST`, `PROD_URL`. Left: first deploy from `main` + one rollback test, P0.6 for KZ/BY/KG, DNS (P2.8).
  - Deviation: (1) the server is in Russia with 2 GB RAM, while P0.6/A06 planned KZ/KG at 4 GB and a measurement before buying; RU visitors benefit, but Anthropic refuses RU IPs and Telegram Bot API is unreliable from RU — the planned `ANTHROPIC_BASE_URL`/`TELEGRAM_API_ROOT` relay becomes required for Phases 10–12; P0.6 reduces to checking KZ/BY/KG reachability. (2) GitHub environment renamed `production` → `prod-vps` in `deploy.yml`/`backup.yml` (the Vercel integration owns `Production`; names are case-insensitive). (3) `PermitRootLogin prohibit-password` instead of `no` — the deploy user has no sudo, so the owner keeps key-only root for administration.
- **—** Product decision (owner): Qalculator.ru is the primary benchmark competitor. Baseline features such as whole packages, related materials, price, sources, sharing and PDF are parity, not positioning. New promise: «Введите размеры один раз — получите проверенный список покупок для всего ремонта»; H1: «Одна комната — весь список покупок».
  - Where: `feature/phase-2-infra` · documentation change set
  - Notes: Added the benchmark protocol; changed research, formula evidence, SEO/content and roadmap gates; introduced a minimal connected wall list in Phase 6. The 30-tool list is a ranked backlog and 60–80 is a conditional ceiling, not a KPI. P0.5/P0.7/P0.9 remain open until the research records, comparison cases and product copy are implemented.

### 2026-10-08

- **—** Decision (owner): **one** Supabase Free project `umnyaut`, prod only. Local dev uses the Docker stack; preview/staging run without a DB (DB features answer “unavailable on staging” from Phase 7). `db-dev.yml` removed; variables renamed to `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`, `SUPABASE_DB_URL`.
  - Where: `feature/phase-2-infra` · PR #138
  - Deviation: docs planned two projects (`umnyaut-dev`, `umnyaut-prod`); environments, data, accounts docs, plan (P2.7, Phase 7 needs) and platform-engineer agent updated. RU tech spec still says two.
- **P2.1, P2.3, P2.4** Prod Docker image (`apps/web/Dockerfile`: Node 24 alpine, `pnpm fetch` layer, standalone, user `node`, `HEALTHCHECK`, `APP_VERSION`), `GET /api/health/` (`{ ok, data: { version, env, db } }`; DB ping via Supabase REST, `skipped` until configured, 503 on failure; 4 tests), CI `ci.yml` (Biome, guard, Steiger, tsc, tests, build; Docker build + container smoke test incl. invalid-env refusal; infra lint).
  - Where: `feature/phase-2-infra`
  - Notes: the image was not built locally (Docker Desktop did not start); first real build and smoke test passed in CI on PR #138.
  - Open issue: Vercel deployments fail (0 s, before build) since PR #137 — every preview and the `develop` push. Prod on Vercel (`main` = stub) is unaffected. Logs need a Vercel login; likely cause is the new root `package.json` (`packageManager: pnpm@12`, `engines`), fix belongs to P2.6.
- **P2.2, P2.5, P2.7, P2.10 (partly)** Code side done, account/server side open:
  - P2.2 `infra/compose.yml` (Caddy + blue/green slots), `Caddyfile` (TLS, zstd/gzip, `www`→apex, headers, IP-masked logs), `bootstrap.sh`, `deploy.sh deploy|rollback|status`. Left: run on a real VPS (needs P0.6).
  - P2.5 `deploy.yml`: GHCR push on every `main` push; migrate, SSH deploy, smoke test and manual rollback run once repo variables/secrets exist. Left: VPS, secrets, first deploy, one rollback test.
  - P2.7 `supabase init` in `packages/db` (local auth/storage/realtime/edge/analytics off), `0001_init.sql` (`pgcrypto`, `pg_cron`, default privileges revoked from `anon`/`authenticated`), `db:*` scripts. Left: create the Supabase project (A12, A13), set variables/secrets, run the local stack once (needs Docker), generate `src/types.ts`.
  - P2.10 `renovate.json` (monthly, into `develop`, grouped, Node < 25) and `backup.yml` (weekly `pg_dump`, AES-encrypted artifact, 35 days). Left: install the Renovate app (A18), set backup variables/secrets.
  - Deviation: migrations live in `packages/db/supabase/migrations/` (Supabase CLI requires `<workdir>/supabase/migrations`), not `packages/db/migrations` — data doc and `db-migration` skill updated; the RU tech spec still says the old path. The plan's `scheduled.yml` became `backup.yml`; uptime checks stay in Phase 9 (P9.9). Backups are GitHub artifacts encrypted with a passphrase because the repo is public.
- **P1.1–P1.11** Phase 1 monorepo foundation: pnpm 12 workspaces + Turborepo 2.11, Node 24 pin, shared `tooling/{tsconfig,vitest}`, root `biome.json`, package skeletons `@umnyaut/{calc,catalog,ui,db}`, `apps/web` (Next 16.4 standalone, `trailingSlash`, React Compiler, Tailwind 4, FSD folders), `server/platform` (`env.ts` with Zod + tests, `client-ip.ts`, `after.ts`), boundary guard, `.env.example`, Claude permissions, `preflight` skill built. Exit gate passed: `pnpm check` green on a clean clone; importing `server/` from `src/` fails `pnpm guard`, Biome and `next build`.
  - Where: `feature/phase-1-foundation` · PR #137 · merged into `develop` (`8296f1a`)
  - Notes: spike result — TypeScript 7.0.2 works with Next 16.4, Vitest 5 and Steiger 0.7 (recorded in [Dependencies](./dependencies.md)). Vercel still serves `stub/` (root `vercel.json` has empty install/build commands).
  - Deviation: (1) Steiger 0.7 hardcodes FSD layer names and ignores `views`, so layer order (incl. `views`) is enforced by `tooling/scripts/check-boundaries.mjs` (`pnpm guard`) — [Architecture Overview](../architecture/overview.md) updated. (2) No `tooling/biome` package: one `biome.json` at the root is enough. (3) Biome, guard and Steiger run as root scripts, not Turborepo tasks (they scan the whole repo in milliseconds); Turborepo runs `typecheck`, `test`, `build`. (4) `zod` added to `calc`/`catalog` now (plan said Phase 4) so the allowed-deps rule is real from day one. (5) Turborepo 2.11 writes an agent-guidance block into `AGENTS.md`; disabled with `"agentGuidance": false` in `turbo.json`.
- **P0.1** Reset the repo for UmnyAut: removed the old crossword project, added `docs/` (reference docs, skill and agent specs, plan), `AGENTS.md`, `CLAUDE.md`; built skills and agents.
  - Where: `develop` · `1b73084`
- **—** Merged the legacy remote `develop` history into the new tree, keeping only the UmnyAut files, so no force-push is needed.
  - Where: `develop` · `1676307`
- **—** Static staging stub page: `stub/index.html` (design-system tokens, Onest, mascot `hello` in AVIF/WebP, wave-1 tool list, laminate example) served by root `vercel.json` (no build, `outputDirectory: stub`, `X-Robots-Tag: noindex`).
  - Where: `develop` · `f262dca`
  - Notes: delete `stub/` and `vercel.json` when the Next.js app lands (Phase 1–2); then set the Vercel Root Directory to `apps/web`.
- **P0.2 (partly)** Fast-forwarded `main` to `develop` (old crossword code dropped from `main`, history kept) and pushed both branches. Vercel project settings adjusted by the owner; the stub is live.
  - Where: `main` = `develop` = `f262dca` · Vercel (production branch `main`)
  - Notes: P0.2 still open — archive the old remote branch as `legacy/develop` (or decide it is unnecessary now that its history is merged).
  - Deviation: per [Environments and CI/CD](../deploy/environments-and-ci.md), Vercel serves `develop` (staging) and `main` goes to the VPS. Until the VPS exists (P0.6, Phase 2), Vercel deploys from `main`; switch the production branch to `develop` when the VPS pipeline is set up.

## Cross-references

- [Development Plan](./development-plan.md) — the task list and IDs this log references
- [Accounts and Services](./accounts-and-services.md) — account IDs (`A…`) mentioned in entries
- [Environments and CI/CD](../deploy/environments-and-ci.md) — target branch → environment mapping that deviations are measured against
- [Engineering Practices](../practices/engineering-practices.md) — git workflow and commit conventions
