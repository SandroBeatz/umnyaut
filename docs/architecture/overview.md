---
version: 1.1
date: 2026-10-09
category: architecture
---

# Architecture Overview

> Version 1.1 · 2026-10-09 · [Architecture](../architecture/)

## Overview

UmnyAut («Умняут») is a renovation-calculation service: a person enters room dimensions once and gets a **verified, merged shopping list** in purchase units (packs, rolls, bags, cans) across the selected renovation works. Individual calculators are entry points into one room project, not the product boundary. Catalog breadth is conditional on demand and connected-workflow usage.

The repository was reset on 2026-10-08: the previous project (a crossword game) was removed. The Phase 1 monorepo and part of Phase 2 now exist; the Lovable/stub deployment remains until the production path is switched. This document distinguishes current code from target components through the development plan and progress log.

Three properties drive every architectural choice:

1. **Search engines must get real HTML.** All indexable pages are statically generated with the result for default values already rendered.
2. **Calculation is deterministic code, never AI.** Formulas live in a pure TypeScript package shared by the site, the Telegram mini app, the embeddable widget, and tests.
3. **One developer, 8–10 hours a week.** Boring, low-maintenance choices: one repo, one container, no ORM, no CMS, no client-side DB access.
4. **Connected result over page count.** `Room` is shared input, tool outputs are `PurchaseItem[]`, and `mergeItems()` is the seam that turns several calculators into one shopping list.

## Architecture

### System view

```
                ┌──────────────────────── VPS in CIS (prod) ────────────────────────┐
 Browser ──────►│ Caddy (TLS, gzip/zstd) ──► Next.js 16 standalone container (web)   │
 Telegram app ─►│                              ├─ static pages (SSG, calc at build) │
 Widget iframe ►│                              ├─ /p/[id] (SSR, project by link)     │
                │                              └─ /api/** route handlers ────────────┼─► Supabase Postgres (Frankfurt)
                └────────────────────────────────────────────────────────────────────┘─► Gemini API (vision, via relay)
                                                                                      ─► Telegram Bot API
 Staging & PR previews: Vercel (branch `develop` + every PR), always noindex.
```

The browser receives a finished page and **computes locally** after hydration. It calls the server only to save/open projects, recognize photos, report errors, and send anonymous event counters. Consequence: a tool page keeps working on bad in-store mobile connections, and server load scales with saves and AI calls, not with traffic.

### Where things run

| Action | Where | Network |
|---|---|---|
| Result for default values | Build time: `calc` + `catalog` + `content` → HTML | No |
| Recalculation on input | Browser, `@umnyaut/calc` | No |
| Room carried between tools | Browser, localStorage (Zustand persist) | No |
| Share link `?s=` | Browser (base64url of non-default fields) | No |
| Save/open project | Route handler → Supabase | Yes |
| Photo recognition | Route handler → Gemini API | Yes |
| Telegram “My calculations” | Route handler → Supabase | Yes |

### Monorepo layout (pnpm workspaces + Turborepo, Node.js 24 LTS)

```
umnyaut/
├─ apps/web/                 Next.js: site, API, Telegram mini app, widget
│  ├─ app/                   routes only: page.tsx, layout.tsx, route.ts
│  ├─ src/                   FSD layers
│  │  ├─ views/              page composition (FSD "pages"; named views because Next owns pages/)
│  │  ├─ widgets/            calculator-shell, result-panel, room-bar, layout-scheme
│  │  ├─ features/           save-project, share-result, report-error, pick-country, scan-label
│  │  ├─ entities/           room, project, tool, country
│  │  └─ shared/             api client, analytics (track), lib, config
│  ├─ server/                server-only: db, ai, telegram, messenger, limits, platform
│  ├─ content/               Markdown: tool texts, reference pages, info pages
│  ├─ e2e/                   Playwright scenarios
│  └─ Dockerfile             prod image (Next standalone)
├─ packages/
│  ├─ calc/                  formulas, units, packs, layout geometry (pure TS + Zod only)
│  ├─ catalog/               tool registry, categories, presets, norms, countries, UI strings
│  ├─ ui/                    design tokens, base components, brand assets
│  └─ db/                    SQL migrations, generated DB types, query functions
├─ infra/                    compose.yml, Caddyfile, server bootstrap & deploy scripts
├─ tooling/                  shared tsconfig, biome, vitest configs
└─ .github/workflows/
```

### Import rules (the main architectural invariant)

> Formulas do not depend on UI; UI contains no formulas.

| Module | May import | Must NOT import |
|---|---|---|
| `packages/calc` | Zod only | React, `fetch`, `Date.now()`, `Math.random()` |
| `packages/catalog` | `calc` | React, app code |
| `packages/ui` | nothing from the project | `calc`, `catalog`, app code |
| `packages/db` | nothing from the project | app code |
| `apps/web/src` | all packages except `db`; FSD layer only imports lower layers | `server/` |
| `apps/web/server` | all packages | components from `src/` |
| `apps/web/app` | `src/views`, `server` | business logic inside route files |

Enforcement: Steiger checks FSD slice structure; package boundaries are enforced by `package.json` dependencies; every file in `server/` starts with `import "server-only"` so a browser import breaks the build. `tooling/scripts/check-boundaries.mjs` (`pnpm guard`, also run before `next build`) checks all of the rules in this table plus FSD layer order — Steiger 0.7 hardcodes layer names and does not see `views`. Biome `noRestrictedImports` gives the same signal for `src → server` and `calc` imports in the editor.

**Platform layer** (`server/platform/`) exposes exactly three things: validated env vars, client IP from the proxy header, and post-response work via Next `after()`. No Vercel-only APIs anywhere — prod (VPS) and staging (Vercel) both run Node.js; `APP_ENV` distinguishes them.

### One identifier everywhere

A tool id such as `laminat` is simultaneously the calc module name, the URL segment, the content filename, and the `tool` value in analytics events. Code identifiers are English or transliterated; UI strings are Russian and live only in `catalog` and `content`.

### What is deliberately NOT in the stack

ORM (7 tables, simple queries), tRPC/GraphQL/Redux/React Query (~10 routes, compute is client-side), CMS (one author, texts reviewed in PRs), i18n library (one language; country is config), client Supabase SDK / Auth (no accounts until the paid master mode), CDN/Redis/Kubernetes.

## Configuration

Environment variables are validated by a Zod schema at server start (missing var → server refuses to boot):

| Variable | Purpose |
|---|---|
| `APP_ENV` | `local` / `preview` / `staging` / `production`; non-prod adds `X-Robots-Tag: noindex`, disables analytics, uses a small AI budget |
| `SUPABASE_URL`, `SUPABASE_SECRET_KEY` | Server-only DB access |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_API_ROOT` | Bot + webhook; API root overridable for a proxy |
| `GEMINI_API_KEY`, `GEMINI_BASE_URL` | Vision provider (Gemini); base URL points to a relay outside RU/BY on prod |
| `AI_ENABLED`, `AI_MONTHLY_BUDGET_USD` | Kill switch and monthly ceiling |
| `METRIKA_ID`, `INDEXNOW_KEY` | Analytics and indexing |

Only `.env.example` is committed. See [Environments and CI/CD](../deploy/environments-and-ci.md).

## Usage

Adding a calculator never touches routing. It is **five files**:

| File | Content |
|---|---|
| `packages/calc/src/tools/<id>/index.ts` | Input schema, defaults, `compute()` |
| `packages/calc/src/tools/<id>/golden.ts` | ≥ 10 golden examples |
| `packages/catalog/src/tools/<id>.ts` | URL, category, titles, form fields, presets, “next steps” links |
| `apps/web/content/tools/<id>.md` | Text under the tool + FAQ |
| `apps/web/src/widgets/layout-scheme/<id>.tsx` | Layout scheme, only if needed |

Routes are generated from the registry (`generateStaticParams`, `dynamicParams = false`). See [Calculation Engine](../code/calc-engine.md) and the `new-calculator` skill spec.

## Cross-references

- [Product and Domain](../business/product-and-domain.md) — what the product is, calculator standard, catalog waves
- [Competitive Benchmark](../business/competitive-benchmark.md) — why the shared room and merged list are architectural differentiators
- [Calculation Engine](../code/calc-engine.md) — `ToolModule` contract and building blocks
- [Calculator Shell, Pages and Routing](../ui/calculator-shell-and-pages.md) — UI composition, routes, state storage
- [Server API and Data](../code/server-api-and-data.md) — Supabase tables, route handlers
- [Telegram Bot](../integrations/telegram-bot.md) and [AI Vision](../integrations/ai-vision.md)
- [SEO and Analytics](../business/seo-and-analytics.md)
- [Environments and CI/CD](../deploy/environments-and-ci.md)
- [Design System](../design/design-system.md)
- [Engineering Practices](../practices/engineering-practices.md)
- [Development Plan](../plan/development-plan.md)
- Source: `docs/specs/UmnyAut — техническая спецификация.md` §1–4

## File Structure

| Path | Description |
|---|---|
| `docs/specs/UmnyAut — бизнес-спецификация.md` | Business spec (RU), source of truth for product scope |
| `docs/specs/UmnyAut — техническая спецификация.md` | Technical spec (RU), source of truth for architecture |
| `docs/specs/UmnyAut — дизайн-спецификация.md` | Design spec (RU), source of truth for UI |
| `docs/specs/UmnyAut — макеты ключевых экранов.html` | Bundled mockups of 10 key screens (open in a browser) |
| `docs/specs/umnyaut-roadmap.mjs` | Script that syncs 104 roadmap tasks to GitHub Project #10 |
| `docs/specs/_СВОДКА_все_запросы.csv` | Wordstat demand for wave‑1 queries, 24 months |
| `docs/details/` | Brand assets: logos, favicons, mascot poses, concept references, mascot videos |
