---
version: 1.0
date: 2026-10-16
category: deploy
status: idea — not adopted
---

# Static Export (Idea, Not Adopted)

> Version 1.0 · 2026-10-16 · [Deploy](../deploy/)

## Overview

This doc covers one question: could the site be built as a set of static files (Next.js `output: "export"`, the counterpart of `nuxt generate`) and served from plain hosting with no Node server?

**Decision (2026-10-16):** recorded as an idea only. Prod stays on the Node server (Docker + Caddy on the CIS VPS, see [Environments and CI/CD](./environments-and-ci.md)). This doc lists what a switch would take, so the question doesn't have to be researched again.

**Short answer:** the site as it stands could be exported with a handful of changes. What stops it is the roadmap: Phase 7 and later need server code, so a static site would also need a separate backend.

## Architecture

### What already works statically

| Area | Why it is export-ready |
|---|---|
| Category and tool pages | `app/[category]/page.tsx` and `app/[category]/[tool]/page.tsx` declare `generateStaticParams()` and `dynamicParams = false`, so every page is known at build time |
| Indexable pages | Hard rule 4: no `cookies()`/`headers()`. The first client render matches the server render, and URL/room/saved input is applied after mount |
| Calculations | `packages/calc` runs in the browser, so no server round trip is needed |
| Images | `next/image` is not used. Images are pre-built with content-hashed names by `apps/web/scripts/images.mjs` |
| Content | Markdown in `apps/web/content` is read at build time (`server/content`) |
| `sitemap.ts`, `robots.txt` | The sitemap is built from the catalog. `robots.txt/route.ts` is `force-static`, so both come out as files |
| Estimate `/spisok/`, `/spisok/prosmotr/` | The store lives in browser storage (`entities/estimate/model/store.ts`, `shared/lib/storage.ts`). The shared-link snapshot is carried in the URL |

### What blocks `output: "export"` and how to fix it

| Blocker | Where | Fix |
|---|---|---|
| `headers()`: CSP and security headers, `immutable` cache on `/img` | `apps/web/next.config.ts`, `security-headers.ts` | Export ignores it. Generate host config at build time: `_headers` (Netlify-style), `.htaccess` (Apache) or an nginx snippet |
| `redirects()` from the catalog | `next.config.ts` ← `packages/catalog/src/redirects.ts` | Generate `_redirects` / `.htaccess` rules from the same list |
| `output: "standalone"` | `next.config.ts` | Replace with `output: "export"`. Keep `trailingSlash: true`, which gives `/path/index.html` |
| `/api/health/` (`force-dynamic`, DB check) | `app/api/health/route.ts` | Drop it. Without a server, uptime monitoring would check a static page |
| `/indexnow.txt` reads `INDEXNOW_KEY` at request time | `app/indexnow.txt/route.ts` | Make it `force-static` and write the key into the file at build time |
| `/dev/ui` is `force-dynamic` so prod returns 404 | `app/dev/ui/page.tsx` | Exclude it from the export build |
| `instrumentation.ts` validates env at startup and exits on failure | `apps/web/instrumentation.ts` | Move the env check to build time (a prebuild script) |
| Custom 404 | `app/not-found.tsx` | The export emits `404.html`. The host must be configured to serve it |

### The main limitation: server-side features on the roadmap

Each of these needs secrets or server code, which plain hosting cannot provide:

- **Phase 7**: saving projects and the API on Supabase. Hard rule 3 says the browser never talks to Supabase, and the keys stay in `apps/web/server/**`.
- **Telegram bot**: the grammY webhook is a route of the same app (`/api/tg/webhook`).
- **AI vision**: the Gemini API key sits behind `VisionProvider` on the server.
- **Rate limits and counters**: `server/limits`, error reports.

A static site would therefore need a separate backend for these: serverless functions, a small API on the VPS, or Supabase Edge Functions. That means two deploy targets instead of one image, and CORS between them.

### Hosting caveat

The usual static hosts (Cloudflare Pages, Netlify, Vercel) run outside Russia. Russian ISPs throttle Cloudflare, and Russia is the main market (see [Environments and CI/CD](./environments-and-ci.md#overview)). A static build would still have to be served from a CIS host, which removes most of the operational win over the current VPS.

## Configuration

Nothing is configured today: the idea is not implemented. A switch would touch `apps/web/next.config.ts` (`output`, removal of `headers()`/`redirects()`), the deploy workflow (upload `apps/web/out/` instead of a Docker image) and a new generator script for host headers and redirects.

## Usage

### When to revisit

Reconsider this only if one of these becomes true:

- Server-side features (Phase 7, bot, AI vision) are dropped or moved fully to a separate backend anyway.
- The VPS becomes a cost or ops burden that is bigger than running two deploy targets.
- A CIS static host or CDN with header and redirect control turns up and wins on speed for RU users.

### Checklist if adopted

1. Set `output: "export"` and remove `headers()`/`redirects()` from `next.config.ts`.
2. Add a build script that emits host headers (CSP from `security-headers.ts`, `/img` cache) and redirects (from `@umnyaut/catalog`).
3. Delete `/api/health`, make `/indexnow.txt` static, exclude `/dev/ui`.
4. Move the env validation from `instrumentation.ts` to build time.
5. Keep the server-HTML guard and Lighthouse CI, run against `out/`.
6. Stand up the separate backend before Phase 7 ships.

## Cross-references

- [Environments and CI/CD](./environments-and-ci.md) — the current Docker + Caddy prod setup this idea would replace
- [Prod Server Runbook](./prod-server-runbook.md) — VPS deploy paths
- [Architecture Overview](../architecture/overview.md) — hard rules 3, 4 and 10 that shape this
- [Server API and Data](../code/server-api-and-data.md) — server code that would need a separate home
- [Telegram Bot and Mini App](../integrations/telegram-bot.md) — webhook that needs a server
- [AI Vision Features](../integrations/ai-vision.md) — `VisionProvider` that needs a server

## File Structure

| File | Role in a static export |
|---|---|
| `apps/web/next.config.ts` | `output`, `headers()`, `redirects()`: the main changes |
| `apps/web/security-headers.ts` | CSP source to turn into host config |
| `packages/catalog/src/redirects.ts` | Redirect list to turn into host config |
| `apps/web/app/api/health/route.ts` | Dynamic route to drop |
| `apps/web/app/indexnow.txt/route.ts` | Dynamic route to make static |
| `apps/web/app/dev/ui/page.tsx` | Dev page to exclude |
| `apps/web/instrumentation.ts` | Startup env check to move to build time |
