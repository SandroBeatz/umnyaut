---
version: 1.5
date: 2026-10-10
category: deploy
---

# Environments and CI/CD

> Version 1.5 · 2026-10-10 · [Deploy](../deploy/)

## Overview

Production runs in **Docker on a VPS in the CIS** (branch `main`); staging and PR previews run on **Vercel** (branch `develop` + every PR). Because the two differ, the prod Docker image is built and smoke-tested on every PR, and the code uses no Vercel-only APIs.

**Why not Cloudflare / Hetzner / DO / OVH:** since 9 June 2025 Russian ISPs cut connections to Cloudflare after the first 16 KB, and the same report names Hetzner, DigitalOcean and OVH. Russia is the largest market, so prod sits on a CIS VPS chosen by measurement.

> Status: code ready, server bootstrap in progress. Step-by-step setup: [Prod Server Runbook](./prod-server-runbook.md). Source: technical spec §2, §15, §18.

## Architecture

### Environments

| Env | Branch | Runs on | DB | Bot |
|---|---|---|---|---|
| Local | — | `localhost` | Supabase in Docker | Test bot via tunnel |
| Preview | PR | Vercel, URL per PR | none | — |
| Staging | `develop` | Vercel, `staging.umnyaut.com` | none | Test |
| Prod | `main` | VPS, `umnyaut.com` | Supabase `umnyaut` | Prod |

**One database.** There is a single Supabase Free project, used by prod only. Local development runs Supabase in Docker. Preview and staging run **without a DB**: `SUPABASE_*` are unset, `/api/health/` reports `db: skipped`, calculators work fully, and DB features (save project, error report, counters) answer “unavailable on staging” (implemented with the features in Phase 7). Never point staging at the prod DB — test data would mix with real projects and metrics.

Non-prod (`APP_ENV != production`): `X-Robots-Tag: noindex` on all responses, Metrika and own counters off, small AI budget.

### Pipeline (GitHub Actions + GitHub Container Registry)

1. **PR → `develop`**: pnpm install (cached) → Biome, Steiger, `tsc --noEmit` → tests → `next build` → server-HTML guard → Playwright on the CI build (phone viewport) → Docker image build + container smoke test → Lighthouse CI against the Vercel preview (Phase 9).
2. **Merge → `develop`**: Vercel deploys staging (no DB, no migrations).
3. **PR `develop` → `main`**: same checks + manual pass of staging on a real phone.
4. **Merge → `main`**: image tagged with commit SHA pushed to GHCR → migrations applied to the Supabase project → server pulls the image over SSH and starts the new container next to the old → after `/api/health` passes, Caddy switches traffic → external smoke test → IndexNow submission.
5. **Rollback**: one command starts the previous tag — `ssh deploy@<host> /srv/umnyaut/deploy.sh rollback`, or run the **Deploy** workflow manually with `rollback: true`. Migrations are backward compatible so old code runs against the new schema.
6. **Scheduled**: daily uptime check; weekly DB backup and link check in texts; monthly Renovate dependency updates.

Turborepo rebuilds/tests only affected packages: editing a text does not run formula tests.

### Server

| Topic | Decision |
|---|---|
| Size | Timeweb Cloud NSK 40 (Novosibirsk): 2 vCPU, 2 GB RAM, 40 GB NVMe, Ubuntu LTS |
| Composition | Docker Compose: `web-blue`/`web-green` (Next standalone, Node 24, `mem_limit: 768m`) + `caddy`; the Telegram bot is a route of the same app |
| Memory | 2 GB swap (headroom while two slots overlap during a swap) |
| TLS & compression | Caddy auto-certs, gzip + zstd, security headers |
| State | **None on the server.** DB in Supabase, images in registry, config in repo. Rebuild from `infra/` in ~1 h |
| Build | In GitHub Actions, never on the server |
| Access | SSH key only (root by key only), separate `deploy` user with its own CI key, firewall 22/80/443 |
| Updates | Unattended security updates, night reboot window |
| Logs | Rotated container logs; Caddy IP truncated to subnet, 7 days |
| Restart | Docker restarts crashed containers; healthcheck in `compose.yml` |

### Monitoring

External check every 5 min of `/api/health` and a tool page from nodes in Russia and Kazakhstan → Telegram alert. Alerts on < 20% free disk or container restart. One JSON log line per request. Browser errors via `js_error` event; no external error service at launch.

### Security headers

`Content-Security-Policy` (own domain, Metrika, Telegram), `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `frame-ancestors` per route (see UI doc).

## Configuration

Secrets: `APP_ENV`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_API_ROOT`, `GEMINI_API_KEY`, `GEMINI_BASE_URL`, `AI_ENABLED`, `AI_MONTHLY_BUDGET_USD`, `METRIKA_ID`, `INDEXNOW_KEY`.

- Staging: Vercel project settings (Root Directory `apps/web`, production branch `develop`, `ENABLE_EXPERIMENTAL_COREPACK=1` so Vercel uses pnpm 12 from `packageManager`). Prod: env file on the server readable only by the deploy user.
- GitHub Actions configuration (steps are skipped until their variables exist, so workflows stay green before the VPS and Supabase are ready):

| Kind | Name | Used by |
|---|---|---|
| Variable | `SUPABASE_PROJECT_REF` | `deploy.yml` (migrate) |
| Variable | `DEPLOY_HOST`, `PROD_URL` | `deploy.yml` (deploy, smoke test) |
| Variable | `BACKUP_ENABLED` = `true` | `backup.yml` |
| Secret | `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD` | migrations |
| Secret | `DEPLOY_SSH_KEY` (private key of the `deploy` user), `DEPLOY_KNOWN_HOSTS` (`ssh-keyscan <host>`) | `deploy.yml` |
| Secret | `SUPABASE_DB_URL`, `BACKUP_PASSPHRASE` | `backup.yml` |

GHCR uses the built-in `GITHUB_TOKEN`; the server logs in for the pull and logs out right after. The GitHub environment `prod-vps` holds the secrets and can require manual approval (not `Production`: that name belongs to the Vercel integration and GitHub environment names are case-insensitive).
- Repo: only `.env.example`. Zod validates env on startup.

Plans: Vercel Hobby (non-commercial clause — staging has no ads/payments; fallback = second container on the VPS or Pro), Supabase Free × 1 project.

## Usage

### VPS selection (stage 0, before 21 Oct 2026)

1. Rent the cheapest hourly/monthly plan from 1–2 providers (first candidate: Kazakhstan or Kyrgyzstan).
2. Deploy a test tool page of realistic weight using the same Docker + Caddy from `infra/`.
3. Open it from Russia on 4 mobile operators and 2–3 wired ISPs in ≥ 2 regions; repeat from KZ, BY, KG.
4. Check fetch-as-robot in Yandex Webmaster and Search Console.
5. From the server, send one request each to Supabase, Gemini API, Telegram Bot API.
6. **Pass**: full load < 5 s on every connection and all three outbound calls succeed.

If none passes everything: host the site where visitor reachability is best and route AI/Telegram through a cheap proxy server via `GEMINI_BASE_URL` / `TELEGRAM_API_ROOT` — no code change.

## Cross-references

- [Prod Server Runbook](./prod-server-runbook.md) — step-by-step VPS bootstrap, secrets, first deploy, Vercel settings
- [Architecture Overview](../architecture/overview.md) — platform layer, no Vercel-only APIs
- [Server API and Data](../code/server-api-and-data.md) — migrations and backups
- [Engineering Practices](../practices/engineering-practices.md) — branch flow, checks
- Skill spec: [preflight](../skills/preflight.md); agent spec: [platform-engineer](../agents/platform-engineer.md)

## File Structure

| Path | Description |
|---|---|
| `infra/compose.yml` | `caddy` + `web-blue` / `web-green` slots (profile `slots`, `mem_limit: 768m`) |
| `apps/web/vercel.json` | Vercel staging/previews: Next.js framework, `X-Robots-Tag: noindex` on every response |
| `infra/Caddyfile` | TLS, zstd/gzip, `www` → apex, security headers, IP-masked JSON logs, upstream imported from `state/upstream.caddy` |
| `infra/bootstrap.sh` | Server provisioning (deploy user with several keys, sshd, ufw, swap, upgrades, Docker) |
| `infra/deploy.sh` | `deploy <tag>` / `rollback` / `status`: start idle slot → wait for Docker health → reload Caddy → stop old slot |
| `infra/server.env.example` | Compose `.env` on the server (`DOMAIN`, `ACME_EMAIL`) |
| `apps/web/Dockerfile` | Next standalone image (Node 24 alpine, non-root, `HEALTHCHECK` on `/api/health/`, `APP_VERSION` build arg) |
| `.github/workflows/ci.yml` | PR checks: Biome, guard, Steiger, tsc, tests, build, server-HTML guard (`html:check`); Playwright phone journeys against `next start` of the CI build (job `e2e`); Docker image + smoke test; infra lint (shellcheck, compose, caddy validate); the reviewer export (`pnpm calc:export`, must write > 100 rows) runs in the main job since Phase 6 |
| `.github/workflows/deploy.yml` | `main` → GHCR → VPS |
| `.github/workflows/backup.yml` | Weekly encrypted `pg_dump` of prod as an Actions artifact (35 days) |
| `renovate.json` | Monthly dependency PRs into `develop`, grouped |
| `.env.example` | Variable names only |
