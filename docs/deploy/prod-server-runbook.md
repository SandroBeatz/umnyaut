---
version: 1.0
date: 2026-10-09
category: deploy
---

# Prod Server Runbook

> Version 1.0 · 2026-10-09 · [Deploy](../deploy/)

## Overview

Step-by-step setup of the production VPS and the two deploy paths. The server is **Timeweb Cloud, plan Cloud NSK 40** (Novosibirsk, Russia): 2 × 3.3 GHz vCPU, 2 GB RAM, 40 GB NVMe, 100 Mbit/s, Ubuntu 26.04 LTS (`resolute`; Docker’s apt repo supports it). Timeweb blocks outgoing mail ports (25, 465, 587, 2525) — irrelevant, the app sends no mail.

- **`develop` → Vercel (staging + PR previews).** Plain Vercel Next.js build from `apps/web`, no Docker, no DB, `noindex` on every response.
- **`main` → VPS (prod).** GitHub Actions builds the Docker image (Next standalone), pushes it to GHCR, and the VPS only pulls and swaps containers. **Nothing is ever built on the server**: `next build` needs 1.5–2 GB RAM, the running app needs 200–400 MB.

The Telegram bot is not a separate process: its webhook is a route of the same Next app (`/api/tg/webhook`, Phase 12), so the server runs one app container (two for a few seconds during a swap) plus Caddy.

The server IP is not written in this public repo; it lives in the GitHub variable `DEPLOY_HOST` and the owner's password manager (A06).

## Architecture

```
 PR ──► CI (ci.yml): lint, types, tests, next build, Docker build + smoke
  │
  ├─► Vercel preview URL                      (Vercel builds apps/web itself)
  │
 develop ──► Vercel staging                   (APP_ENV=staging, noindex, no DB)
  │
 main ──► deploy.yml
            1. build image ─► ghcr.io/sandrobeatz/umnyaut-web:<sha12>, :main
            2. supabase db push (when SUPABASE_PROJECT_REF is set)
            3. scp compose.yml, Caddyfile, deploy.sh ─► /srv/umnyaut
            4. ssh deploy@VPS: docker login ─► deploy.sh deploy <sha12> ─► logout
            5. curl PROD_URL/api/health/ expects version=<sha12>
```

On the VPS (`/srv/umnyaut`):

```
 :80/:443 ─► caddy ─► web-blue:3000  or  web-green:3000   (state/upstream.caddy)
```

`deploy.sh deploy <tag>` starts the tag in the idle slot, waits for the Docker healthcheck (`/api/health/`), rewrites `state/upstream.caddy`, reloads Caddy and stops the old slot. The old slot's container stays for `deploy.sh rollback`.

### Why this split

| Concern | Decision |
|---|---|
| RAM on a 2 vCPU VPS | Build in Actions; the server only runs `node server.js` (capped at `mem_limit: 768m` per slot) plus a 2 GB swap for the few seconds two slots overlap — 2 GB RAM is enough to run, never to build |
| Same code on both hosts | No Vercel-only APIs; Vercel runs `next build`, the VPS runs the standalone output of the same build |
| Staging must not pollute prod | Vercel has no `SUPABASE_*`, sends `X-Robots-Tag: noindex` (`apps/web/vercel.json`) |
| Reachability from Russia | Prod on a Russian VPS, not on Vercel/Cloudflare (see [Environments and CI/CD](./environments-and-ci.md)) |
| Outbound from a Russian IP | The AI provider (Gemini API) does not serve Russia and Telegram Bot API is unreliable from RU, so `GEMINI_BASE_URL` / `TELEGRAM_API_ROOT` point to a small relay outside RU when those features ship (Phases 12, 14); Supabase, GHCR and Docker Hub are checked in step 3a |

## Configuration

### Server

| File | Content | Mode |
|---|---|---|
| `/srv/umnyaut/.env` | `DOMAIN`, `ACME_EMAIL` (from `infra/server.env.example`) | 640 |
| `/srv/umnyaut/web.env` | `APP_ENV=production` + app secrets (names in root `.env.example`) | 600 |
| `/srv/umnyaut/state/` | `release.env`, `upstream.caddy` — written by `deploy.sh` | — |

`bootstrap.sh` variables: `DEPLOY_SSH_KEY` (one or more public keys, one per line), `DEPLOY_USER` (default `deploy`), `SWAP_SIZE` (default `2G`).

### GitHub (repo → Settings → Secrets and variables → Actions, environment `prod-vps`)

| Kind | Name | Value |
|---|---|---|
| Variable | `DEPLOY_HOST` | server IP (later `umnyaut.com` is fine too) |
| Variable | `PROD_URL` | `https://umnyaut.com` (or `http://<ip>` before DNS) |
| Secret | `DEPLOY_SSH_KEY` | private key `umnyaut-gha` (generated for CI only) |
| Secret | `DEPLOY_KNOWN_HOSTS` | output of `ssh-keyscan -t ed25519 <ip>` |

Supabase and backup variables are listed in [Environments and CI/CD](./environments-and-ci.md#configuration); the migrate step is skipped while `SUPABASE_PROJECT_REF` is empty.

### Vercel (A14)

| Setting | Value |
|---|---|
| Root Directory | `apps/web` (Vercel installs from the pnpm workspace root by itself) |
| Framework | Next.js (also pinned in `apps/web/vercel.json`) |
| Production branch | `develop` |
| Env `ENABLE_EXPERIMENTAL_COREPACK` | `1` — makes Vercel use `pnpm@12` from `packageManager`; without it Vercel picks pnpm 10 from `lockfileVersion: 9.0` and the root `engines.pnpm >=12` fails the deploy before the build |
| Env `APP_ENV` | `staging` (Production) / `preview` (Preview) |
| Domain | `staging.umnyaut.com` |

## Usage

### 1. Owner access (once, from the laptop)

```bash
ssh-copy-id -i ~/.ssh/id_ed25519.pub root@<ip>      # asks the root password one last time
ssh root@<ip> 'uname -a; free -h; df -h /'           # must log in without a password
```

### 2. CI deploy key (once)

```bash
ssh-keygen -t ed25519 -N "" -C umnyaut-gha -f ~/.ssh/umnyaut-gha
```

The private half goes to the `DEPLOY_SSH_KEY` secret, the public half to the server in step 3. Never reuse the owner key in CI.

### 3. Bootstrap

```bash
scp infra/bootstrap.sh root@<ip>:/root/
ssh root@<ip> "DEPLOY_SSH_KEY='$(cat ~/.ssh/umnyaut-gha.pub ~/.ssh/id_ed25519.pub)' bash /root/bootstrap.sh"
```

It refuses to run until root has a key in `authorized_keys` (so password login can be turned off safely). Result: user `deploy` (in group `docker`), password SSH off, root by key only, ufw 22/80/443, 2 GB swap, unattended upgrades with a 03:30 reboot window, Docker + Compose, `/srv/umnyaut`.

### 3a. Outbound check from the server

```bash
ssh root@<ip> 'for u in https://ghcr.io/v2/ https://registry-1.docker.io/v2/ https://api.supabase.com https://generativelanguage.googleapis.com https://api.telegram.org; do printf "%-40s " $u; curl -s -o /dev/null -m 10 -w "%{http_code}\n" $u || echo FAIL; done'
```

Any HTTP code (even 401/404) means reachable; `000`/`FAIL` means blocked. If Docker Hub is blocked, set a mirror in `/etc/docker/daemon.json` (`"registry-mirrors"`) or pull `caddy` from GHCR.

Result on 2026-10-09: GHCR, Docker Hub, `download.docker.com`, Supabase, Telegram and Let's Encrypt reachable in < 0.7 s. Anthropic API answered `403 Request not allowed` (region block). The AI provider is Gemini, which also does not serve RU; a request with an invalid key returns `400 API_KEY_INVALID` (the region check happens after key validation), so the block only shows with a real key — plan on the `GEMINI_BASE_URL` relay.

### 4. Server config

```bash
ssh deploy@<ip>
cd /srv/umnyaut
printf 'DOMAIN=umnyaut.com\nACME_EMAIL=<email>\n' > .env
install -m 600 /dev/null web.env && printf 'APP_ENV=production\n' > web.env   # add secrets later
```

Until DNS points to the server, Caddy cannot get a certificate for `DOMAIN`; the first deploy still passes the internal healthcheck, and the external smoke test needs `PROD_URL` reachable — so until step 7 the server uses `DOMAIN=<ip-with-dashes>.sslip.io` and `PROD_URL=https://<ip-with-dashes>.sslip.io` (set up this way on 2026-10-09; Caddy got Let's Encrypt certificates for it). At the DNS switch change both to `umnyaut.com`.

### 5. GitHub variables and secrets

Secrets go to the environment **`prod-vps`** (restricted to branch `main`). Not `Production`: the Vercel integration owns that environment, and GitHub environment names are case-insensitive. `DEPLOY_HOST`/`PROD_URL` are **repo** variables because `deploy.yml` reads them in job-level `if`, before an environment is attached.

```bash
gh api -X PUT repos/SandroBeatz/umnyaut/environments/prod-vps \
  -F 'deployment_branch_policy[protected_branches]=false' -F 'deployment_branch_policy[custom_branch_policies]=true'
gh api -X POST repos/SandroBeatz/umnyaut/environments/prod-vps/deployment-branch-policies -f name=main -f type=branch
```

```bash
gh secret set DEPLOY_SSH_KEY --env prod-vps < ~/.ssh/umnyaut-gha
ssh-keyscan -t ed25519 <ip> | gh secret set DEPLOY_KNOWN_HOSTS --env prod-vps
gh variable set DEPLOY_HOST --body <ip>
gh variable set PROD_URL --body https://umnyaut.com
```

### 6. First deploy and rollback test

Merge `develop` → `main` (or run **Deploy** manually). Then on the server:

```bash
/srv/umnyaut/deploy.sh status
```

Deploy a second commit, then run the **Deploy** workflow with `rollback: true` once (exit gate of Phase 2).

### 7. Measurement and DNS (P0.6, P2.8 — owner approval)

Before DNS: run the P0.6 reachability test against this server (RU mobile/wired, KZ, BY, KG; outbound to Supabase, Gemini, Telegram). Then `umnyaut.com` A → `<ip>`, `www` → same IP (Caddy redirects to apex), `staging` CNAME → Vercel.

### Day-to-day

| Task | Command |
|---|---|
| Status | `ssh deploy@<ip> /srv/umnyaut/deploy.sh status` |
| Rollback | `ssh deploy@<ip> /srv/umnyaut/deploy.sh rollback` or **Deploy** workflow with `rollback: true` |
| Logs | `docker compose -p umnyaut logs -f --tail 100 caddy web-blue web-green` |
| Change a secret | edit `web.env`, then deploy the current tag again: `./deploy.sh deploy <active tag>` |
| Disk | `docker image prune -af --filter until=168h` (old images) |

## Cross-references

- [Environments and CI/CD](./environments-and-ci.md) — environments, pipeline, monitoring, full variable list
- [Accounts and Services](../plan/accounts-and-services.md) — A06 (VPS), A14 (Vercel), A16 (DNS)
- [Development Plan](../plan/development-plan.md) — P0.6, P2.2, P2.5, P2.6, P2.8
- [Server API and Data](../code/server-api-and-data.md) — `/api/health`, migrations
- Agent spec: [platform-engineer](../agents/platform-engineer.md)

## File Structure

| Path | Description |
|---|---|
| `infra/bootstrap.sh` | One-time provisioning (root): users, sshd, ufw, swap, upgrades, Docker |
| `infra/compose.yml` | Caddy + `web-blue`/`web-green` slots, `mem_limit: 768m` per slot |
| `infra/Caddyfile` | TLS, compression, headers, IP-masked logs, upstream import |
| `infra/deploy.sh` | `deploy <tag>` · `rollback` · `status` |
| `apps/web/Dockerfile` | Standalone image built in Actions |
| `apps/web/vercel.json` | Vercel staging: Next.js framework, `noindex` header |
| `.github/workflows/deploy.yml` | `main` → GHCR → migrations → VPS swap → smoke test |
