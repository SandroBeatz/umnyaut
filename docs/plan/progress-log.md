---
version: 1.1
date: 2026-10-09
category: plan
---

# Progress Log

> Version 1.1 · 2026-10-09 · [Plan](../plan/)

## Overview

A dated journal of every finished step on UmnyAut: what was done, where it landed (branch, commit, PR, deploy) and which plan task it closes. The [Development Plan](./development-plan.md) says **what** must be done; this log says **what actually happened and when**, including steps that deviated from the plan or were not in it at all.

The log exists so that anyone — the owner, a new contributor, or an AI agent starting a fresh session — can reconstruct the project's state without reading the whole git history or chat transcripts.

## Rules

1. **Every finished step gets an entry** — code, docs, infra, account setup, a decision. If it changed the project state, it is logged.
2. **Same change set as the work.** The entry is added in the same commit (or PR) as the step itself. Steps with no commit (an account created, a Vercel setting changed) get an entry in the next docs commit.
3. **Tick the plan.** If the step closes a task, tick its checkbox in [development-plan.md](./development-plan.md) in the same change. A partially done task stays unticked; the entry says what is left.
4. **Newest first.** One `###` heading per day (`YYYY-MM-DD`), entries below it in the order they happened.
5. **Deviations are explicit.** If a step was done differently from the plan or the reference docs, the entry has a **Deviation** line saying what differs and whether the docs need updating.
6. **No secrets.** Never paste keys, tokens or passwords — name the store they went into instead.
7. Entries are short: one line of what + a few labelled lines. Details belong in the commit message, PR or reference docs; link to them.

## Data Model

Each entry:

```markdown
- **<Plan ID or —>** <what was done, one line>
  - Where: <branch> · <commit/PR> · <deploy/environment, if any>
  - Notes: <what is left, follow-ups> (optional)
  - Deviation: <how it differs from plan/docs> (optional)
```

- **Plan ID** — task ID from the Development Plan (`P0.2`, `P5.4`), several separated by commas, or `—` for unplanned work.
- **Where** — short commit SHA (7 chars), PR number, and the environment it reached (`staging`, `prod`, `Vercel`).

## Log

### 2026-10-09

- **P5.1–P5.10** App shell, CalculatorShell and the first two tools. `calc`: `ploshchad-komnaty` v1 (rect, L = rect − corner cut-out, niche +, protrusion −; warnings `cut_too_large`, `protrusion_too_large`) and `ploshchad-sten` v1 (perimeter × height − openings, ceiling = floor; `opening_too_tall`, `openings_exceed_walls`), 13 + 10 hand-derived golden examples, fast-check arbitraries. `catalog`: both tools `live` with fields, presets, summary labels, step/warning texts and content; `FieldDef` gains `when` and room bindings (`cutLength`, `cutWidth`, `shape`, openings), `ToolDef` gains `summary` and `outcome`; all shell/header/footer strings in `shell.ts`; country `sign`. `web`: root layout with sticky header (phone menu sheet, desktop «Калькуляторы» panel, country chip) and navy footer; breadcrumbs; `entities/room` (Zustand persist `umnyaut:room:v1`, `skipHydration` + migration), `entities/country` (time zone → `umnyaut:country`), `entities/tool`; `features/edit-room` (RoomBar + sheet), `share-result` (`?s=` base64url of changed fields, send/copy/print), `pick-country`, `report-error` (stub); `widgets/calculator-shell` (`useCalculator`: defaults on the server → after mount `?s=` or room over saved values; ToolForm with ≤ 4 main fields, presets, «Ещё параметры · N», m/cm, openings; ResultPanel with `done` mascot, warnings, tiles, total; HowCalculated; NextSteps; sticky result bar; PrintSheet; inert AdSlot); canonical on tool and category pages; category skeleton; home lists live tools; print stylesheet. Tests: calc 49, catalog 9, web unit 39 (incl. jsdom), Playwright 7 on 390 × 844 (first screen ≤ 660 px — result ends at 643 px on wall area, room → wall carry-over, `?s=` round trip, invalid field, sticky bar, L-shape, no-JS numbers). `scripts/check-html.mjs` (title, one H1, canonical, result numbers) in `pnpm check` and CI; new CI job `e2e`.
  - Where: `feature/phase-5-app-shell`
  - Notes: P5.11 (prod deploy) is the owner's. Left for later phases: `calc_completed` analytics (Phase 9 events), real report-error sending and «Сохранить» (Phase 7), planner/«Мои расчёты»/info pages/cookie settings/bot link in header and footer (routes don't exist yet), desktop sheets are still bottom sheets (480 px dialog per design spec §11 to do), per-tool code splitting of calc modules (all modules are bundled; revisit when wave 1 lands). Header country chip is detected from the time zone, so a KG/KZ/BY visitor sees «KG · сом» etc.
  - Deviation: Steiger rule `fsd/insignificant-slice` is off — Steiger can't see the `views` layer or `app/` routes, so every slice used from there looked unused. Room area tool has no height field (it does not invent a room height). Wall area counts rectangles only (an L-room has the same perimeter). Panel caption sits next to the mascot to fit the 660 px budget.

- **— (P4 follow-up)** Phase 4 decisions that need real tools to confirm (`ceilPacks` tolerance, one pack for a tiny need, empty norms, harness on a demo tool only, `tsx` without the `esbuild` postinstall) written down in [Calculation Engine → Decisions to verify](../code/calc-engine.md#decisions-to-verify-in-real-testing); plan task P6.12 added to re-check them (owner request).
  - Where: `feature/phase-4-calc-core` · PR #149
- **P4.1–P4.9** Calc core, registry and content pipeline. `calc`: full contract types (`Quantity`, `Pack`, `PurchaseItem`, `Cost`, `Warning`, `Step`, `Room`, `Layout`); blocks `geometry` (rect, L, polygon, walls minus openings, door width), `packs` (`ceilPacks`, `purchase`, can-set optimiser `bestPackSet` by overpay or price), `waste`, `coverage`; golden harness (`GoldenFile`, partial `expected`, sources required, competitor `benchmarks` kept apart and differences must be explained); fast-check invariants (bought ≥ need, whole packs, finite, monotonic in area); 95% line gate (`vitest run --coverage`, now 99.5%); `pnpm calc:export` (Markdown/CSV); `ProjectData` v1 Zod schema + `migrateProject()` + `mergeItems()` stub. `catalog`: `FieldDef` with `main`/`planner`, presets, next steps, item photo keys, warning/step texts, category `icon`/`photo`, norms with `source` + `checkedAt` (empty until the first tool), `CountryConfig` skeleton, unit labels and pack nouns, `validateRegistry()`. `web`: `server/content` — Zod frontmatter (example + ≥ 3 FAQ required, length overflow = build warning), `{{norm.*}}` substitution (unknown norm fails the build), Markdown → sanitised HTML; tool page uses content H1/question/text/FAQ and title/description when a file exists; registry ↔ content ↔ golden test. Tests: calc 44, catalog 8, web 23.
  - Where: `feature/phase-4-calc-core`
  - Notes: no tool has a formula yet, so golden/invariant runs skip the `version: 0` placeholder; the harness is proven on a test-only demo tool. Checked by building with a temporary content file (title, description, H1, FAQ rendered; `<script>` stripped). `mergeItems()` keeps first-seen order — sorting by work order is P11.1.
  - Deviation: (1) `Warning` numbers sit in `values`, `Step` is `{ code, values }`, summary entries carry a `key` (spec showed flat objects). (2) `ceilPacks` tolerance is relative and only absorbs float noise; the spec's «10.0000001 must not become 11» example contradicts a 1e‑9 tolerance, so 10.0000001 → 11. fast-check also found that tiny needs (1e‑9, 5e‑324) gave 0 packs — fixed, any positive need buys ≥ 1. (3) fast-check generators live in `calc/test/arbitraries.ts` (one entry per tool) because `calc/src` may import only Zod; the new-calculator skill lists it. (4) `tsx` added for `calc:export`; its `esbuild` postinstall is disabled with `allowBuilds` (pnpm 12 fails installs on unapproved build scripts). (5) `@umnyaut/ui` gained a `./format` subpath so server code formats norms without importing components. (6) Frontmatter `question` is required.
- **— (P3.3 fix)** The white logo in `/dev/ui` sat on `bg-text`, which turns light in the dark theme, so the result was white on light. Added the fixed token `--color-brand-navy` (`#0F1E34` in both themes) and put the white logo on it. Rule written into the design system.
  - Where: `feature/phase-3-design-system`
- **P3.9** Trial material photos (laminate, wallpaper, tile adhesive) added to `docs/details/materials/` and accepted by the owner. Image pipeline now builds two groups: mascot (`/img/mascot/`, `mascotImages`) and materials (`/img/m/`, `materialImages`, keyed by `PurchaseItem.key`). Material photos are cropped, padded to a square with a 6% margin and encoded at 64, 96, 128, 192 px; AVIF at 128 px weighs 1.8–2.1 KB (budget 5 KB per AVIF file, all within). `/dev/ui` shows the three thumbs at 56, 64 and 96 px.
  - Where: `feature/phase-3-design-system`
  - Notes: the other 9 materials and 4 category photos come later. Each one needs a source file, an entry in `MATERIALS` and a run of `pnpm --filter web images`. Category photos need their own group (480/800 px) when the files arrive.
  - Deviation: sources are 1254 × 1254 px, not the briefed 1024 × 1024. That is fine, because the pipeline crops and resizes anyway.
- **— (G04–G06 prep)** Photo brief added to the [Content and Assets Plan](./content-plan.md): delivery format, one style (angle, light, palette with hex tones), base + per-item prompts for 12 wave-1 materials and 4 category photos, acceptance check. Owner generates the trial set (laminate, wallpaper, tile adhesive) first.
  - Where: `feature/phase-3-design-system`
  - Notes: P3.6 category icons stay as drafts for now (owner decision).
- **P3.1, P3.2, P3.3, P3.4, P3.5, P3.7, P3.8, P3.10, P3.11; P3.6 (partly)** Design system in `packages/ui`: full tokens (`@theme static`) + type-scale utilities; Onest variable subset 36 KB via `next/font/local` (preloaded); `Logo` and adaptive favicon; `formatNumber`/`formatMoney`/`plural`/`formatQuantity`/`formatDimensions`; components `Button`, `NumberField`, `UnitToggle`, `Stepper`, `Segment`, `ChoiceTileGroup`, `Select` (sheet on phone, dropdown ≥ 1024), `PresetChips`, `Accordion`, `Tabs`, `Dialog`, `Sheet`, `Toaster`, `Card`, `IconCircle`, `Mascot`, `MaterialThumb`; Lucide icons + 4 draft category icons; mascot pipeline (5 poses, hashed AVIF/WebP, CI budget check); `/dev/ui` gallery (light + dark, 404 on prod). Home stub now uses these components. Tests: ui 57 (NumberField comma/dot/empty/paste/blur, format, contrast pairs light + dark).
  - Where: `feature/phase-3-design-system`
  - Notes: left — P3.6 category icon drafts need owner approval (G03), P3.9 trial material photos (G04, not made yet); dialogs/sheet/select were checked in the build and gallery screenshots, opening them by hand on a real phone is still to do. Exit gate otherwise met (components on `/dev/ui`, contrast pairs hold, tests green, poses 1–5 + 4 icons in place).
  - Deviation: (1) components written by hand on `radix-ui`/`vaul`/`sonner` in shadcn's structure instead of `shadcn add` output. (2) `@fontsource-variable/onest` dropped — it is split by unicode range (`₽ ≈ → −` across files); the subset is cut from the google/fonts TTF at a pinned commit. (3) Mascot images are built by a script and committed, not built during `next build`. (4) Budgets apply to AVIF; WebP fallback may be 2×; `oops` budget set to 40 KB (spec has none). (5) Money uses `currencyDisplay: "symbol"`: recent CLDR gives KGS the new sign ⃀ (U+20C0), spec wants «сом». (6) Strings for `/dev/ui` live in `catalog/dev-ui.ts`.
- **P3.1 (partly)** Prod "coming soon" home in the project style: logo, badge «Скоро открытие», H1 «Одна комната — весь список покупок», promise line, three feature cards, mascot `hello` (blueprint pose) on a mint spot with a speech bubble; phone puts the mascot beside the bubble so the headline stays on the first screen. Design tokens (colours light + dark, radii, shadows, breakpoints, motion, z-index) in `packages/ui/src/theme.css`, imported by `globals.css`. Strings in `catalog` (`comingSoon`, `site.description`). Mascot exported to AVIF/WebP 320/640 (hero 2× AVIF 40 KB ≤ 60 KB budget); logo and favicon (`app/icon.svg`) from `docs/details/`.
  - Where: `feature/coming-soon-stub`
  - Notes: Onest comes from `next/font/google` (self-hosted at build, no runtime Google requests) until the P3.2 local subset; three Lucide icons are inlined until P3.6; image export was manual until the P3.7 pipeline. Home stays indexable (needed for the P0.6 robot fetch).
  - Deviation: CI and deploy smoke tests grepped for a bare `<h1>`; the styled H1 has a `class`, so both now match `<h1[ >]` (otherwise the prod deploy would fail after the slot switch).
- **P2.6, P2.8** Staging domain live: `staging.umnyaut.com` → CNAME to Vercel, 200 with `X-Robots-Tag: noindex, nofollow`. Stray Namecheap records (`umnyaut.com.umnyaut.com` A/TXT) deleted. Release #143 deployed to prod (`8bd2b9b5004d`).
  - Where: Vercel, Namecheap (owner) · `main` `8bd2b9b` · prod
- **P2.9** Registry-driven routes with one empty tool: `calc` gets a skeleton `ToolModule` contract and `toolModules` (`ploshchad-komnaty`, version 0, empty result); `catalog` gets `categories` (9 slugs), `reservedSegments`, a skeleton `ToolDef` with `status`, and the `tools` registry with tests (unique well-formed slugs, no reserved segment, catalog ↔ calc modules). Routes `app/[category]/page.tsx` and `app/[category]/[tool]/page.tsx` use `generateStaticParams` + `dynamicParams = false` and compose `views/category` and `views/tool`. Build prerenders `/osnova/` and `/osnova/ploshchad-komnaty/`; unknown category/tool → 404.
  - Where: `feature/p2-9-registry-routes`
  - Notes: the tool is `status: 'draft'`, so both pages are `noindex, nofollow` until P5.8 makes it `live`. P4.1/P4.6 extend the skeleton types; golden examples come with the formula.
  - Deviation: the tool route returns both `category` and `tool` params itself (a child segment only receives parent params from a layout's `generateStaticParams`, not a sibling page). `dev` added to reserved segments for `/dev/ui` (P3.11).
- **P2.5** Second release `62299c7` (#141) deployed to slot `green` in 54 s; `X-Robots-Tag: noindex` confirmed on the sslip.io host. Rollback tested: Deploy workflow with `rollback: true` → `blue` (`09ff1765d14b`), health confirmed; run again → back to `green` (`62299c73d3fc`). Exit gate "rollback tested once" met.
  - Where: `main` · `62299c7` · prod (VPS) · runs 37904457674, 37904554495
  - Notes: a second `rollback` swaps forward again (it always switches to the other slot). Phase 2 left: P2.6 staging domain, P2.7 Supabase, P2.8 DNS, P2.9, P2.10 Renovate app.
- **P2.2, P2.5 (partly), P0.6 (partly)** First prod deploy: merge #139 → `main` → Deploy workflow green in 3.5 min; `/api/health/` → `version 09ff1765d14b`, `env production`, `db skipped`; slot `blue` healthy, app ≈ 43 MB of 768 MB, ≈ 1.3 GB RAM free. Caddyfile now sends `X-Robots-Tag: noindex, nofollow` for any host but `umnyaut.com` (temporary sslip.io domain is not indexable). Reachability via Globalping (17 probes): all 200; RU 0.20–0.39 s, BY 0.19–0.29 s, KG 0.46 s, KZ 0.45–1.67 s.
  - Where: `main` · `09ff176` · prod (VPS, `129-101-115-71.sslip.io`); noindex on `feature/prod-followups`
  - Notes: rollback test runs on the next release (this PR). P0.6 left: real testers on RU mobile operators (no Beeline/MegaFon/Tele2 probes), robot fetch in Webmaster/Search Console after DNS. DNS at Namecheap still points to Lovable (`185.158.133.1`); switch = P2.8.
- **—** Decision (owner): AI features use an inexpensive **Gemini** model instead of Anthropic. Env `ANTHROPIC_API_KEY`/`ANTHROPIC_BASE_URL` → `GEMINI_API_KEY`/`GEMINI_BASE_URL` (`env.ts`, tests, `.env.example`); SDK `@google/genai` planned for P14.4; tiers fast = Flash-Lite, accurate = Flash, model ids verified at implementation.
  - Where: `feature/phase-2-infra`
  - Notes: Gemini API does not serve RU/BY, so prod (Timeweb, RU) still needs a relay outside RU via `GEMINI_BASE_URL`. Use a billing-enabled project (free-tier data may be used by Google). Account A31 changed to Google AI Studio.
  - Deviation: RU tech spec and AGENTS.md said Anthropic; AGENTS.md, AI vision, architecture, environments, runbook, accounts, dependencies and plan updated; RU spec not.
- **P2.2, P2.6 (partly)** Prod server bought (A06): Timeweb Cloud, Cloud NSK 40 (Novosibirsk, RU), 2 vCPU, 2 GB RAM, 40 GB NVMe, Ubuntu; IP kept out of the repo, goes to `DEPLOY_HOST`. Confirmed split: `develop` → Vercel staging with a plain Next build; `main` → image built in GitHub Actions → GHCR → VPS blue/green, nothing built on the server. Added [Prod Server Runbook](../deploy/prod-server-runbook.md). `bootstrap.sh`: several deploy keys (CI + owner), root by key only (refuses to run without a root key), 2 GB swap. `compose.yml`: `mem_limit: 768m` per slot. Vercel: `apps/web/vercel.json` (Next.js, `noindex`), removed root `vercel.json` and `stub/`.
  - Where: `feature/phase-2-infra`
  - Notes: before merging into `develop` the owner sets Vercel Root Directory `apps/web`, production branch `develop`, `ENABLE_EXPERIMENTAL_COREPACK=1`, `APP_ENV` — likely fix for the failing Vercel deploys (pnpm 12 vs Vercel's default pnpm 10). Server side done the same day: bootstrap ran on Ubuntu 26.04 (password SSH off, `deploy` user with CI key `umnyaut-gha` + owner key, ufw, 2 GB swap, Docker 29.9 + Compose 5.6), `/srv/umnyaut/{.env,web.env}` created, temporary `DOMAIN=129-101-115-71.sslip.io` until DNS; Caddy started with a 503 placeholder and obtained Let's Encrypt certificates. Outbound: GHCR, Docker Hub, Supabase, Telegram, Let's Encrypt OK; Anthropic `403 Request not allowed`. GitHub: environment `prod-vps` (branch `main` only) with `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS`; repo variables `DEPLOY_HOST`, `PROD_URL`. Left: first deploy from `main` + one rollback test, P0.6 for KZ/BY/KG, DNS (P2.8).
  - Deviation: (1) the server is in Russia with 2 GB RAM, while P0.6/A06 planned KZ/KG at 4 GB and a measurement before buying; RU visitors benefit, but Anthropic refuses RU IPs and Telegram Bot API is unreliable from RU — the planned `ANTHROPIC_BASE_URL`/`TELEGRAM_API_ROOT` relay becomes required for Phases 10–12; P0.6 reduces to checking KZ/BY/KG reachability. (2) GitHub environment renamed `production` → `prod-vps` in `deploy.yml`/`backup.yml` (the Vercel integration owns `Production`; names are case-insensitive). (3) `PermitRootLogin prohibit-password` instead of `no` — the deploy user has no sudo, so the owner keeps key-only root for administration.
- **—** Product decision (owner): Qalculator.ru is the primary benchmark competitor. Baseline features such as whole packages, related materials, price, sources, sharing and PDF are parity, not positioning. New promise: «Введите размеры один раз — получите проверенный список покупок для всего ремонта»; H1: «Одна комната — весь список покупок».
  - Where: `feature/phase-2-infra` · documentation change set
  - Notes: Added the benchmark protocol; changed research, formula evidence, SEO/content and roadmap gates; introduced a minimal connected wall list in Phase 6. The 30-tool list is a ranked backlog and 60–80 is a conditional ceiling, not a KPI. P0.5/P0.7/P0.9 remain open until the research records, comparison cases and product copy are implemented.

### 2026-10-08

- **—** Decision (owner): **one** Supabase Free project `umnyaut`, prod only. Local dev uses the Docker stack; preview/staging run without a DB (DB features answer “unavailable on staging” from Phase 7). `db-dev.yml` removed; variables renamed to `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`, `SUPABASE_DB_URL`.
  - Where: `feature/phase-2-infra` · PR #138
  - Deviation: docs planned two projects (`umnyaut-dev`, `umnyaut-prod`); environments, data, accounts docs, plan (P2.7, Phase 7 needs) and platform-engineer agent updated. RU tech spec still says two.
- **P2.1, P2.3, P2.4** Prod Docker image (`apps/web/Dockerfile`: Node 24 alpine, `pnpm fetch` layer, standalone, user `node`, `HEALTHCHECK`, `APP_VERSION`), `GET /api/health/` (`{ ok, data: { version, env, db } }`; DB ping via Supabase REST, `skipped` until configured, 503 on failure; 4 tests), CI `ci.yml` (Biome, guard, Steiger, tsc, tests, build; Docker build + container smoke test incl. invalid-env refusal; infra lint).
  - Where: `feature/phase-2-infra`
  - Notes: the image was not built locally (Docker Desktop did not start); first real build and smoke test passed in CI on PR #138.
  - Open issue: Vercel deployments fail (0 s, before build) since PR #137 — every preview and the `develop` push. Prod on Vercel (`main` = stub) is unaffected. Logs need a Vercel login; likely cause is the new root `package.json` (`packageManager: pnpm@12`, `engines`), fix belongs to P2.6.
- **P2.2, P2.5, P2.7, P2.10 (partly)** Code side done, account/server side open:
  - P2.2 `infra/compose.yml` (Caddy + blue/green slots), `Caddyfile` (TLS, zstd/gzip, `www`→apex, headers, IP-masked logs), `bootstrap.sh`, `deploy.sh deploy|rollback|status`. Left: run on a real VPS (needs P0.6).
  - P2.5 `deploy.yml`: GHCR push on every `main` push; migrate, SSH deploy, smoke test and manual rollback run once repo variables/secrets exist. Left: VPS, secrets, first deploy, one rollback test.
  - P2.7 `supabase init` in `packages/db` (local auth/storage/realtime/edge/analytics off), `0001_init.sql` (`pgcrypto`, `pg_cron`, default privileges revoked from `anon`/`authenticated`), `db:*` scripts. Left: create the Supabase project (A12, A13), set variables/secrets, run the local stack once (needs Docker), generate `src/types.ts`.
  - P2.10 `renovate.json` (monthly, into `develop`, grouped, Node < 25) and `backup.yml` (weekly `pg_dump`, AES-encrypted artifact, 35 days). Left: install the Renovate app (A18), set backup variables/secrets.
  - Deviation: migrations live in `packages/db/supabase/migrations/` (Supabase CLI requires `<workdir>/supabase/migrations`), not `packages/db/migrations` — data doc and `db-migration` skill updated; the RU tech spec still says the old path. The plan's `scheduled.yml` became `backup.yml`; uptime checks stay in Phase 9 (P9.9). Backups are GitHub artifacts encrypted with a passphrase because the repo is public.
- **P1.1–P1.11** Phase 1 monorepo foundation: pnpm 12 workspaces + Turborepo 2.11, Node 24 pin, shared `tooling/{tsconfig,vitest}`, root `biome.json`, package skeletons `@umnyaut/{calc,catalog,ui,db}`, `apps/web` (Next 16.4 standalone, `trailingSlash`, React Compiler, Tailwind 4, FSD folders), `server/platform` (`env.ts` with Zod + tests, `client-ip.ts`, `after.ts`), boundary guard, `.env.example`, Claude permissions, `preflight` skill built. Exit gate passed: `pnpm check` green on a clean clone; importing `server/` from `src/` fails `pnpm guard`, Biome and `next build`.
  - Where: `feature/phase-1-foundation` · PR #137 · merged into `develop` (`8296f1a`)
  - Notes: spike result — TypeScript 7.0.2 works with Next 16.4, Vitest 5 and Steiger 0.7 (recorded in [Dependencies](./dependencies.md)). Vercel still serves `stub/` (root `vercel.json` has empty install/build commands).
  - Deviation: (1) Steiger 0.7 hardcodes FSD layer names and ignores `views`, so layer order (incl. `views`) is enforced by `tooling/scripts/check-boundaries.mjs` (`pnpm guard`) — [Architecture Overview](../architecture/overview.md) updated. (2) No `tooling/biome` package: one `biome.json` at the root is enough. (3) Biome, guard and Steiger run as root scripts, not Turborepo tasks (they scan the whole repo in milliseconds); Turborepo runs `typecheck`, `test`, `build`. (4) `zod` added to `calc`/`catalog` now (plan said Phase 4) so the allowed-deps rule is real from day one. (5) Turborepo 2.11 writes an agent-guidance block into `AGENTS.md`; disabled with `"agentGuidance": false` in `turbo.json`.
- **P0.1** Reset the repo for UmnyAut: removed the old crossword project, added `docs/` (reference docs, skill and agent specs, plan), `AGENTS.md`, `CLAUDE.md`; built skills and agents.
  - Where: `develop` · `1b73084`
- **—** Merged the legacy remote `develop` history into the new tree, keeping only the UmnyAut files, so no force-push is needed.
  - Where: `develop` · `1676307`
- **—** Static staging stub page: `stub/index.html` (design-system tokens, Onest, mascot `hello` in AVIF/WebP, wave-1 tool list, laminate example) served by root `vercel.json` (no build, `outputDirectory: stub`, `X-Robots-Tag: noindex`).
  - Where: `develop` · `f262dca`
  - Notes: delete `stub/` and `vercel.json` when the Next.js app lands (Phase 1–2); then set the Vercel Root Directory to `apps/web`.
- **P0.2 (partly)** Fast-forwarded `main` to `develop` (old crossword code dropped from `main`, history kept) and pushed both branches. Vercel project settings adjusted by the owner; the stub is live.
  - Where: `main` = `develop` = `f262dca` · Vercel (production branch `main`)
  - Notes: P0.2 still open — archive the old remote branch as `legacy/develop` (or decide it is unnecessary now that its history is merged).
  - Deviation: per [Environments and CI/CD](../deploy/environments-and-ci.md), Vercel serves `develop` (staging) and `main` goes to the VPS. Until the VPS exists (P0.6, Phase 2), Vercel deploys from `main`; switch the production branch to `develop` when the VPS pipeline is set up.

## Cross-references

- [Development Plan](./development-plan.md) — the task list and IDs this log references
- [Accounts and Services](./accounts-and-services.md) — account IDs (`A…`) mentioned in entries
- [Environments and CI/CD](../deploy/environments-and-ci.md) — target branch → environment mapping that deviations are measured against
- [Engineering Practices](../practices/engineering-practices.md) — git workflow and commit conventions
