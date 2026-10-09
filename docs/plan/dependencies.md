---
version: 1.1
date: 2026-10-08
category: plan
---

# Dependencies Manifest

> Version 1.1 · 2026-10-08 · [Plan](../plan/)

## Overview

Every tool, CLI and npm package the stack in the technical spec requires, grouped by workspace and by the phase that installs it. Versions are the latest on npm as of **2026-10-08**; the lockfile pins the exact versions on install day (tech spec §2). Anything not listed here needs a reason in the PR that adds it — the spec deliberately excludes ORMs, tRPC/GraphQL, Redux/React Query, CMS, i18n libraries, client Supabase SDK, CDN/Redis.

## Architecture

### Version decisions (Phase 1 spike, decided 2026-10-08)

| Item | Latest | Spec says | Decision |
|---|---|---|---|
| Node.js | local machine has **v26.0.0** | Node 24 LTS | **Decided: 24 LTS** in `.nvmrc` and `engines` (`>=24 <25`); Dockerfile and CI follow in Phase 2. Locally via nvm (`nvm use`, 24.21.0). Revisit when Node 26 becomes LTS |
| TypeScript | **7.0.2** (native port) | `strict`, `tsc --noEmit` | **Decided: 7.0.2.** `tsc --noEmit` in every package, Next 16.4 build's TypeScript step, Vitest 5 and Steiger 0.7 all pass. Only noise: `tsconfck` (via Steiger) declares peer `typescript ^5` — harmless, it parses tsconfig JSON only |
| Zod | 4.6.5 | Zod | Use v4 API (`z.object`, `z.infer`, `.check`), verify via Context7 |
| React | 19.3.0 | 19.2 + Compiler | **Decided: 19.3.0** (peers cleanly with `next@16.4.0`) |
| lucide-react | 1.53.0 | Lucide | v1 API; per-icon imports |

### Global tools (developer machine, Phase 0–1)

| Tool | Version | Purpose | Install |
|---|---|---|---|
| Node.js 24 LTS | 24.x | Runtime | `fnm install 24 && fnm use 24` (or mise/volta) |
| pnpm | 12.10.1 | Package manager | Pinned by `packageManager` in root `package.json`; `corepack enable` under Node 24 picks it up. Make sure no other global `pnpm` shadows it — Turborepo runs tasks with the first `pnpm` on `PATH` |
| Docker Desktop / OrbStack | latest | Local Supabase, image smoke test | Installer |
| Supabase CLI | 2.120.0 | Local DB, migrations, types | devDependency `supabase` (run via `pnpm supabase`) |
| GitHub CLI `gh` | latest | PRs, roadmap script, GHCR | `brew install gh` |
| Git | latest | — | present |

### Root workspace (`package.json` at repo root) — Phase 1

| Package | Version | Why |
|---|---|---|
| `turbo` | 2.11.7 | Task graph, caching, affected builds |
| `typescript` | 7.0.2 (see decision) | Types everywhere |
| `@biomejs/biome` | 2.5.15 | Lint + format (replaces ESLint/Prettier) |
| `steiger` | 0.7.0 | FSD layer linter |
| `@feature-sliced/steiger-plugin` | 0.8.0 | FSD rules for Steiger |
| `vitest` | 5.0.3 | Unit/integration tests |
| `@vitest/coverage-v8` | 5.0.3 | Coverage (≥ 95% for `calc`) |

### `packages/calc` — Phase 4

| Package | Version | Kind | Why |
|---|---|---|---|
| `zod` | 4.6.5 | dependency | **Only** runtime dependency allowed |
| `fast-check` | 4.10.2 | dev | Invariant/property tests |

### `packages/catalog` — Phase 4

| Package | Version | Kind |
|---|---|---|
| `@umnyaut/calc` | workspace | dependency |
| `zod` | 4.6.5 | dependency |

### `packages/ui` — Phase 3

| Package | Version | Kind | Why |
|---|---|---|---|
| `react`, `react-dom` | 19.3.0 | peer | Components |
| `radix-ui` | 1.7.0 | dependency | Primitives under shadcn/ui (dialog, select, tabs, accordion, toggle-group) |
| `class-variance-authority` | 0.7.1 | dependency | Variants (`primary`, `accent`, `secondary`, `ghost`, `danger`, `icon`) |
| `clsx` | 2.1.1 | dependency | Class composition |
| `tailwind-merge` | 3.7.0 | dependency | `cn()` helper |
| `lucide-react` | 1.53.0 | dependency | Icons |
| `vaul` | 1.1.2 | dependency | Bottom sheet (shadcn Drawer) on phone |
| `sonner` | 2.0.8 | dependency | Toasts (“Ссылка скопирована”) |
| `subset-font` | 2.9.0 | dev | Subsets the full Onest variable TTF (google/fonts, pinned commit) to `onest-var.woff2` — fontsource ships it split by unicode range, so it was dropped |
| `@testing-library/react` | 16.3.3 | dev | Component tests |
| `@testing-library/user-event` | 14.6.7 | dev | Interactions |
| `jsdom` | 30.1.2 | dev | Test DOM |

shadcn/ui is not a dependency: components are generated with `pnpm dlx shadcn@latest add <component>` and copied into `packages/ui` (button, dialog, drawer, accordion, tabs, select, toggle-group, sonner).

### `packages/db` — Phase 7

| Package | Version | Kind | Why |
|---|---|---|---|
| `@supabase/supabase-js` | 2.117.3 | dependency | Server-only client used by `apps/web/server/db` |
| `supabase` | 2.120.0 | dev | CLI: `supabase start`, `migration new`, `gen types` |

### `apps/web` — Phases 1, 5, 7–9, 12, 14

| Package | Version | Kind | Phase | Why |
|---|---|---|---|---|
| `next` | 16.4.0 | dep | 1 | Framework (`output: "standalone"`, `trailingSlash: true`) |
| `react`, `react-dom` | 19.3.0 | dep | 1 | — |
| `babel-plugin-react-compiler` | 1.0.0 | dev | 1 | React Compiler |
| `tailwindcss`, `@tailwindcss/postcss` | 4.3.3 | dev | 1 | Styles, `@theme` tokens |
| `@types/react`, `@types/react-dom`, `@types/node` | 19.3.0 / 19.3.0 / 24.19.1 | dev | 1 | Types for React 19 and Node 24 (not in the original list; required by `tsc`) |
| `server-only` | 0.0.1 | dep | 1 | Breaks build if server code is imported in the browser |
| `zod` | 4.6.5 | dep | 1 | Env, API bodies, frontmatter |
| `@t3-oss/env-nextjs` | 0.13.11 | dep | 1 | *Optional* typed env on top of Zod; a plain Zod schema in `server/platform/env.ts` is equally fine |
| `zustand` | 5.0.15 | dep | 5 | “My room” store with `persist` |
| `gray-matter` | 4.0.3 | dev | 4 | Frontmatter parsing in the content build script |
| `unified`, `remark-parse`, `remark-rehype`, `rehype-sanitize`, `rehype-stringify` | 11.0.5 / 11.0.0 / 11.1.2 / 6.0.0 / 10.0.1 | dev | 4 | Markdown → sanitized HTML at build (no MDX by decision) |
| `sharp` | 0.35.5 | dev | 3 | Build-time AVIF/WebP for mascot and material photos |
| `schema-dts` | 2.1.0 | dev | 9 | Typed JSON-LD (`WebApplication`, `FAQPage`, `BreadcrumbList`) |
| `@playwright/test` | 1.64.0 | dev | 5 | E2E on phone viewport |
| `@lhci/cli` | 0.15.1 | dev | 9 | Lighthouse CI thresholds |
| `grammy` | 1.46.0 | dep | 12 | Telegram bot (webhook mode) |
| `@google/genai` | 2.28.0 | dep | 14 | `VisionProvider` implementation (Gemini API) |

Not installed as packages: Telegram `telegram-web-app.js` (loaded from Telegram on `/tg/` only), Yandex Metrika `tag.js` (loaded after consent).

### Infrastructure (Phase 2)

| Component | Version | Where |
|---|---|---|
| Ubuntu LTS | latest LTS | VPS |
| Docker Engine + Compose plugin | latest | VPS |
| Caddy | 2.x official image | `infra/compose.yml` |
| Node.js 24 (alpine/slim) | 24.x | `apps/web/Dockerfile` |
| GitHub Actions: `actions/checkout`, `pnpm/action-setup`, `actions/setup-node`, `docker/setup-buildx-action`, `docker/login-action`, `docker/build-push-action`, `supabase/setup-cli` | latest majors | `.github/workflows/*` |

## Configuration

Install commands per phase are listed in the [Development Plan](./development-plan.md). Always install with `pnpm add --filter <workspace>`; never add a runtime dependency to `packages/calc` other than Zod.

## Usage

```bash
# Phase 1 example
pnpm add -Dw turbo typescript @biomejs/biome steiger @feature-sliced/steiger-plugin vitest @vitest/coverage-v8
pnpm add --filter web next react react-dom server-only zod
pnpm add -D --filter web babel-plugin-react-compiler tailwindcss @tailwindcss/postcss
```

## Cross-references

- [Development Plan](./development-plan.md)
- [Accounts and Services](./accounts-and-services.md)
- [Engineering Practices](../practices/engineering-practices.md) — stack rationale
- [Architecture Overview](../architecture/overview.md) — what is deliberately not in the stack
