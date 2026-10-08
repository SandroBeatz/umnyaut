---
version: 1.0
date: 2026-10-08
category: plan
---

# Accounts and Services Registry

> Version 1.0 · 2026-10-08 · [Plan](../plan/)

## Overview

Every external account, service and key the project needs, in the order they are needed. Each row says **when** (phase), **what to do**, **what it produces** (secrets/IDs), and **where the result is stored**. The [Development Plan](./development-plan.md) references these rows by ID (`A01`…).

Rules:
- Register with a project mailbox (A02), not a personal one, wherever possible.
- Store every secret in a password manager first; then copy into Vercel / server env / GitHub secrets. Never into the repo — only `.env.example` with names.
- Payments: card or account of the Kyrgyzstan sole proprietorship (ИП). Check that each service accepts it **before** building on it (business spec §16).

## Architecture

### Phase 0 — needed before any code (8–21 Oct 2026)

| ID | Service | Action | Produces | Stored in |
|---|---|---|---|---|
| A01 | Domain registrar for `umnyaut.com` | Confirm access to DNS management; lower TTL to 300 s before the switch | DNS control | Password manager |
| A02 | Domain mailbox (any mail hosting for `@umnyaut.com`) | Create `hello@` (contacts, privacy requests) and `dev@` (service sign-ups) | Mailboxes, MX/SPF/DKIM records | Password manager, DNS |
| A03 | Password manager (1Password / Bitwarden / KeePassXC) | Create vault “UmnyAut” | Single source of secrets | — |
| A04 | GitHub (`SandroBeatz/umnyaut`) | Enable 2FA; branch protection for `main` and `develop` (PR required, CI green); enable Actions and GHCR; GitHub Project #10 already exists | Repo rules | GitHub |
| A05 | `gh` CLI | `gh auth login` + `gh auth refresh -s project,write:packages` | Local CLI auth for roadmap script and registry | Keychain |
| A06 | VPS provider(s) in KZ or KG (1–2 candidates, hourly/monthly billing) | Rent the cheapest plan for the measurement test (deploy-and-measure procedure); after the test keep the winner at 2 vCPU / 4 GB / 40 GB, Ubuntu LTS | Server IP, root SSH | Password manager |
| A07 | Testers in RU / KZ / BY / KG | 5–6 people on different mobile operators and ISPs send a screenshot + load time | Measurement table | `docs/plan/` notes |
| A08 | Yandex Webmaster | Add `umnyaut.com`, verify by DNS TXT; later submit sitemap | Site verification | DNS |
| A09 | Google Search Console | Add a **Domain property**, verify by DNS TXT | Site verification | DNS |
| A10 | Yandex Metrika | Create counter (Webvisor on, “accurate bounce”), **do not install yet** — strict consent mode | `METRIKA_ID` | Vercel/server env |
| A11 | Yandex Wordstat (+ API if batch export needed) | Access with the Yandex account | Demand data for research | `docs/specs/` |

### Phase 1–2 — foundation and infrastructure (22–28 Oct)

| ID | Service | Action | Produces | Stored in |
|---|---|---|---|---|
| A12 | Supabase | Create org; two projects `umnyaut-dev` and `umnyaut-prod`, region **Frankfurt (eu-central-1)**, Free plan | `SUPABASE_URL`, **secret key** (`sb_secret_…`) per project, DB password | Password manager → Vercel (dev), server env (prod) |
| A13 | Supabase CLI access token | `supabase login`; create a personal access token for CI | `SUPABASE_ACCESS_TOKEN`, project refs | GitHub Actions secrets |
| A14 | Vercel | Sign in with GitHub; import repo; root `apps/web`; production branch = `develop` (this Vercel project is staging only); Hobby plan; add domain `staging.umnyaut.com`; set `APP_ENV=staging` | Preview URL per PR, staging URL | Vercel |
| A15 | GitHub Actions secrets | `VPS_HOST`, `VPS_SSH_KEY` (deploy user key), `VPS_USER`, `GHCR_TOKEN` (or use `GITHUB_TOKEN`), `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD_DEV/PROD`, `INDEXNOW_KEY` | CI/CD access | GitHub |
| A16 | DNS records | `umnyaut.com` A/AAAA → VPS; `www` → apex redirect (Caddy); `staging` CNAME → Vercel | Live domains | Registrar |
| A17 | Docker + Docker Compose on VPS | Installed by `infra/bootstrap.sh` | Runtime | Server |
| A18 | Renovate (GitHub app) | Install on the repo; monthly schedule; group minor/patch | Dependency PRs | GitHub |

### Phase 3 — design system assets (26 Oct – 8 Nov)

| ID | Service | Action | Produces |
|---|---|---|---|
| A19 | Onest font (OFL) | Download variable font (via `@fontsource-variable/onest` or Google Fonts source); subset at build | `onest-var.woff2` in repo |
| A20 | Image generator / illustrator for mascot & photos | Generate all poses in one series from the turnaround sheet; material photos by the style guide | PNG sources ≥ 1024 px |
| A21 | Figma (optional) | Only if a design file is created from the mockups | Design file link |

### Phase 7–9 — launch (Nov 2026)

| ID | Service | Action | Produces | Stored in |
|---|---|---|---|---|
| A22 | IndexNow | Generate key; host `/<key>.txt` | `INDEXNOW_KEY` | Server env, GitHub secret |
| A23 | External uptime monitoring with nodes in RU and KZ | Checks every 5 min: `/api/health` + one tool page; alerts to Telegram | Alerts | — |
| A24 | Telegram alert bot/chat | Create a private chat + simple bot for monitoring alerts | Chat ID, token | Monitoring service |
| A25 | Private backup storage (any S3-compatible) | Bucket for weekly `pg_dump` from Actions | Access keys | GitHub secrets |
| A26 | Formula reviewer (practising master) | Paid review of wave‑1 golden tables (3–10k ₽ per wave) | Signed-off examples | `docs/` |

### Phase 10–12 — framework (Dec 2026 – Jan 2027)

| ID | Service | Action | Produces | Stored in |
|---|---|---|---|---|
| A27 | Telegram @BotFather — **prod bot** | `/newbot` (name «Умняут», username e.g. `umnyaut_bot`); `/setdescription`, `/setabouttext`, `/setuserpic` (mascot head 640 × 640), `/setcommands` (`start`, `my`, `forget`); `/newapp` → mini app with URL `https://umnyaut.com/tg/`; `/setdomain` | `TELEGRAM_BOT_TOKEN` | Server env |
| A28 | Telegram @BotFather — **test bot** | Same for staging, URL `https://staging.umnyaut.com/tg/` | Test token | Vercel env |
| A29 | Webhook registration | `setWebhook` with `secret_token` = `TELEGRAM_WEBHOOK_SECRET` | Live webhook | Server env |
| A30 | Tunnel for local bot dev (cloudflared / ngrok-like) | Expose localhost for the test bot | Temp URL | — |

### Phase 14 — season (Feb – Apr 2027)

| ID | Service | Action | Produces | Stored in |
|---|---|---|---|---|
| A31 | Anthropic Console | Organization, workspace “umnyaut”; **spend limit** = AI ceiling (1–3k ₽/mo); separate keys for staging and prod; check that the VPS country can reach the API (else proxy via `ANTHROPIC_BASE_URL`) | `ANTHROPIC_API_KEY` | Server env / Vercel |
| A32 | Lawyer / accountant | One consultation (Feb 2027): Metrika before consent, operator duties in 4 countries, ad cookies, storage of client names/phones, 3% ad levy, ad marking | Written answers | `docs/` |
| A33 | Yandex Advertising Network (РСЯ) | Apply as non-resident (KG sole proprietor) — check offer terms and payout threshold | Ad block IDs | catalog config |
| A34 | Google AdSense | Apply for KZ/BY/KG traffic; compare with РСЯ | Publisher ID | catalog config |
| A35 | Ad marking operator (ОРД) | Register to obtain `erid` for affiliate links shown in Russia | `erid` per creative | `ShopConfig.adLabel` |
| A36 | Lemana PRO affiliate program (+ others per country) | Apply; read cookie window and site requirements | Affiliate params | `ShopConfig.buildUrl` |
| A37 | Acquiring check | Can the KG sole proprietorship accept cards from RU and KZ? Telegram Stars payout terms | Go/no-go for payments | `docs/plan/` |

### Phase 15 — scale (May – Oct 2027)

| ID | Service | Action |
|---|---|---|
| A38 | Supabase Pro ($25/mo) | Upgrade `umnyaut-prod` with the first paying user (no pausing, managed backups) |
| A39 | Supabase Auth | Email OTP provider + SMTP for codes (domain mailbox or transactional email service) |
| A40 | Payment provider | Chosen after A37; implements `PaymentProvider` |
| A41 | Vercel Pro (optional) | Only if Hobby non-commercial terms become a problem; alternative — second container on VPS |

## Configuration

Environment variables by environment (filled from the rows above):

| Variable | Local | Preview / Staging (Vercel) | Prod (VPS env file) | Source |
|---|---|---|---|---|
| `APP_ENV` | `local` | `preview` / `staging` | `production` | — |
| `SUPABASE_URL` | local Docker | dev project | prod project | A12 |
| `SUPABASE_SECRET_KEY` | local | dev secret | prod secret | A12 |
| `METRIKA_ID` | — | — (analytics off) | counter id | A10 |
| `INDEXNOW_KEY` | — | — | key | A22 |
| `TELEGRAM_BOT_TOKEN` | test | test | prod | A27/A28 |
| `TELEGRAM_WEBHOOK_SECRET` | random | random | random | A29 |
| `TELEGRAM_API_ROOT` | default | default | default or proxy | A27 |
| `ANTHROPIC_API_KEY` | staging key | staging key | prod key | A31 |
| `ANTHROPIC_BASE_URL` | default | default | default or proxy | A31 |
| `AI_ENABLED` | `true` | `true` | `true` | — |
| `AI_MONTHLY_BUDGET_USD` | small | small | ceiling | A31 |

## Usage

When a plan task says “needs A12”, open this table, do the action, put secrets in the vault, then into the listed store. Tick the account in the plan's phase checklist.

## Cross-references

- [Development Plan](./development-plan.md) — phases that consume these accounts
- [Dependencies](./dependencies.md) — packages and CLIs
- [Environments and CI/CD](../deploy/environments-and-ci.md) — how secrets are used
- [Telegram Bot](../integrations/telegram-bot.md), [AI Vision](../integrations/ai-vision.md)
