---
version: 1.1
date: 2026-10-08
category: deploy
---

# Environments and CI/CD

> Version 1.1 · 2026-10-08 · [Deploy](../deploy/)

## Overview

Production runs in **Docker on a VPS in the CIS** (branch `main`); staging and PR previews run on **Vercel** (branch `develop` + every PR). Because the two differ, the prod Docker image is built and smoke-tested on every PR, and the code uses no Vercel-only APIs.

**Why not Cloudflare / Hetzner / DO / OVH:** since 9 June 2025 Russian ISPs cut connections to Cloudflare after the first 16 KB, and the same report names Hetzner, DigitalOcean and OVH. Russia is the largest market, so prod sits on a CIS VPS chosen by measurement.

> Status: planned. Source: technical spec §2, §15, §18.

## Architecture

### Environments

| Env | Branch | Runs on | DB | Bot |
|---|---|---|---|---|
| Local | — | `localhost` | Supabase in Docker | Test bot via tunnel |
| Preview | PR | Vercel, URL per PR | `umnyaut-dev` | — |
| Staging | `develop` | Vercel, `staging.umnyaut.com` | `umnyaut-dev` | Test |
| Prod | `main` | VPS, `umnyaut.com` | `umnyaut-prod` | Prod |

Non-prod (`APP_ENV != production`): `X-Robots-Tag: noindex` on all responses, Metrika and own counters off, small AI budget.

### Pipeline (GitHub Actions + GitHub Container Registry)

1. **PR → `develop`**: pnpm install (cached) → Biome, Steiger, `tsc --noEmit` → tests → `next build` → Docker image build + container smoke test → Playwright and Lighthouse CI against the Vercel preview.
2. **Merge → `develop`**: Vercel deploys staging; migrations applied to `umnyaut-dev`.
3. **PR `develop` → `main`**: same checks + manual pass of staging on a real phone.
4. **Merge → `main`**: image tagged with commit SHA pushed to GHCR → migrations applied to `umnyaut-prod` → server pulls the image over SSH and starts the new container next to the old → after `/api/health` passes, Caddy switches traffic → external smoke test → IndexNow submission.
5. **Rollback**: one command starts the previous tag — `ssh deploy@<host> /srv/umnyaut/deploy.sh rollback`, or run the **Deploy** workflow manually with `rollback: true`. Migrations are backward compatible so old code runs against the new schema.
6. **Scheduled**: daily uptime check; weekly DB backup and link check in texts; monthly Renovate dependency updates.

Turborepo rebuilds/tests only affected packages: editing a text does not run formula tests.

### Server

| Topic | Decision |
|---|---|
| Size | 2 vCPU, 4 GB RAM, 40 GB SSD, Ubuntu LTS (0.5–1.5k ₽/mo) |
| Composition | Docker Compose: `web` (Next standalone, Node 24) + `caddy` |
| TLS & compression | Caddy auto-certs, gzip + zstd, security headers |
| State | **None on the server.** DB in Supabase, images in registry, config in repo. Rebuild from `infra/` in ~1 h |
| Build | In GitHub Actions, never on the server |
| Access | SSH key only, separate deploy user, firewall 22/80/443 |
| Updates | Unattended security updates, night reboot window |
| Logs | Rotated container logs; Caddy IP truncated to subnet, 7 days |
| Restart | Docker restarts crashed containers; healthcheck in `compose.yml` |

### Monitoring

External check every 5 min of `/api/health` and a tool page from nodes in Russia and Kazakhstan → Telegram alert. Alerts on < 20% free disk or container restart. One JSON log line per request. Browser errors via `js_error` event; no external error service at launch.

### Security headers

`Content-Security-Policy` (own domain, Metrika, Telegram), `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `frame-ancestors` per route (see UI doc).

## Configuration

Secrets: `APP_ENV`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_API_ROOT`, `ANTHROPIC_API_KEY`, `ANTHROPIC_BASE_URL`, `AI_ENABLED`, `AI_MONTHLY_BUDGET_USD`, `METRIKA_ID`, `INDEXNOW_KEY`.

- Staging: Vercel project settings. Prod: env file on the server readable only by the deploy user.
- GitHub Actions configuration (steps are skipped until their variables exist, so workflows stay green before the VPS and Supabase are ready):

| Kind | Name | Used by |
|---|---|---|
| Variable | `SUPABASE_DEV_PROJECT_REF` | `db-dev.yml` |
| Variable | `SUPABASE_PROD_PROJECT_REF` | `deploy.yml` (migrate) |
| Variable | `DEPLOY_HOST`, `PROD_URL` | `deploy.yml` (deploy, smoke test) |
| Variable | `BACKUP_ENABLED` = `true` | `backup.yml` |
| Secret | `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DEV_DB_PASSWORD`, `SUPABASE_PROD_DB_PASSWORD` | migrations |
| Secret | `DEPLOY_SSH_KEY` (private key of the `deploy` user), `DEPLOY_KNOWN_HOSTS` (`ssh-keyscan <host>`) | `deploy.yml` |
| Secret | `SUPABASE_PROD_DB_URL`, `BACKUP_PASSPHRASE` | `backup.yml` |

GHCR uses the built-in `GITHUB_TOKEN`; the server logs in for the pull and logs out right after. GitHub environments `production` and `development` hold the secrets and can require manual approval.
- Repo: only `.env.example`. Zod validates env on startup.

Plans: Vercel Hobby (non-commercial clause — staging has no ads/payments; fallback = second container on the VPS or Pro), Supabase Free × 2 projects.

## Usage

### VPS selection (stage 0, before 21 Oct 2026)

1. Rent the cheapest hourly/monthly plan from 1–2 providers (first candidate: Kazakhstan or Kyrgyzstan).
2. Deploy a test tool page of realistic weight using the same Docker + Caddy from `infra/`.
3. Open it from Russia on 4 mobile operators and 2–3 wired ISPs in ≥ 2 regions; repeat from KZ, BY, KG.
4. Check fetch-as-robot in Yandex Webmaster and Search Console.
5. From the server, send one request each to Supabase, Anthropic API, Telegram Bot API.
6. **Pass**: full load < 5 s on every connection and all three outbound calls succeed.

If none passes everything: host the site where visitor reachability is best and route AI/Telegram through a cheap proxy server via `ANTHROPIC_BASE_URL` / `TELEGRAM_API_ROOT` — no code change.

## Cross-references

- [Architecture Overview](../architecture/overview.md) — platform layer, no Vercel-only APIs
- [Server API and Data](../code/server-api-and-data.md) — migrations and backups
- [Engineering Practices](../practices/engineering-practices.md) — branch flow, checks
- Skill spec: [preflight](../skills/preflight.md); agent spec: [platform-engineer](../agents/platform-engineer.md)

## File Structure

| Path | Description |
|---|---|
| `infra/compose.yml` | `caddy` + `web-blue` / `web-green` slots (profile `slots`) |
| `infra/Caddyfile` | TLS, zstd/gzip, `www` → apex, security headers, IP-masked JSON logs, upstream imported from `state/upstream.caddy` |
| `infra/bootstrap.sh` | Server provisioning |
| `infra/deploy.sh` | `deploy <tag>` / `rollback` / `status`: start idle slot → wait for Docker health → reload Caddy → stop old slot |
| `infra/server.env.example` | Compose `.env` on the server (`DOMAIN`, `ACME_EMAIL`) |
| `apps/web/Dockerfile` | Next standalone image (Node 24 alpine, non-root, `HEALTHCHECK` on `/api/health/`, `APP_VERSION` build arg) |
| `.github/workflows/ci.yml` | PR checks: Biome, guard, Steiger, tsc, tests, build; Docker image + smoke test; infra lint (shellcheck, compose, caddy validate) |
| `.github/workflows/deploy.yml` | `main` → GHCR → VPS |
| `.github/workflows/db-dev.yml` | Migrations → `umnyaut-dev` on merge to `develop` |
| `.github/workflows/backup.yml` | Weekly encrypted `pg_dump` of prod as an Actions artifact (35 days) |
| `renovate.json` | Monthly dependency PRs into `develop`, grouped |
| `.env.example` | Variable names only |
