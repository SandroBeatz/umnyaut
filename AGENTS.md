# AGENTS.md — UmnyAut

UmnyAut («Умняут») is a Russian-language renovation service: enter room dimensions once, get a verified merged shopping list in packs, rolls and bags for the selected renovation works. Markets: RU, KZ, BY, KG. Qalculator.ru is the primary benchmark, never a formula source of truth. Start every session from these rules; details live in `docs/` (index: `docs/README.md`).

## Status

Repo reset on 2026-10-08 (previous crossword project removed). Phases 1–6 and 8 done, Phase 9 without the DB parts; 10 live tools in prod. Phase 7 (short links `/p/<id>`, reports, limits on Supabase) done except P7.6 (country prices, C07). Phase 16 (room plan, layout schemes, laying guides — `docs/ui/room-plan-and-layout-guides.md`) in progress: laminate, linoleum, plinth, tile floor and walls, wallpaper (v4: chosen start, cutting plan, bare zones, whole strips or cut at opening edges) done; P16.9 (plan in room/wall area) done. Phase 17 (rooms and estimate — several rooms, one estimate with shared consumables; replaces the Phase 11 planner) in progress: stage A (estimate schema 2, `aggregateEstimate`, `entities/estimate` store) done, stages A–E done (rooms, room editor, calcs in a room, shared-consumable block, `/spisok/`, export, link snapshot, header list button), stage F verification (P17.15) and docs (P17.16, digest `docs/ui/rooms-and-estimate.md`) done — release `develop` → `main` waits for the owner; stage G waits for Phase 7 and the bot; RU spec `docs/specs/UmnyAut — комнаты и смета спецификация.md`. Yandex Webmaster, Metrika (counter `113671906`, 10 goals) and IndexNow live since 2026-10-19. Open owner items (Supabase, prices, master review, sitemap in Webmaster) — see the progress log. `pnpm check` runs every gate, `pnpm e2e` the phone journeys (see `docs/plan/development-plan.md`). Use Node 24 (`.nvmrc`) and pnpm 12 via corepack. Source specs (Russian) in `docs/specs/` are the source of truth; English digests in `docs/**`.

## Stack

pnpm workspaces + Turborepo, Node 24 · Next.js 16 App Router, React 19.2 + Compiler · Tailwind CSS 4 tokens · shadcn/ui (Radix) in `packages/ui` · Zustand (room only) · Zod everywhere · Supabase Postgres (server-only) · grammY · Gemini API (cheap Flash tiers) behind `VisionProvider` · Vitest, fast-check, Playwright, Lighthouse CI · Biome, Steiger, `tsc`. Prod: Docker + Caddy on a CIS VPS (`main`). Staging: Vercel (`develop`, PR previews).

## Hard rules

1. **Code computes, AI never does.** AI only turns photos/text into form parameters that the user confirms.
2. **Import boundaries**: `packages/calc` imports only Zod (no React, `fetch`, `Date.now()`, `Math.random()`); `catalog` → `calc` only; `ui` → nothing from the project; `apps/web/src` never imports `server/`; FSD layers import only downward; route files contain no business logic.
3. Every `apps/web/server/**` file starts with `import "server-only"`. The browser never talks to Supabase. RLS on all tables, **zero policies**.
4. Indexable pages are static: no `cookies()`/`headers()`. First client render = server render; apply URL/room/saved input after mount.
5. Calc: integer millimetres inside; packages rounded up only via `ceilPacks()`; `compute()` never throws on valid input (return warning codes); results in purchase units with related items; ≥ 10 golden examples with sources per tool; bump `version` when a formula changes.
6. A new tool = five files (calc module, golden, catalog entry, content Markdown, optional scheme) and **no new route**. One id everywhere (module, URL, content, analytics).
7. UI strings are Russian and live only in `catalog`/`content`. Code identifiers English or transliterated.
8. Nothing above the result: no ads, AI, mascot or banners push the purchase number down. Phone first screen ≤ 660 px to the result.
9. Design tokens only; one orange element per view, navy text on orange; tap targets ≥ 48 px; a11y ≥ 95. Every hint, warning or note shows the cat's **head** (40 px, `Hint` component), never the whole cat.
10. No Vercel-only APIs; same Node code runs on VPS and Vercel.
11. Never commit secrets; only `.env.example`. No force-push, prod migrations, deploys or DNS changes without explicit approval.
12. Depth before breadth: complete connected room workflows before adding unrelated tools. For every overlapping tool, compare at least three cases with Qalculator, derive the expected answer independently, and explain differences.

## Workflow

Feature branch → PR into `develop` → staging → PR `develop` → `main` → prod. Every finished step: tick its task in `docs/plan/development-plan.md` and add an entry to `docs/plan/progress-log.md` in the same commit (rules inside the log). Before a PR run the CI chain locally (Biome, Steiger, tsc, tests, build, server-HTML guard). Verify current library APIs via Context7.

## Skills and agents

Specs live in `docs/skills/` (new-calculator, calculator-release-check, tool-content, ui-component, db-migration, preflight) and `docs/agents/` (calc-engineer, formula-reviewer, frontend-builder, seo-content-writer, code-reviewer, platform-engineer). Materialize them per `docs/README.md` when asked.
