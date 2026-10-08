---
version: 1.0
date: 2026-10-08
category: integrations
---

# Telegram Bot and Mini App

> Version 1.0 · 2026-10-08 · [Integrations](../integrations/)

## Overview

The bot is **one server route plus the same site pages opened inside Telegram**. There is no separate app and no separate layout. It ships in stage 2 together with the planner and is the primary return channel for Kazakhstan, Belarus and Kyrgyzstan (secondary for Russia, where Telegram has been restricted since Feb 2026).

The bot never calculates. It issues buttons and links; calculation runs in `@umnyaut/calc` on the page.

> Status: planned (stage 2). Source: technical spec §12, design spec §14, business spec §10.2.

## Architecture

| Part | Implementation |
|---|---|
| Bot | grammY in webhook mode at `POST /api/tg/webhook`; accepted only with the secret header set at webhook registration |
| Mini app | Entry `/tg/`: “My calculations”, popular tools, planner; then ordinary tool pages |
| UI adaptation | `TelegramProvider` detects `Telegram.WebApp.initData`, hides header/footer/ad slots, maps 4 Telegram theme colours into `--color-bg`, `--color-surface`, `--color-text`, `--color-text-muted`; enables BackButton and MainButton “Сохранить” (coloured `--color-primary`) |
| Auth | Browser sends `initData` in a header; server verifies signature with the bot token and `auth_date` freshness (≤ 24 h). No cookies, no passwords |
| My calculations | Projects saved inside Telegram get `tg_user_id`; list via `GET /api/tg/calcs` |
| Deep links | `t.me/<bot>?startapp=<id>` opens a project directly in the mini app |

### Commands and scenarios

| Scenario | Bot behaviour | Stage |
|---|---|---|
| `/start` | Greeting (mascot `hello`) + buttons: planner, my calcs, popular tools | 2 |
| `/my` | Last five projects as buttons | 2 |
| Project link in chat | Replies with “Open in mini app” button | 2 |
| `/forget` | Deletes the user record and unbinds projects | 2 |
| Label or plan photo | Downloads, recognizes, replies with parameters + tool button with values prefilled | 3 |
| Estimate to client | “Forward” opens chat picker with the project link | 3 |

### Rules

- Webhook replies to Telegram immediately; long work (photo download, AI) goes to post-response work via the platform layer (`after()`).
- Messenger code sits behind `MessengerAdapter` in `server/messenger/` (send message, send project link, parse incoming). A second messenger = a new implementation.
- Test environment has its own bot and token. Local dev uses a tunnel.
- Analytics events from the mini app carry `source: 'tg'`.
- No ad slots in the mini app. Same cookie banner and consent choice as the site.
- Mini app tab bar (only place with a bottom tab bar): Главная · Инструменты · Мои расчёты, 56 px + safe area.
- Dark theme first appears here (stage 2) following the Telegram theme.

## Configuration

| Variable | Purpose |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Bot token (separate for staging) |
| `TELEGRAM_WEBHOOK_SECRET` | Secret header value |
| `TELEGRAM_API_ROOT` | Override Bot API base URL (proxy fallback if VPS cannot reach Telegram) |

`frame-ancestors` must allow Telegram web domains for `/tg/` and `/p/[id]`.

## Usage

Typical flow: user taps `t.me/<bot>?startapp=a8H2k` → mini app opens `/tg/` → client reads `startapp` → navigates to the project → MainButton saves changes via `PUT /api/projects/a8H2k` with `initData` header.

## Cross-references

- [Server API and Data](../code/server-api-and-data.md) — `tg_users`, `/api/tg/*`
- [AI Vision](../integrations/ai-vision.md) — photo intake from chat
- [Calculator Shell, Pages and Routing](../ui/calculator-shell-and-pages.md) — environment differences table
- [Design System](../design/design-system.md) — Telegram theming rules
- [Environments and CI/CD](../deploy/environments-and-ci.md) — test vs prod bot

## File Structure

| Path | Description |
|---|---|
| `apps/web/app/api/tg/webhook/route.ts` | grammY webhook |
| `apps/web/app/api/tg/calcs/route.ts` | My calculations |
| `apps/web/app/tg/page.tsx` | Mini app entry |
| `apps/web/server/telegram/` | Bot setup, `initData` verification |
| `apps/web/server/messenger/` | `MessengerAdapter` + Telegram implementation |
| `apps/web/src/shared/telegram/TelegramProvider.tsx` | Client adaptation |
