---
version: 1.0
date: 2026-10-08
category: ui
---

# Calculator Shell, Pages and Routing

> Version 1.0 · 2026-10-08 · [UI](../ui/)

## Overview

Every tool is rendered by **one component, `CalculatorShell`**. A tool is described by data in `packages/catalog` (fields, presets, links), not by its own markup, so the 16 requirements of the calculator standard are implemented once. Pages are statically generated from the registry; adding a tool never adds a route file.

> Status: planned. Sources: technical spec §6–7, design spec §11–14, mockups in `docs/specs/UmnyAut — макеты ключевых экранов.html`.

## Architecture

### How a page gets its result

1. **Build** — the server takes the tool from the registry, calls `compute(defaults())`, and renders the finished result into HTML. Search engines and people see numbers before JS loads.
2. **Hydration** — the first browser render repeats the server render exactly. *After mount* the shell applies input by priority: URL params (`?s=`) → “My room” → saved tool values.
3. **Recalculation** — every field change calls `compute()` immediately (< 5 ms). Layout engines go through `useDeferredValue`.
4. **Size** — a page loads only its own tool's calc module; the planner lazy-loads modules as works are selected.

### Form described by data

```ts
type FieldDef =
  | { kind: 'length'; name: string; label: string; unit: 'm' | 'cm' | 'mm';
      min: number; max: number; room?: 'length' | 'width' | 'height'; main?: boolean; planner?: boolean }
  | { kind: 'number'; name: string; label: string; min: number; max: number; step?: number; main?: boolean; planner?: boolean }
  | { kind: 'select'; name: string; label: string; options: Option[]; main?: boolean; planner?: boolean }
  | { kind: 'toggle'; name: string; label: string }
  | { kind: 'preset'; label: string; presets: PresetId[] }   // fills several fields at once
  | { kind: 'openings' }                                       // windows & doors list
  | { kind: 'price'; name: string; label: string };            // currency from country
```

`main: true` (design spec amendment) marks the ≤ 4 fields shown on the phone's first screen; the registry test rejects more than four. `planner: true` marks fields shown in the planner's short form. A field with `room` binding reads/writes “My room” directly.

Numeric inputs live in `packages/ui`: `inputMode="decimal"`, accept comma and dot, m/cm toggle, tap height ≥ 48 px, value font 18 px (≥ 16 to avoid iOS zoom).

### Shell blocks

| Block | Shows | Standard req. |
|---|---|---|
| `RoomBar` | “Моя комната: 4,6 × 4,3 × 2,7 м”, “Изменить”, “другая комната” | 13 |
| `ToolForm` | Fields from `FieldDef`, presets, openings | 3, 12, 16 |
| `ResultPanel` | Main item large, related list, total and price per m² | 1, 4, 5, 11 |
| `Warnings` | Warnings by result codes | 6 |
| `HowCalculated` | Steps with substituted numbers, norm source, checked date | 7, 8 |
| `LayoutScheme` | SVG from `result.layout` | 15 |
| `ResultActions` | Save, send, copy as text, print | 14 |
| `NextSteps` | “Дальше по ремонту” links with dimensions carried over | — |
| `ReportError` | One button; attaches input + formula version | 9 |
| Sticky result bar | Phone only (< 1024 px): “10 пачек · 12 460 ₽” when `ResultPanel` is off-screen | — |
| `AdSlot` | Renders nothing before stage 3; reserved min-height to avoid CLS. Never above the result | — |

The shell (not tools) fires `calc_completed`: ≥ 2 fields changed and the result (panel **or** sticky bar, `via: 'panel' | 'sticky'`) visible for 5 s.

### Tool page order (top → bottom)

1. `H1` (≤ 40 chars) + one-line question subtitle (≤ 42 chars, phrased as a search query).
2. `RoomBar`, main fields, presets, “Ещё параметры · N”, result — **within 660 px on a 390 × 844 phone**.
3. Layout scheme, if any.
4. Actions and “next steps”.
5. “How calculated”, norm source, checked date.
6. Text 300–600 words + FAQ from Markdown.
7. Related tools and methodology link.

From 1024 px: form 5/12 columns left, result 7/12 right and sticky (top offset 88 px); all fields open; no sticky bar.

### Where state lives

| Data | Storage | Key / address |
|---|---|---|
| Current tool input | React state in `useCalculator` hook | — |
| “My room” | Zustand + persist (localStorage) | `umnyaut:room:v1` |
| Last packs/prices per tool | localStorage | `umnyaut:tool:<id>:v1` |
| Country | localStorage | `umnyaut:country` |
| Planner draft | localStorage | `umnyaut:planner:draft` |
| Shareable calc | URL param | `/pol/laminat/?s=<base64url JSON of non-default fields>` |
| Saved project | Supabase | `/p/a8H2k` |
| Telegram “My calculations” | Supabase | by Telegram user id |

Storage keys are versioned (`v1`); a version change runs a migration function. Pages with `?s=` set `canonical` to the clean URL.

### Routes

| Page type | Route file | Example | Rendering | Indexed |
|---|---|---|---|---|
| Home | `app/page.tsx` | `/` | Static | Yes |
| Category | `app/[category]/page.tsx` | `/pol/` | Static | Yes |
| Tool | `app/[category]/[tool]/page.tsx` | `/pol/laminat/` | Static | Yes |
| Variation | `app/[category]/[tool]/[variant]/page.tsx` | `/pol/laminat/diagonalnaya-ukladka/` | Static | Yes |
| Reference | `app/spravochnik/[slug]/page.tsx` | `/spravochnik/rashod-shtukaturki/` | Static | Yes |
| Planner | `app/remont/page.tsx` | `/remont/` | Static shell, client logic | Yes |
| Info | `app/(info)/…/page.tsx` | `/metodika/`, `/o-proekte/`, `/politika/`, `/kontakty/`, `/partneram/` | Static | Yes |
| Saved project | `app/p/[id]/page.tsx` | `/p/a8H2k` | SSR on request | No |
| Widget | `app/embed/[tool]/page.tsx` | `/embed/laminat` | Static, light layout | No |
| Mini app | `app/tg/page.tsx` | `/tg/` | Static shell | No |
| API | `app/api/**/route.ts` | `/api/projects` | Server | No |

Rules: `trailingSlash: true`; `generateStaticParams` from the registry with `dynamicParams = false` (unknown URL → 404); reserved first-level segments `remont`, `spravochnik`, `p`, `embed`, `tg`, `api` (registry test forbids them as categories); **no `cookies()`/`headers()` in indexable pages**; country is detected in the browser. Category slugs: `osnova`, `pol`, `steny`, `plitka`, `potolok`, `elektrika`, `klimat`, `strojmaterialy`, `interer`.

Variations are `catalog` entries (URL, titles, default overrides, own text). Frontmatter must include its own example and ≥ 3 FAQ, or the build fails.

### Response headers

| Pages | Cache | Robots | Framing |
|---|---|---|---|
| Indexable | `max-age=0, must-revalidate` | `index, follow` | Own domain + Telegram |
| `/p/[id]` | `private, no-store` | `noindex, nofollow` (meta + `X-Robots-Tag`) | Own domain + Telegram |
| `/embed/*` | as indexable | `noindex` | Any site |
| `/tg/` | as indexable | `noindex` | Telegram only |
| Hashed build assets | `max-age=31536000, immutable` | — | — |

## Configuration

Per-tool configuration lives in `packages/catalog/src/tools/<id>.ts`: URL slug, category, titles, `FieldDef[]`, presets, next-step links, `disclaimer` flag, item `photo` keys. Content frontmatter (`apps/web/content/tools/<id>.md`): `title` (≤ 65), `description` (≤ 160), `h1` (≤ 40), `question` (≤ 42), `updatedAt`, `checkedAt`, `example`, `faq[]` — validated by Zod at build. Norm numbers in text are substitutions from `catalog` (`{{norm.underlay.overlap}}`).

## Usage

Environment differences (same components, different tokens):

| | Site | Mini app | Widget | Print |
|---|---|---|---|---|
| Header/footer | Yes | No (system Back) | No | Logo + date |
| Bottom tab bar | No | Home / Tools / My calcs | No | No |
| Sticky result bar | Yes | Replaced by Telegram MainButton “Сохранить” | No | No |
| Mascot & photos | Yes | Yes | No | No |
| Ads | From stage 3 | No | No | No |

## Cross-references

- [Calculation Engine](../code/calc-engine.md) — `ToolModule`, `Room`, `Layout`
- [Design System](../design/design-system.md) — visual spec of every block above
- [SEO and Analytics](../business/seo-and-analytics.md) — metadata, JSON-LD, events fired by the shell
- [Server API and Data](../code/server-api-and-data.md) — save/open project endpoints
- [Telegram Bot](../integrations/telegram-bot.md) — `TelegramProvider` adaptations
- Skill spec: [ui-component](../skills/ui-component.md); agent spec: [frontend-builder](../agents/frontend-builder.md)

## File Structure

| Path | Description |
|---|---|
| `apps/web/src/widgets/calculator-shell/` | `CalculatorShell`, `useCalculator` |
| `apps/web/src/widgets/result-panel/` | `ResultPanel`, sticky bar, `Warnings` |
| `apps/web/src/widgets/room-bar/` | `RoomBar` |
| `apps/web/src/widgets/layout-scheme/` | `LayoutScheme` + per-tool overrides |
| `apps/web/src/entities/room/` | Zustand store `umnyaut:room:v1` |
| `apps/web/src/features/{save-project,share-result,report-error,pick-country}/` | User actions |
| `packages/ui/` | Inputs, buttons, sheets, tokens |
| `packages/catalog/src/tools/` | Per-tool UI data |
