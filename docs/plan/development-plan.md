---
version: 2.2
date: 2026-10-09
category: plan
---

# Development Plan

> Version 2.2 · 2026-10-09 · [Plan](../plan/)

## Overview

The complete phased plan for building UmnyAut: the website (mobile-first), the calculators, the Telegram mini app (the mobile app channel), and filling the site with content. Phases are **strictly sequential gates**: a phase's tasks may overlap in time with the next one, but the next phase's *exit gate* cannot pass before the previous one's.

Every phase has the same structure:

- **Goal** and **dates** (from the business-spec roadmap and tech spec §19);
- **Needs** — accounts (`A…` → [Accounts and Services](./accounts-and-services.md)), content and assets (`C…`/`G…` → [Content and Assets Plan](./content-plan.md));
- **Install** — exact packages (→ [Dependencies](./dependencies.md));
- **Tasks** — checkboxes with IDs (`P3.4`), each with a verifiable result;
- **Exit gate** — objective conditions to move on;
- **Who** — which agent / skill does the work (`.claude/agents`, `.claude/skills`).

When a task is done, tick it here and add an entry to the [Progress Log](./progress-log.md) in the same commit.

Capacity: 8–10 h/week. Rule from the tech spec: **one tool goes all the way to prod before the other nine are written** — “Wall area” must be live on `umnyaut.com` by **8 Nov 2026**.

Product sequencing is **depth before breadth**. Qalculator.ru is the mandatory benchmark for every overlapping calculator, while UmnyAut's first differentiating proof is a connected room chain and merged shopping list. The 30-tool list is a ranked backlog; 60–80 is a conditional ceiling, not a success KPI.

**Mobile is not a separate phase.** The site is designed from 360 px up; every phase that ships UI has a mobile gate (390 × 844 first-screen budget 660 px, real iPhone Safari + Android Chrome check). There is no native app: the Telegram mini app (Phase 12) and a PWA manifest (Phase 9) cover the “app” need.

## Phase map

| # | Phase | Dates | Stage | Exit gate |
|---|---|---|---|---|
| 0 | Accounts, decisions, research | 8–21 Oct 2026 | 0 | VPS chosen, accounts ready, first connected path fixed, Qalculator benchmark recorded |
| 1 | Repository & tooling foundation | 22–25 Oct | 1 | Monorepo builds, lint/type/test green |
| 2 | Infrastructure & CI/CD | 22–28 Oct | 1 | PR → preview; `main` → VPS; Lovable removed |
| 3 | Design system (`packages/ui`) | 26 Oct – 8 Nov | 1 | Tokens, font, base components, brand & mascot assets |
| 4 | Calc core, registry, content pipeline | 26 Oct – 1 Nov | 1 | `calc` blocks + golden harness green |
| 5 | App shell & CalculatorShell + first 2 tools | 28 Oct – 8 Nov | 1 | Room area + Wall area **in prod** |
| 6 | Wave 1 calculators (8 more) | 7–27 Nov | 1 | 10 tools + first connected wall list pass release check |
| 7 | Saving, sharing, server API, countries | 9–15 Nov | 1 | Project opens by link on another device |
| 8 | Site pages & content filling | 16–27 Nov | 1 | All launch pages with final copy |
| 9 | Consent, analytics, SEO, launch | 18–30 Nov | 1 | **Checkpoint M1** |
| 10 | Wave 2 calculators + layout schemes | 1 Dec – 24 Jan 2027 | 2 | 20 tools live |
| 11 | Renovation planner v1 | 8 Dec – 14 Jan | 2 | Planner + projects + return metric |
| 12 | Telegram bot & mini app | 5–27 Jan | 2 | Bot live, mini app in light/dark |
| 13 | Growth operations | Dec – Jan | 2 | **Checkpoint M3** |
| 14 | Season: wave 3, variations, master mode, AI, monetization tests | Feb – Apr 2027 | 3 | **Checkpoint M6** |
| 15 | Scale | May – Oct 2027 | 4 | **Checkpoint M12** |

---

## Phase 0 — Accounts, decisions, research (8–21 Oct 2026)

**Goal:** everything that blocks code is resolved: accounts, the VPS, the ranked tool backlog, first connected path, norm sources and benchmark baseline.

**Needs:** A01–A11. Content C01, C02 (drafts).

**Install (local machine):** Node 24 LTS via fnm/mise, pnpm 12 via corepack, Docker Desktop/OrbStack, `gh`.

**Tasks**

- [x] P0.1 Reset repo on `develop`, write docs, skill & agent specs; build skills and agents.
- [ ] P0.2 Commit the reset; archive old remote branch as `legacy/develop`; push new `develop` (`--force-with-lease`, owner approval).
- [ ] P0.3 Domain mailbox `hello@`, `dev@` (A02); password vault (A03); 2FA + branch protection (A04); `gh auth` (A05).
- [ ] P0.4 Webmaster, Search Console, Metrika counter (not installed), Wordstat (A08–A11).
- [ ] P0.5 Research per business spec §5: 60 candidates → demand → SERP → competitors → scoring → first 30 ranked. Qalculator is the primary benchmark: record catalog/SEO/UX/monetization baseline and per-wave overlap; choose the first complete wall chain before unrelated breadth (owner; agents help with SERP/competitor analysis).
- [ ] P0.6 **VPS measurement** (A06, A07): rent 1–2 KZ/KG servers; deploy a throwaway tool-weight page with Docker + Caddy; measure from RU (4 mobile operators, 2–3 ISPs, ≥ 2 regions), KZ, BY, KG; robot fetch in Webmaster/Search Console; outbound test to Supabase, Gemini API, Telegram Bot API. Pass = < 5 s everywhere + all three outbound OK. Buy the winner.
- [ ] P0.7 Norm sources + golden drafts for wave 1 (C01, C02): ≥ 3 shared Qalculator scenarios per overlapping tool, independently derived and with every result difference explained.
- [ ] P0.8 Merge design-spec §18 amendments into the RU tech spec (`main` field flag, `question`, `photo`/`icon`, `sharp`, image budgets, one font, `via`, Telegram theme).
- [ ] P0.9 Apply the decided home headline from C13; decide mascot pose candidates (G02) and confirm mp4 clips stay out of launch (G15). TypeScript 7 vs 5.x decided in P1.2.
- [ ] P0.10 Start looking for the formula reviewer (A26), due end of Nov.

**Exit gate:** VPS paid and measured; A01–A11 done; first 30 ranked; first connected wall path fixed; Qalculator baseline recorded; ≥ 2 primary sources per wave‑1 tool.

**Who:** owner; `formula-reviewer` for sources; `platform-engineer` for the VPS test page.

---

## Phase 1 — Repository & tooling foundation (22–25 Oct)

**Goal:** an empty but fully wired monorepo where every check runs.

**Needs:** A04, A05. **Install:** see [Dependencies › Root, apps/web (phase 1)](./dependencies.md).

```bash
pnpm init && pnpm add -Dw turbo typescript @biomejs/biome steiger @feature-sliced/steiger-plugin vitest @vitest/coverage-v8
pnpm create next-app apps/web   # then align: App Router, TS, Tailwind 4, no ESLint (Biome instead)
pnpm add --filter web next react react-dom server-only zod
pnpm add -D --filter web babel-plugin-react-compiler tailwindcss @tailwindcss/postcss
```

**Tasks**

- [x] P1.1 `pnpm-workspace.yaml` (`apps/*`, `packages/*`, `tooling/*`), `turbo.json` (lint, typecheck, test, build with correct `dependsOn`/outputs), `.nvmrc` = 24, `engines`.
- [x] P1.2 Version spike: TypeScript 7 with Next 16.4 + Vitest 5 + Steiger. Pin result in `dependencies.md`.
- [x] P1.3 `tooling/tsconfig` (strict, `noUncheckedIndexedAccess`), `tooling/biome` (`biome.json` at root), `tooling/vitest` shared config.
- [x] P1.4 Packages skeletons with `package.json` + `src/index.ts`: `@umnyaut/calc`, `@umnyaut/catalog`, `@umnyaut/ui`, `@umnyaut/db`. Enforce allowed deps (calc → zod only).
- [x] P1.5 `apps/web`: Next 16 with `output: "standalone"`, `trailingSlash: true`, React Compiler on; folders `app/`, `src/{views,widgets,features,entities,shared}`, `server/`, `content/`, `e2e/`.
- [x] P1.6 Steiger config with FSD plugin; `views` as pages layer.
- [x] P1.7 `server/platform/`: `env.ts` (Zod schema, fail fast), `client-ip.ts`, `after.ts`; rule `import "server-only"` (Biome/grep check in CI).
- [x] P1.8 Root scripts: `lint`, `format`, `typecheck`, `test`, `build`, `steiger`, `check` (all).
- [x] P1.9 `.env.example` with all variable names; `.gitignore` updated (`.next`, `.turbo`, `coverage`, `.env*`).
- [x] P1.10 Update `.claude/settings.json` permissions for pnpm/turbo/supabase (old npm/bd entries out).
- [x] P1.11 Build the `preflight` skill (spec status draft → ready → built).

**Exit gate:** `pnpm check` green on a clean clone; `import` of `server/` from `src/` fails the build.

**Who:** `platform-engineer`. Review: `code-reviewer`.

---

## Phase 2 — Infrastructure & CI/CD (22–28 Oct)

**Goal:** the deploy path works end to end before any feature exists.

**Needs:** A06 (server), A12–A18. **Install:** Docker on VPS; `supabase` CLI dev dep.

**Tasks**

- [x] P2.1 `apps/web/Dockerfile` (multi-stage, Node 24, standalone, non-root user, healthcheck).
- [x] P2.2 `infra/compose.yml` (`web`, `caddy`), `infra/Caddyfile` (TLS, gzip+zstd, `www`→apex, security headers, upstream switch), `infra/bootstrap.sh` (user, SSH-key only, firewall 22/80/443, unattended upgrades, Docker), `infra/deploy.sh` (pull tag → start new → `/api/health` → switch → stop old), rollback command.
- [x] P2.3 `GET /api/health` (app + DB ping).
- [x] P2.4 `.github/workflows/ci.yml`: pnpm cache → Biome, Steiger, tsc → tests → `next build` → Docker build + container smoke test.
- [x] P2.5 `.github/workflows/deploy.yml` (on `main`): build & push to GHCR with SHA tag → migrations to prod → SSH deploy → external smoke test.
- [x] P2.6 Vercel project (A14) for `develop` + PR previews; `APP_ENV` → `X-Robots-Tag: noindex` middleware/headers for non-prod.
- [ ] P2.7 Supabase project `umnyaut` — one, Free, prod only (A12, A13); `supabase init` in `packages/db`; local stack runs; migration `0001_init.sql` (empty schema + extensions); CI applies migrations to prod on merge to `main` (no dev project; staging runs without a DB).
- [x] P2.8 DNS switch (A16): `umnyaut.com` → VPS (removes Lovable stub), `staging` → Vercel.
- [x] P2.9 Registry-driven routes with **one empty tool** (`generateStaticParams`, `dynamicParams = false`).
- [ ] P2.10 Renovate (A18); weekly `pg_dump` workflow (A25 can wait until Phase 9).

**Exit gate:** a PR gets a preview URL; merge to `main` deploys to VPS; rollback tested once; `umnyaut.com` serves the new app.

**Who:** `platform-engineer`. Skills: `db-migration`, `preflight`.

---

## Phase 3 — Design system (26 Oct – 8 Nov)

**Goal:** `packages/ui` contains everything the shell and pages need; brand and mascot assets are processed.

**Needs:** A19, A20 (A21 optional). Assets G01–G04. **Install:** `radix-ui class-variance-authority clsx tailwind-merge lucide-react vaul sonner` (ui), dev `@fontsource-variable/onest subset-font @testing-library/react @testing-library/user-event jsdom` (ui), `sharp` (web dev).

**Tasks**

- [x] P3.1 Tokens in `packages/ui/src/theme.css` via `@theme`: all colour tokens light + dark (`data-theme="dark"`), radii, shadows, z-index scale, motion durations + curve, spacing scale, breakpoints (sm 640, lg 1024, xl 1280).
- [x] P3.2 Font: subset Onest variable → `onest-var.woff2` (Latin, Cyrillic, `₽ ₸ × ² ³ ≈ → − — « » № °`), `next/font/local` with `display: swap`, preload, fallback with `size-adjust`. Type scale utilities (`display … input`).
- [x] P3.3 Brand assets → `packages/ui/assets/brand/`; `Logo` component (32/40 px, optical −7% shift); favicons via `prefers-color-scheme`.
- [x] P3.4 Number formatting helpers: `formatNumber`, `formatMoney` (`Intl.NumberFormat` per country locale), `plural` (`Intl.PluralRules`), dimension formatter («4,6 × 4,3 × 2,7 м»), NBSP rules.
- [x] P3.5 Base components (shadcn generated, restyled to tokens): `Button` (primary, accent, secondary, ghost, danger, icon; 56/48/40; loading), `NumberField` (m/cm, comma/dot, decimal keyboard, validate on blur), `UnitToggle`, `Stepper`, `Segment`, `ChoiceTile`, `Select` (sheet on phone / dropdown ≥ 1024), `PresetChips`, `Accordion`, `Tabs`, `Sheet`/`Dialog` (vaul / radix), `Toast` (sonner), `Card`, `IconCircle`.
- [ ] P3.6 Icons: Lucide per-icon imports; 4 custom category icons (G03) as components.
- [x] P3.7 Image pipeline: `sharp` script → AVIF/WebP at fixed widths (mascot 1×/2×; materials 128/192/320), hashed names, CI weight check (head ≤ 4 KB, 56–96 px ≤ 10 KB, hero ≤ 60 KB, material 128 ≈ 3–5 KB).
- [x] P3.8 `Mascot` component (pose, size, mint spot, `alt` rules, 200 ms fade) with poses G02; `MaterialThumb` with icon fallback.
- [x] P3.9 Trial photos G04 approved (style + weight).
- [x] P3.10 Accessibility baseline: focus ring, 48 px targets, reduced motion; component tests for `NumberField` (comma, empty, paste).
- [x] P3.11 A simple `/dev/ui` page (noindex, non-prod only) showing all components at 390 and 1440 px.

**Exit gate:** all components render on `/dev/ui` in light theme; contrast pairs from design spec §5 hold; tests green; mascot poses 1–5 and 4 category icons in place (due 8 Nov).

**Who:** `frontend-builder` + skill `ui-component`. Mobile gate: check `/dev/ui` on a real phone.

---

## Phase 4 — Calc core, registry, content pipeline (26 Oct – 1 Nov)

**Goal:** the engine and the data registry exist and are tested; Markdown content compiles.

**Needs:** C04. **Install:** `zod` (calc, catalog), dev `fast-check` (calc), dev `gray-matter unified remark-parse remark-rehype rehype-sanitize rehype-stringify` (web).

**Tasks**

- [ ] P4.1 `calc/src/types.ts`: `ToolModule`, `CalcContext`, `ToolResult`, `PurchaseItem`, `Quantity`, `Pack`, `Cost`, `Warning`, `Step`, `Room`, `Layout`.
- [ ] P4.2 Blocks: `geometry` (rect, L, polygon, walls minus openings), `packs` (`ceilPacks` 1e‑9, leftover, can-set optimizer), `waste` (`WasteRule`), `coverage`.
- [ ] P4.3 Golden harness: `GoldenExample` type, shared test that loads every `tools/*/golden.ts`, fails if < 10 or missing `source`; partial-match assertions. Benchmark observations are kept separately from expected values so a competitor can never become the source of truth by accident.
- [ ] P4.4 Invariants with fast-check for every registered tool: bought ≥ need, integer packs, monotonic in area, no NaN/∞.
- [ ] P4.5 Coverage gate 95% for `calc` in CI; `pnpm calc:export` script (golden → CSV/Markdown table for the reviewer).
- [ ] P4.6 `catalog`: `ToolDef` (slug, category, titles, `FieldDef[]` with `main`/`planner`/`room`, presets, next steps, `disclaimer`, item `photo` keys), `CategoryDef` (slug, icon, photo), norms with `source` + `checkedAt`, `CountryConfig` skeleton, reserved segments list.
- [ ] P4.7 Registry tests: unique URLs, reserved segments unused, next steps point to existing tools, ≤ 4 `main` fields, module ↔ catalog ↔ content ↔ golden all present.
- [ ] P4.8 Content pipeline: Zod frontmatter schema (limits from design §18), `{{norm.*}}` substitution, Markdown → sanitized HTML at build, build warnings on title/description overflow.
- [ ] P4.9 `ProjectData` schema v1 (with optional `master`) and `mergeItems()` stub in `calc/project`.

**Exit gate:** `pnpm --filter @umnyaut/calc test` green with coverage ≥ 95%; registry + content tests green.

**Who:** `calc-engineer`; review `formula-reviewer` (blocks), `code-reviewer`.

---

## Phase 5 — App shell, CalculatorShell, first two tools (28 Oct – 8 Nov)

**Goal:** the full tool-page experience on two simple tools, live in prod.

**Needs:** C18, C19, G02, G03. **Install:** `zustand` (web), dev `@playwright/test` (web).

**Tasks**

- [ ] P5.1 Root layout: header (phone 56 px: logo, country chip, menu sheet; ≥ 1024 72 px: mascot head + logo, nav with categories dropdown, “Мои расчёты”), footer (navy, categories, info pages, country switch, “Настройки cookie”, bot link), breadcrumbs (back link on phone).
- [ ] P5.2 `entities/room`: Zustand persist `umnyaut:room:v1` + migration hook; `entities/country`: detection by timezone → localStorage `umnyaut:country`; `entities/tool`.
- [ ] P5.3 `widgets/calculator-shell`: `useCalculator` (SSR result for defaults → hydrate identical → after mount apply `?s=` → room → saved tool values), live `compute()`, `useDeferredValue` for layouts.
- [ ] P5.4 Blocks: `RoomBar`, `ToolForm` (from `FieldDef`, ≤ 4 main fields, “Ещё параметры · N”), `ResultPanel` (mascot `done` 56 px, big number, related list, total + price per m², «без N позиций»), `Warnings` (mascot head `warn`), disclaimer card, `HowCalculated` (accordion, source, checked date, report link), `ResultActions` (save — disabled until Phase 7, send/copy text, print), `NextSteps`, `ReportError` sheet (stub until Phase 7), sticky result bar (< 1024, IntersectionObserver), inert `AdSlot`.
- [ ] P5.5 `features/share-result`: `?s=` = base64url JSON of non-default fields; canonical to clean URL; copy as text; `navigator.share`.
- [ ] P5.6 Print stylesheet (`@media print`, A4, no chrome, checkbox column).
- [ ] P5.7 Tool page route `app/[category]/[tool]/page.tsx` composing `views/tool-page`; category route skeleton.
- [ ] P5.8 Tools **Room area** (writes “My room”) and **Wall area** via skill `new-calculator` (five files each, 10 golden each). Content stubs.
- [ ] P5.9 Playwright on phone viewport: room area → wall area carries the room; `?s=` link reproduces result.
- [ ] P5.10 Server-HTML guard script (no-JS HTML contains title, one H1, canonical, result numbers) in CI.
- [ ] P5.11 Deploy to prod.

**Exit gate (mobile gate):** both tools live on `umnyaut.com`; on iPhone Safari 390 × 844 the result number is within 660 px; sticky bar works; no-JS HTML contains numbers.

**Who:** `frontend-builder` (shell), `calc-engineer` (tools), `formula-reviewer`, `code-reviewer`.

---

## Phase 6 — Wave 1 calculators (7–27 Nov)

**Goal:** the remaining 8 wave‑1 tools, each passing the release check; complete the wall chain before optimizing for catalog breadth.

**Needs:** C01–C06, G05, A26 (reviewer). **Install:** nothing new.

**Per-tool recipe (repeat for each):** skill `new-calculator` → `formula-reviewer` → fix → `calculator-release-check` (content part completed in Phase 8) → merge.

**Sequence gate:** wallpaper and paint plus their related glue/primer outputs form the first signature path from the shared room. Work may overlap, but an unrelated breadth item must not delay a missing link in this path. Each overlapping tool follows the [Qalculator benchmark protocol](../business/competitive-benchmark.md).

**Tasks**

- [ ] P6.1 Plinth (S) — `geometry` + `packs`; corners, caps, joiners.
- [ ] P6.2 Tile adhesive (S) — `coverage` by notch × format × base.
- [ ] P6.3 Grout (S) — (A+B)/(A·B) × width × depth × density.
- [ ] P6.4 Wallpaper (M) — `strips` engine (repeat, offset), rolls, glue.
- [ ] P6.5 Paint (M) — `coverage` + can-set optimizer, primer related.
- [ ] P6.6 Linoleum (M) — `strips` variants by width × direction, seams, sorted by price.
- [ ] P6.7 Laminate (L) — `rows` engine (offset, trimming, offcut reuse, narrow last row warning); underlay + plinth related; diagonal/herringbone as waste. Golden incl. mockup case (4.6 × 4.3, 2.22 m² → 10 packs, 23 rows).
- [ ] P6.8 Tile (L) — `grid` engine from centre/corner, whole vs cut tiles, boxes.
- [ ] P6.9 Layout schemes for laminate and tile **only if time remains** (else Phase 10).
- [ ] P6.10 Reviewer export of wave 1 (C10) sent to the master (A26).
- [ ] P6.11 Minimal local-only connected wall list: shared room → wall area → wallpaper or paint → glue/primer; `mergeItems()` combines duplicates and exposes the next calculation. Saving, projects and the full works picker remain Phase 7/11.

**Exit gate:** 10 tools; first connected wall path produces one merged list; each tool has ≥ 10 golden with primary sources; overlapping tools have ≥ 3 explained Qalculator comparisons; `formula-reviewer` PASS; reviewer feedback scheduled.

**Who:** `calc-engineer`, `formula-reviewer`; UI tweaks `frontend-builder`.

---

## Phase 7 — Saving, sharing, server API, countries (9–15 Nov)

**Goal:** a calculation can be saved, reopened elsewhere, reported; four countries configured.

**Needs:** A12, C07. Staging/previews have no DB: DB features must degrade to “unavailable on staging”. **Install:** `@supabase/supabase-js` (db), `supabase` dev (db).

**Tasks**

- [ ] P7.1 Migrations (skill `db-migration`): `projects`, `project_opens`, `rate_limits`, `error_reports`, `events_daily`; functions `hit_limit`, `project_touch`; RLS on, zero policies; `pg_cron` cleanup; generated types.
- [ ] P7.2 `server/db` query functions (only entry point); `server/limits` (in-memory + Postgres).
- [ ] P7.3 API: `POST/GET/PUT/DELETE /api/projects[/id]`, `POST /api/projects/[id]/copy` (editToken hash, 8-char ids without look-alikes, Zod, envelope, Origin check, limits); `POST /api/reports` (honeypot, 5/h).
- [ ] P7.4 `app/p/[id]/page.tsx` SSR (owner edit / viewer “Сохранить как свой”, `noindex`, `private, no-store`, “Расчёт обновлён” when tool version changed); preview title from dimensions.
- [ ] P7.5 `features/save-project` (editToken in localStorage, autosave 2 s debounce, offline state), `features/report-error` wired.
- [ ] P7.6 `CountryConfig` RU/KZ/BY/KG (C07): currency, locale, price hints; country switch in header/footer; static HTML always RU.
- [ ] P7.7 API tests against local Supabase; Playwright “save and open project”, “report error”.

**Exit gate:** a project saved on a phone opens on a laptop; limits return 429; `/p/*` not indexable.

**Who:** `platform-engineer` (DB/API), `frontend-builder` (features).

---

## Phase 8 — Site pages & content filling (16–27 Nov)

**Goal:** every launch page exists with final Russian copy and assets.

**Needs:** C11–C18, G05–G07. **Install:** nothing new.

**Tasks**

- [ ] P8.1 Home (`views/home`): hero (mascot `hello`, headline, badges), “Моя комната” card with room scheme SVG (isometric box with live dimensions) and work chips, orange button «Выбрать расчёт» (until planner), example strip «Для комнаты 12 м² нужно» computed at build, categories grid (only categories with tools), popular tools (static order now), «Как мы считаем», footer.
- [ ] P8.2 Category pages for osnova, pol, steny, plitka: tool cards, «Порядок работ» stepper, text + FAQ.
- [ ] P8.3 Info pages (`app/(info)/…`): `/metodika/`, `/o-proekte/`, `/politika/`, `/kontakty/`, `/partneram/` with C14–C17.
- [ ] P8.4 `not-found.tsx` (mascot `oops`, six popular tools).
- [ ] P8.5 Tool texts for all 10 wave‑1 tools (C11) via skill `tool-content`; owner review; FAQ from Wordstat CSV.
- [ ] P8.6 Material photos G05 and category photos G06 + brush mask; desktop hero G07 (optional).
- [ ] P8.7 Desktop layouts (≥ 1024): tool page 5/7 columns with sticky result; home two-column hero.
- [ ] P8.8 `calculator-release-check` for all 10 tools — now including content.

**Exit gate (mobile gate):** all pages pass a real-phone walkthrough; release check READY for 10 tools.

**Who:** `frontend-builder`, `seo-content-writer` (+ skill `tool-content`), owner.

---

## Phase 9 — Consent, analytics, SEO, launch (18–30 Nov)

**Goal:** the site is measurable, indexable, fast — and submitted to search engines.

**Needs:** A10, A22–A25. Assets G08, G09. **Install:** dev `schema-dts`, `@lhci/cli` (web).

**Tasks**

- [ ] P9.1 Cookie banner (strict mode: Metrika not loaded before «Принять»; equal buttons; 6-month hide after refusal; footer “Настройки cookie”).
- [ ] P9.2 `shared/analytics/track()` typed `EventMap`; adapters: own counter (`sendBeacon('/api/e')` → `events_daily`) always, Metrika after consent (URL without `s`); common params (country, source, category, variation); `calc_completed` logic (≥ 2 fields + 5 s visible, `via`); `js_error`.
- [ ] P9.3 `POST /api/e` with limits.
- [ ] P9.4 `generateMetadata` from frontmatter; canonical everywhere; JSON-LD (`WebApplication`, `FAQPage`, `BreadcrumbList`, `Organization`, `WebSite`).
- [ ] P9.5 `sitemap.ts` (lastmod from text/formula change), `robots.ts` (disallow `/api/`, Yandex `Clean-param: s`), `manifest.ts` (PWA icons G08), OG image G09, 301 map in catalog.
- [ ] P9.6 Security headers in Caddy/Next: CSP (self, Metrika, Telegram), HSTS, nosniff, Referrer-Policy, `frame-ancestors` per route table.
- [ ] P9.7 Lighthouse CI thresholds on home, a tool, (planner later): perf ≥ 90, SEO 100, a11y ≥ 95, LCP ≤ 2.0 s, CLS ≤ 0.05, JS ≤ 150 KB gz, CSS ≤ 15 KB.
- [ ] P9.8 IndexNow step in deploy workflow (sitemap diff); submit sitemap in Webmaster + Search Console.
- [ ] P9.9 Monitoring (A23, A24): 5-min checks from RU and KZ; disk/restart alerts; weekly `pg_dump` (A25).
- [ ] P9.10 Playwright: full 5 scenarios from tech spec §15 green.

**Exit gate = Checkpoint M1 (30 Nov):** all pages indexed (or submitted and crawling) in Yandex and Google; formulas covered by tests; events arriving in Metrika; Lighthouse thresholds pass. *If not met — no new tools, fix tech (business spec §4).*

**Who:** `platform-engineer` (headers, CI, monitoring), `frontend-builder` (banner, track), owner (consoles).

---

## Phase 10 — Wave 2 calculators + layout schemes (1 Dec 2026 – 24 Jan 2027)

**Goal:** 20 tools; laminate and tile schemes.

**Needs:** C08, C20, G11, G12, A26. **Install:** nothing new.

**Tasks**

- [ ] P10.1 Blocks `frame`, `power`; norms per country (tariffs, climate regions) in catalog.
- [ ] P10.2 Tools in order: Radiators, Electricity usage, Lighting, Putty, Primer, Plaster, Vinyl/parquet (reuse `rows`), Screed, Stretch ceiling, Drywall (L). Disclaimers for radiators and screed.
- [ ] P10.3 `LayoutScheme` SVG (whole / hatched cut / orange reused dot, legend, text summary, fullscreen on tap, simplify > 2,000 pieces); schemes for laminate and tile; lighting points.
- [ ] P10.4 Category pages potolok, elektrika, klimat (+ icons, photos).
- [ ] P10.5 Texts (C20) and release check per tool; reviewer pass on wave 2 (C10).

**Exit gate:** 20 tools READY; schemes live.

**Who:** `calc-engineer`, `formula-reviewer`, `frontend-builder`, `seo-content-writer`.

---

## Phase 11 — Renovation planner v1 (8 Dec – 14 Jan)

**Goal:** room → works → materials → merged shopping list, saved by link.

**Needs:** C21, G11 (`measure`, `empty`). **Install:** nothing new.

**Tasks**

- [ ] P11.1 `mergeItems()` (same item + same pack merged; order rough → finish) with tests.
- [ ] P11.2 `/remont/` four steps on phone (progress bar, non-locking), two columns ≥ 1024; works = six wave‑1 tools with `planner` fields; «В списке N позиций».
- [ ] P11.3 Draft in `umnyaut:planner:draft`; save → `/p/<id>` with full list; autosave.
- [ ] P11.4 Return metric: reopen > 1 h counts; SQL for 7-day reopen share.
- [ ] P11.5 Home orange button becomes «Рассчитать ремонт» → planner with room prefilled.
- [ ] P11.6 “Мои расчёты” page from local storage (+ empty state).
- [ ] P11.7 Lighthouse budget for planner page; Playwright scenario.

**Exit gate (mobile gate):** planner usable one-handed on a phone; project reopens with identical list.

**Who:** `frontend-builder`, `calc-engineer` (merge), `platform-engineer`.

---

## Phase 12 — Telegram bot & mini app (5–27 Jan)

**Goal:** the mobile return channel for KZ/BY/KG (secondary RU).

**Needs:** A27–A30, C22, G10. **Install:** `grammy` (web).

**Tasks**

- [ ] P12.1 `server/messenger/` `MessengerAdapter` + Telegram implementation; `server/telegram` (`initData` verification, `auth_date` ≤ 24 h).
- [ ] P12.2 Migration `tg_users`; `projects.tg_user_id` index.
- [ ] P12.3 `POST /api/tg/webhook` (secret header, immediate reply, heavy work via `after()`): `/start`, `/my`, `/forget`, project link → “Open in mini app”.
- [ ] P12.4 `GET/POST /api/tg/calcs`.
- [ ] P12.5 `/tg/` entry (mascot `hello`, three links, «Рассчитать ремонт»), bottom tab bar (Главная / Инструменты / Мои расчёты), `TelegramProvider` (hide chrome and ads, theme colours → 4 tokens, BackButton, MainButton «Сохранить»), dark theme tokens enabled.
- [ ] P12.6 Deep links `startapp=<id>`; `source: 'tg'` in events; `frame-ancestors` for Telegram.
- [ ] P12.7 Test bot on staging, prod bot on `main`.

**Exit gate (mobile gate):** mini app works in Telegram iOS, Android and Desktop in light and dark; saving binds to Telegram user; `/forget` deletes.

**Who:** `platform-engineer` (bot/API), `frontend-builder` (mini app UI).

---

## Phase 13 — Growth operations (Dec – Jan, ongoing)

**Goal:** the data loop that decides what to build next.

**Tasks**

- [ ] P13.1 `pnpm report:weekly` (Metrika, Webmaster, Search Console APIs → Markdown table).
- [ ] P13.2 Popular tools block on home from usage data.
- [ ] P13.3 5 user interviews + 20 Webvisor sessions/week.
- [ ] P13.4 1–2 publications per month on niche platforms (C26).
- [ ] P13.5 Recalculate traffic scenarios from real impressions.

**Exit gate = Checkpoint M3 (31 Jan 2027):** impressions grow 4 weeks in a row; ≥ 40% of visits with a useful calculation. Else: indexing/snippet work before new tools.

---

## Phase 14 — Season (Feb – Apr 2027)

**Goal:** 30 tools, first variations, light master mode, AI input, monetization tests.

**Needs:** A31–A37, C09, C23, C24, G13, G14.

**Install:** `@google/genai` (web).

**Tasks**

- [ ] P14.1 Wave 3 tools: Concrete, Lumber, Brick/blocks, Air conditioner, Underfloor heating, Cable cross-section (disclaimer), Drywall ceiling, PVC panels/lining, Decorative plaster/liquid wallpaper, Curtains; categories strojmaterialy, interer.
- [ ] P14.2 Variations by the 3-condition rule (`[variant]` route, frontmatter guard).
- [ ] P14.3 Light master mode: `MasterSheet` (work lines, `qtyFrom` room measures, header), client view on `/p/<id>`, print estimate; 5–10 master interviews; go/no-go metric (≥ 10% projects with work lines + ≥ 3 ready to pay).
- [ ] P14.4 AI: migration `ai_usage`; `VisionProvider` (Gemini API via relay `GEMINI_BASE_URL`; verify current model ids and prices: fast = Flash-Lite, accurate = Flash); limits, monthly budget, kill switch; test set 30 labels + 10 plans, ≥ 90% field accuracy gate; label photo (site + bot), plan photo, text description; confirmation screen; mascot `think`, `camera`.
- [ ] P14.5 Planner v2: multiple rooms, polygon contour, wave‑2 works, CSV + PDF (print layout).
- [ ] P14.6 Monetization tests on top‑3 pages: РСЯ/AdSense in `AdSlot` (consent category, ≤ 2 per page on phone), «Посмотреть материал» (`ShopConfig`, `rel="sponsored nofollow noopener"`, ad label + erid, `shop_clicked`).
- [ ] P14.7 Lawyer consult (A32) before the first ad block; acquiring check (A37).
- [ ] P14.8 Outreach to curated lists when 20+ tools.

**Exit gate = Checkpoint M6 (30 Apr 2027):** ≥ 3k visits/month → expand catalog; else narrow to 1–2 growing clusters. Decision on paid master mode.

---

## Phase 15 — Scale (May – Oct 2027)

**Tasks (only where demand is proven)**

- [ ] P15.1 Expand only validated connected clusters. 60–80 tools is a conditional ceiling, not a target; require demand, useful-calculation rate and continuation evidence for each expansion batch.
- [ ] P15.2 Reference pages `/spravochnik/…` and product presets.
- [ ] P15.3 Paid master mode: Supabase Auth (email OTP, Telegram via `initData`), `/kabinet/`, `accounts`, `price_lists`, `clients`, `subscriptions`, `PaymentProvider`, Supabase Pro (A38–A40).
- [ ] P15.4 Widget: `embed.js` loader ≤ 2 KB, `/embed/<tool>`, backlink outside iframe; paid version via `widgets` table.
- [ ] P15.5 Contractor estimate check (`POST /api/ai/estimate`, line matching, volume diff), planner v3 with partner offers.
- [ ] P15.6 Monetization on all trafficked pages; quarterly legal check.

**Exit gate = Checkpoint M12 (31 Oct 2027):** ≥ 15k visits/month and first revenue; else support mode (≤ 2 h/week).

---

## Open questions and inconsistencies

| # | Item | Resolution / owner | Phase |
|---|---|---|---|
| 1 | `origin/develop` contains the old project | Archive as `legacy/develop`, force-push new `develop` after approval | P0.2 |
| 2 | Tech spec names Claude models; owner chose Gemini (2026-10-09) | Evaluate Gemini Flash-Lite / Flash on the test set; RU tech spec still says Claude | P14.4 |
| 3 | Design §18 amendments not merged into RU tech spec | Merge | P0.8 |
| 4 | Mascot poses exist at 1254 px (spec asked ≥ 2048) | Check hero 2× quality | P3.8 |
| 5 | Mascot `.mp4` clips vs “no animation at launch” | Not at launch | P0.9 |
| 6 | `[ИСТОЧНИК НОРМЫ]` placeholders in mockups | Fill from C01 | P0.7 |
| 7 | Home headline | Decided 2026-10-09: H1 «Одна комната — весь список покупок», promise below it «Введите размеры один раз — получите проверенный список покупок для всего ремонта»; apply in C13/P0.9 | P0.9 |
| 8 | Vercel Hobby non-commercial clause | OK until ads; fallback VPS container | P14.6 |
| 9 | «сколько пачек ламината нужно» = 0 demand; mockup uses it | Use «сколько нужно ламината» | P8.5 |
| 10 | TypeScript 7.0 is latest; ecosystem support unverified | Spike | P1.2 |
| 11 | Local Node is v26; spec pins Node 24 LTS | `.nvmrc` 24 | P1.1 |

## Cross-references

- [Accounts and Services](./accounts-and-services.md) — `A…` IDs
- [Dependencies](./dependencies.md) — packages and versions
- [Content and Assets Plan](./content-plan.md) — `C…`/`G…` IDs
- [Progress Log](./progress-log.md) — what was actually done, when and where; every ticked task has an entry there
- [Architecture Overview](../architecture/overview.md), [Calculation Engine](../code/calc-engine.md), [Calculator Shell](../ui/calculator-shell-and-pages.md), [Design System](../design/design-system.md), [Server API and Data](../code/server-api-and-data.md), [Environments and CI/CD](../deploy/environments-and-ci.md), [SEO and Analytics](../business/seo-and-analytics.md)
- [Competitive Benchmark](../business/competitive-benchmark.md) — Qalculator baseline and per-tool comparison protocol
- Agents and skills: [docs/README.md](../README.md)
- Sources: business spec §4, §5, §14; tech spec §15, §19; design spec §18; `docs/specs/umnyaut-roadmap.mjs` (104 tasks; `node docs/specs/umnyaut-roadmap.mjs --md out.md`)
