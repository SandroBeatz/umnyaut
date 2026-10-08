# AGENTS.md — UmnyAut

UmnyAut («Умняут») is a Russian-language renovation calculator service: enter room dimensions once, get a shopping list in packs, rolls and bags with a total. Markets: RU, KZ, BY, KG. Start every session from these rules; details live in `docs/` (index: `docs/README.md`).

## Status

Repo reset on 2026-10-08 (previous crossword project removed). Only `docs/` exists; code starts with milestone 1.1 (see `docs/plan/development-plan.md`). Source specs (Russian) in `docs/specs/` are the source of truth; English digests in `docs/**`.

## Stack

pnpm workspaces + Turborepo, Node 24 · Next.js 16 App Router, React 19.2 + Compiler · Tailwind CSS 4 tokens · shadcn/ui (Radix) in `packages/ui` · Zustand (room only) · Zod everywhere · Supabase Postgres (server-only) · grammY · Anthropic API behind `VisionProvider` · Vitest, fast-check, Playwright, Lighthouse CI · Biome, Steiger, `tsc`. Prod: Docker + Caddy on a CIS VPS (`main`). Staging: Vercel (`develop`, PR previews).

## Hard rules

1. **Code computes, AI never does.** AI only turns photos/text into form parameters that the user confirms.
2. **Import boundaries**: `packages/calc` imports only Zod (no React, `fetch`, `Date.now()`, `Math.random()`); `catalog` → `calc` only; `ui` → nothing from the project; `apps/web/src` never imports `server/`; FSD layers import only downward; route files contain no business logic.
3. Every `apps/web/server/**` file starts with `import "server-only"`. The browser never talks to Supabase. RLS on all tables, **zero policies**.
4. Indexable pages are static: no `cookies()`/`headers()`. First client render = server render; apply URL/room/saved input after mount.
5. Calc: integer millimetres inside; packages rounded up only via `ceilPacks()`; `compute()` never throws on valid input (return warning codes); results in purchase units with related items; ≥ 10 golden examples with sources per tool; bump `version` when a formula changes.
6. A new tool = five files (calc module, golden, catalog entry, content Markdown, optional scheme) and **no new route**. One id everywhere (module, URL, content, analytics).
7. UI strings are Russian and live only in `catalog`/`content`. Code identifiers English or transliterated.
8. Nothing above the result: no ads, AI, mascot or banners push the purchase number down. Phone first screen ≤ 660 px to the result.
9. Design tokens only; one orange element per view, navy text on orange; tap targets ≥ 48 px; a11y ≥ 95.
10. No Vercel-only APIs; same Node code runs on VPS and Vercel.
11. Never commit secrets; only `.env.example`. No force-push, prod migrations, deploys or DNS changes without explicit approval.

## Workflow

Feature branch → PR into `develop` → staging → PR `develop` → `main` → prod. Before a PR run the CI chain locally (Biome, Steiger, tsc, tests, build, server-HTML guard). Verify current library APIs via Context7.

## Skills and agents

Specs live in `docs/skills/` (new-calculator, calculator-release-check, tool-content, ui-component, db-migration, preflight) and `docs/agents/` (calc-engineer, formula-reviewer, frontend-builder, seo-content-writer, code-reviewer, platform-engineer). Materialize them per `docs/README.md` when asked.
