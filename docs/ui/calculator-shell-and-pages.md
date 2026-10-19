---
version: 1.8
date: 2026-10-19
category: ui
---

# Calculator Shell, Pages and Routing

> Version 1.8 · 2026-10-19 · [UI](../ui/)

## Overview

Every tool is rendered by **one component, `CalculatorShell`**. A tool is described by data in `packages/catalog` (fields, presets, links), not by its own markup, so the 16 requirements of the calculator standard are implemented once. Pages are statically generated from the registry; adding a tool never adds a route file.

> Status: implemented in Phase 5 for `ploshchad-komnaty` and `ploshchad-sten` (see Implementation notes below). Sources: technical spec §6–7, design spec §11–14, mockups in `docs/specs/UmnyAut — макеты ключевых экранов.html`.

## Architecture

### How a page gets its result

1. **Build** — the server takes the tool from the registry, calls `compute(defaults())`, and renders the finished result into HTML. Search engines and people see numbers before JS loads.
2. **Hydration** — the first browser render repeats the server render exactly. *After mount* the shell applies input by priority: URL params (`?s=`) → the last opened calc of this tool in the active room, over the room's sizes (see [Rooms and Estimate](./rooms-and-estimate.md)).
3. **Recalculation** — every field change calls `compute()` immediately (< 5 ms). Layout engines go through `useDeferredValue`.
4. **Size** — a page loads only its own tool's calc module; the calculators of other calcs in the list load on demand after mount (`EstimateSync`), outside the first-screen JS.

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

`main: true` (design spec amendment) marks the ≤ 4 fields shown on the phone's first screen; the registry test rejects more than four. `planner: true` marks fields shown in the planner's short form. A field with `room` binding reads and writes the active room of the estimate; since P17.7 such fields are not rendered in the form — the room row and the room editor hold them.

Numeric inputs live in `packages/ui`: `inputMode="decimal"`, accept comma and dot, m/cm toggle, tap height ≥ 48 px, value font 18 px (≥ 16 to avoid iOS zoom).

### Shell blocks

| Block | Shows | Standard req. |
|---|---|---|
| `RoomBar` | Mint room row: «[Ванная ▾] 2,2 × 1,7 × 2,5 м · Изменить» with the room picker, or «Пример: 4,6 × 4,3 м · Указать размеры»; same height in both states | 13 |
| `CalcChips` | Calcs of this tool in the room, «+ Ещё» while a surface is free; only when there is a choice | — |
| `ToolForm` | Fields from `FieldDef`, presets, openings | 3, 12, 16 |
| `ResultPanel` | Main item large, related list, total and price per m² | 1, 4, 5, 11 |
| `Warnings` | Warnings by result codes | 6 |
| `HowCalculated` | Steps with substituted numbers, norm source, checked date | 7, 8 |
| `LayoutScheme` | SVG from `result.layout` | 15 |
| `ResultActions` | «Добавить в список» / «В списке ✓» / «Обновить в списке», send, copy as text, print | 14 |
| `NextSteps` | “Дальше по ремонту” links with dimensions carried over | — |
| `ReportError` | One button; attaches input + formula version | 9 |
| Sticky result bar | Phone only (< 1024 px): “10 пачек · 12 460 ₽” when `ResultPanel` is off-screen; «· К списку» once the calc is in the list | — |
| `AdSlot` | Renders nothing before stage 3; reserved min-height to avoid CLS. Never above the result | — |

The shell (not tools) fires `calc_completed`: ≥ 2 fields changed and the result (panel **or** sticky bar, `via: 'panel' | 'sticky'`) visible for 5 s.

### Tool page order (top → bottom)

1. `H1` (≤ 40 chars) + one-line question subtitle (≤ 42 chars, phrased as a search query).
2. `RoomBar`, the chips row (when shown), main fields, presets, “Ещё параметры · N”, result — **within 660 px on a 390 × 844 phone**.
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
| Estimate: rooms, calcs (own input, prices), shared-consumable prices, totals | Zustand + persist (localStorage) | `umnyaut:estimate:v1` — see [Rooms and Estimate](./rooms-and-estimate.md) |
| Own input of tools without purchases (room area, wall area) | localStorage | `umnyaut:tool:<id>:v1` — they keep no calcs in the estimate |
| Country | localStorage | `umnyaut:country` |
| “My room” and room list (before Phase 17) | localStorage, moved into the estimate once and removed | `umnyaut:room:v1`, `umnyaut:list:v1` |
| Estimate by link | URL hash | `/spisok/prosmotr/#s=<deflated base64url snapshot>` |
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
| List of purchases | `app/spisok/page.tsx` | `/spisok/` | Static shell, client logic | No (`noindex`, not in sitemap) |
| List by link | `app/spisok/prosmotr/page.tsx` | `/spisok/prosmotr/#s=…` | Static shell, read-only document | No |
| Info | `app/(info)/…/page.tsx` | `/metodika/`, `/o-proekte/`, `/politika/`, `/kontakty/`, `/partneram/` | Static | Yes |
| Saved project | `app/p/[id]/page.tsx` | `/p/a8H2k` | SSR on request | No |
| Widget | `app/embed/[tool]/page.tsx` | `/embed/laminat` | Static, light layout | No |
| Mini app | `app/tg/page.tsx` | `/tg/` | Static shell | No |
| API | `app/api/**/route.ts` | `/api/projects` | Server | No |

Rules: `trailingSlash: true`; `generateStaticParams` from the registry with `dynamicParams = false` (unknown URL → 404); reserved first-level segments `remont`, `smeta`, `spisok`, `spravochnik`, `p`, `embed`, `tg`, `api`, `dev` (registry test forbids them as categories); **no `cookies()`/`headers()` in indexable pages**; country is detected in the browser. A category page is generated only once it has a tool; tools with catalog `status: 'draft'` (and categories with no `live` tool) are built but `noindex, nofollow`. Category slugs: `osnova`, `pol`, `steny`, `plitka`, `potolok`, `elektrika`, `klimat`, `strojmaterialy`, `interer`.

Variations are `catalog` entries (URL, titles, default overrides, own text). Frontmatter must include its own example and ≥ 3 FAQ, or the build fails.

### Response headers

| Pages | Cache | Robots | Framing |
|---|---|---|---|
| Indexable | `max-age=0, must-revalidate` | `index, follow` | Own domain + Telegram |
| `/p/[id]` | `private, no-store` | `noindex, nofollow` (meta + `X-Robots-Tag`) | Own domain + Telegram |
| `/embed/*` | as indexable | `noindex` | Any site |
| `/tg/` | as indexable | `noindex` | Telegram only |
| Hashed build assets | `max-age=31536000, immutable` | — | — |

### Implementation notes (Phase 5)

| Topic | How it works now |
|---|---|
| Input flow | `useCalculator` (`widgets/calculator-shell/model`) renders defaults with country RU on the server and in the first client render. After mount: a valid `?s=` wins alone (a shared link reproduces exactly); otherwise the last opened calc of this tool in the active room is applied over the room's sizes. Own edits go to that calc (its `draft` once it is in the list), room edits to the room (Phase 17) |
| Room binding | `FieldDef.room` (`length`, `width`, `height`, `cutLength`, `cutWidth`; `shape` on a select) and every `openings` field bind to the active room of the estimate (`entities/room` binding helpers, `entities/estimate` store). Room fields are not shown in the form since P17.7: the room row and the editor hold them. Parts are optional, nothing is invented (the room area tool has no height) |
| Conditional fields | `FieldDef.when` (`{ shape: "l" }`); a hidden field never counts in «Ещё параметры · N» and its error does not hold the result |
| Room shape | The shape select and its L-cut fields (`room: shape`, `cutCorner`, `cutLength`, `cutWidth`) always render right after the room length and width, before laying, presets and «Ещё параметры», whatever their `main` flag (`formSections()` in `model/fields.ts`); they never count in «Ещё параметры · N». To keep the 660 px budget the shape is a half-row dropdown when the next open field is half a row (laminate, linoleum, tile tools — they share the row), otherwise a full-width segment without its own label (room area, plinth) |
| Doors and windows | Each opening card (form `openings` field and the plan editor) is closed to one line — name, size and count, or wall and offset — until tapped (`shared/ui/CollapsibleCard`); a card added with «+ Дверь» / «+ Окно» opens. Closed fields stay mounted, so an error survives closing |
| Result actions | «Сохранить» / «В список» is the one full button; «Отправить», «Скопировать», «Печать» are the same small icon-over-label buttons. Only «Отправить» builds the `?s=` link (share sheet, or the link copied); «Скопировать» copies the result text alone and the print sheet (`PrintSheet`) ends with the room size and date, no link (owner, 2026-10-14) |
| Invalid input | Out of range or empty → red message under the field, the result keeps the last valid input and shows «По прошлым значениям» |
| Tools without items | Geometry tools return only `summary`; the first entry is the big number, the rest are tiles; labels in `ToolDef.summary`. Header reads «Получилось» instead of «Нужно купить» |
| `?s=` | base64url (UTF-8) JSON of fields that differ from `defaults()`; decoded values go through the tool's Zod schema, garbage is ignored. Canonical is always the clean URL |
| Tools with items | The main item's name sits in the mascot header line (under «Нужно купить»), not above the number, so a purchase tool keeps the same height as a geometry tool; the number row is photo + count + «need · останется» caption |
| Can sets | Lines of one item key are one purchase: the main figure is the total count («4 банки») with the sizes in the caption («1 × 9 л + 1 × 2,7 л + 2 × 0,9 л · останется 0,59 л»); a related item sold by volume or weight shows its size under the title («по 10 л») |
| Room list → estimate | P6.11's per-room list («Список для комнаты» under the result) was replaced in Phase 17 by the estimate: `features/room-list` now holds only `AddToList` («Добавить в список» → «В списке ✓» → «Обновить в списке»); rooms, calcs in a room, the shared block and the list page are described in [Rooms and Estimate](./rooms-and-estimate.md). Room-binding helpers stay in `entities/room`, purchase grouping in `entities/tool` |
| Running metre | `Pack.kind: "running"` with `width` (linoleum): the main figure is the cut length («8,6 м») with «ширина 2,5 м · 21,5 м²» under it; a numeric select (roll width) gets its number back from the string option |
| Select fields | Up to 4 options render as a full-width segment; `dropdown: true` puts the select in half a row (paint «Что красим» next to the height) |
| Length units | A length field with `unit: "m"` follows the form's м/см switch; `cm` and `mm` fields keep their own unit (wallpaper repeat and trim in cm) |
| Phone budget | Asserted by Playwright for every live tool: the main number ends at 643 px on wall area and wallpaper, 579 px on paint (390 × 844) |
| Server-HTML guard | `pnpm --filter web html:check` after the build: title, one H1, canonical on every prerendered page, digits in `[data-result-value]` on tool pages |
| Sheets | `ResponsiveSheet` (`packages/ui`): bottom sheet below 1024 px, centred 480 px dialog from 1024 px (`wide` → 880 px) — RoomBar editor, report error. The dialog title stays pinned while a long dialog scrolls; the sheet keeps its title outside the scrolling part |
| Room editor layout | `features/edit-room` (owner, 2026-10-14): the name field with small type chips under it for quick input (36 px, 48 px tap area; no headings), then «Размеры» (the length / width / height fields and the L-cut on a light mint card, height labelled just «Высота») and «Окна и двери» under a hairline like a calculator form's groups (no cards or numbers), the line «Размеры, окна и двери вводятся один раз…» as a `Hint` above them instead of the dialog description; from 1024 px a wide dialog with the parts on the left and «План комнаты» with the areas pinned on the right; on the phone the plan sits after the sizes. pinned footer: delete as a red ghost icon on the left, «Отмена» and «Сохранить комнату» (48 px, own width) on the right; «+ Дверь», «+ Окно» small buttons |
| Not yet | `calc_completed` event (Phase 9), «Сохранить» and report sending (Phase 7), per-tool code splitting of calc modules |

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
- [Rooms and Estimate](./rooms-and-estimate.md) — rooms, calcs in a room, shared consumables, `/spisok/`
- [Design System](../design/design-system.md) — visual spec of every block above
- [SEO and Analytics](../business/seo-and-analytics.md) — metadata, JSON-LD, events fired by the shell
- [Server API and Data](../code/server-api-and-data.md) — save/open project endpoints
- [Telegram Bot](../integrations/telegram-bot.md) — `TelegramProvider` adaptations
- Skill spec: [ui-component](../skills/ui-component.md); agent spec: [frontend-builder](../agents/frontend-builder.md)

## File Structure

| Path | Description |
|---|---|
| `apps/web/src/widgets/calculator-shell/` | `CalculatorShell`, `useCalculator`, `ResultPanel`, `StickyResultBar`, `CalcChips` |
| `apps/web/src/features/edit-room/` | `RoomBar` (room row and picker), `RoomEditor` |
| `apps/web/src/features/room-list/` | `AddToList` |
| `apps/web/src/features/estimate-totals/` | `EstimateSync`: other calcs' calculators on demand, totals for the header |
| `apps/web/src/widgets/calculator-shell/ui/LayoutScheme.tsx` | `LayoutScheme` (scheme card, plan editor button, guide, cut list) — see [Room Plan, Layout Schemes and Laying Guides](./room-plan-and-layout-guides.md) |
| `apps/web/src/entities/estimate/` | Zustand store `umnyaut:estimate:v1` (rooms, calcs, prices, totals) |
| `apps/web/src/entities/room/` | Room bindings, formatting, `FloorPlan` |
| `apps/web/src/features/{save-project,share-result,report-error,pick-country}/` | User actions |
| `packages/ui/` | Inputs, buttons, sheets, tokens |
| `packages/catalog/src/tools/` | Per-tool UI data |
