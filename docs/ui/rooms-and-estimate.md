---
version: 1.0
date: 2026-10-19
category: ui
---

# Rooms and Estimate

> Version 1.0 · 2026-10-19 · [UI](../ui/)

## Overview

A renovation is several rooms, not one. Since Phase 17 a person measures a room once, counts any number of materials in it, and every calc lands in **one estimate** — in the interface «Список покупок» (`/spisok/`), internally «смета» / `Estimate`. Main materials stay with their room; shared consumables (tile adhesive, grout, primer, wallpaper paste) are summed across all rooms and rounded to packs **once**, which is both what people buy and cheaper.

There is no sign-up: the estimate lives in the browser (`localStorage`). It replaces the old single «Моя комната» (`umnyaut:room:v1`), the per-room list (`umnyaut:list:v1`), the four-step planner of Phase 11 and «Мои расчёты». Calculator URLs did not change; the room is picked from the estimate and never enters a URL.

Source of truth: RU spec `docs/specs/UmnyAut — комнаты и смета спецификация.md` (v2.2, decisions Р1–Р20, scenarios 1–7). This page is the English digest plus how the code implements it. Three simplicity rules from the spec drive everything: **zero extra steps** (a visitor from search sees a result at once), **one room in a calculator at a time**, **consumables are shared**.

## Rules

### Four entities

| Entity | For the person | Stores |
|---|---|---|
| Estimate | The whole renovation, one list with a total | Name («Ремонт квартиры»), country, rooms, calcs, shared-consumable prices, saved totals |
| Room | A space measured once | Name, type, shape (rect / L), length, width, height, L-cut, doors and windows with their wall and offset |
| Calc | One calculator for one surface of a room | Tool, formula version, surface, own material input, main-material prices, `openedAt`, `addedAt` |
| Consumable | Adhesive, grout, primer, wallpaper paste | Product key; the quantity is summed over every calc |

A field that describes the space belongs to the room; one that describes a material or a work belongs to the calc. Which items are shared is decided by the catalog flag `ItemDef.shared`, never by estimate code — a new tool joins without touching the estimate.

### Decisions that shape the code

| # | Rule | Where it lives |
|---|---|---|
| Р1 | A consumable merges by **product key** = item + variant (adhesive class, grout colour, wallpaper type) + pack kind + pack size | `productKey()`, `PurchaseItem.variant` |
| Р2 | Shared-consumable prices live in the estimate by product key; main-material prices stay in the calc | `Estimate.prices`, `EstimateCalc.prices` |
| Р3 | The header reads **saved totals**, never recomputes (loading every calculator on every page would break the 250 KB tool-page budget) | `Estimate.totals`, `saveTotals()` |
| Р4 | A room is created silently on the first size; a calc joins the list **only by «Добавить в список»**. Later edits wait as a draft until «Обновить в списке» | `addedAt`, `draft`, `commitDraft()` |
| Р5 | The mint room row has the same height in both states (no CLS) | `features/edit-room/ui/RoomBar.tsx` |
| Р6, Р16 | Surfaces: tile, adhesive, grout — floor / walls / floor and walls; paint — walls / ceiling / both; wallpaper, laminate, linoleum, plinth — one calc per room. Several calcs of a tool only where there is a surface choice, at most one per surface | `ToolDef.surface`, `manyCalcs()`, `nextSurface()` |
| Р10 | A room edit that renumbers the walls resets the calcs' wall-bound fields and says so | `ToolDef.wallBound`, `wallNumbering()`, `saveRoom()` |
| Р11 | A separate adhesive or grout calc replaces the consumable tile brings along only in the same room and only when it covers the whole surface | `aggregateEstimate()` → `replaced` |
| Р14 | Without a server, «Ссылка» is a snapshot after `#`, opened read-only at `/spisok/prosmotr/` | `encodeSnapshot()`, `SharedEstimatePage` |
| Р20 | UI says «Список покупок», «Добавить в список», «Итого по списку»; code names and the storage key keep «estimate» | catalog strings |

Owner changes after the spec text: «Метка» was removed from the form (2026-10-15; a stored `label` still shows in chips, the list and print); the room editor never opens by itself (2026-10-15 — it became the LCP); «Забрать себе» was removed from shared links (2026-10-14); the header shows the **number** of added calcs, not the sum (2026-10-14).

### Scenarios (covered one by one in `e2e/scenarios.spec.ts`, phone and desktop)

1. **First visit from search** — the example room is counted at once; «Указать размеры» opens the editor; the saved room is «Комната 1»; «Добавить в список» puts the calc in the list and the header count appears.
2. **Second room** — the room row's picker → «Новая комната» → the editor (name, type, sizes, doors) → the calculator counts for the new room.
3. **Same room, another material** — «Дальше по ремонту» opens the plinth with the room already chosen.
4. **The list** — the header button opens every room, shared consumables with the saving, the total and export; a row leads back to its calculator, room and calc.
5. **New sizes** — the editor names what it will recount («Пересчитаем расчёты этой комнаты: Обои, Ламинат») and what it resets («Обои: сбросим начало оклейки, …»); every calc and the list follow.
6. **Tile on walls and floor differs** — «+ Ещё» creates a second calc on the free surface; the first is untouched; the list shows two rows.
7. **From the old version** — «Моя комната» becomes «Комната 1», the old list entries become its calcs; old keys are removed only after the estimate is written.

### The calculator

- **Room row (mint, `RoomBar`)** — with no rooms: «Размеры комнаты · Пример: 4,6 × 4,3 м» and «Указать размеры». With a room: «[Ванная ▾] 2,2 × 1,7 × 2,5 м · Изменить». The picker (sheet on the phone) lists rooms with sizes and «плитка есть», then «+ Новая комната». The server always renders the no-room state; the room replaces it after mount at the same height.
- **Room fields left the form** — length, width, height, shape, cut, doors and windows are edited only in the room editor.
- **Chips row (`CalcChips`)** — shown only when there is a choice (two calcs, or one and a free surface): one chip per calc, «+ Ещё» while a surface is free, remove with «Вернуть». Opening a calculator in a room opens the calc opened last there.
- **Overlap** — a calc covering a surface another calc of the room already covers gets a warning under the result with «Разделить» (`splitCalc`). Different tools on one surface (wallpaper and paint) are warned about too.
- **Shared block** — a grey block «Клей, затирка и грунтовка · общие на список» (`ToolDef.sharedBlock`) holds the fields that pick a shared product. A calc not yet started takes the list's product; a calc on another product gets a `Hint` «В списке уже есть «Плиточный клей C2TE, мешок 25 кг» — взять его?» with «Взять». On the phone the block is under «Ещё параметры».
- **Result** — «Нужно купить · <room>»; «Ещё понадобится · на весь список» with this calc's share and the estimate's packs; a saving `Hint` with the cat's head when merging saved packs. The primary button is «Добавить в список» → «В списке ✓» → «Обновить в списке». The phone's sticky bar reads «N коробок · К списку».

### The room editor

One editor for the whole site (`features/edit-room`): a sheet below 1024 px, an 880 px two-column dialog from 1024 px. Name (default «Комната N», a type chip names an unnamed room), type (Зал, Спальня, Кухня, Ванная, Прихожая, Другое — it only suggests tools), shape and sizes in m / cm, doors and windows with wall and offset, a mini `FloorPlan` with floor, perimeter, walls without openings and ceiling. Above the buttons: the recount line and any resets (Р10). Delete asks first when the room has calcs. Niches, ledges and boxes are out of v1.

### The list page `/spisok/`

A static `noindex` shell outside the sitemap; everything below the breadcrumbs appears after mount. Top to bottom: title with a pencil and «Хранится на этом устройстве», metrics (rooms, floor area, calcs, saved on consumables), a card per room (one row per calc in the order of works — rough before finish, `workOrder` in the catalog — each row a link back to its calculator with that room and calc, removable with «Вернуть»), «Общие расходники» with the rooms they come from and the saving, empty rooms with «+ Ламинат», «+ Обои» … by room type (`roomSuggestions`), «+ Комната», and the «Итого по списку» card (sum, rows by room, «без N позиций», «Печать / PDF», «Отправить», «Скопировать», «Ссылка»). No total card while nothing is counted. While the estimate is read and its calculators load, a placeholder of the same frame shows; `<main>` is at least a screen tall so the footer never jumps (P17.15).

Export: «Скопировать» gives plain text for a messenger; «Отправить» opens the share sheet with the text and the link (copy fallback); print / PDF is the browser's print with print styles and the date (Р13); «Ссылка» packs a snapshot (rooms, calcs, prices — no totals, no active room) into `/spisok/prosmotr/#s=…`. That page is a document: logo instead of the site header, no footer, tables per room, shared consumables, total, «Как посчитано», «Перейти на главную»; nothing is written on the receiver's device. Snapshots over 8 KB suggest print; old `/spisok/#s=` links redirect.

### Header

«Калькуляторы ▾» · «Методика» · list button: clipboard icon, «Список» from the desktop up, the number of added calcs in a mint circle (none while empty), «Список покупок» for screen readers, `aria-current` on `/spisok/`. The country switch moved to the footer (time-zone detection stays, Р12).

## Data Model

Project schema 2 (`packages/calc/src/project/schema.ts`) **is** the estimate: one schema for the browser, the `#` link and the future Supabase snapshot. All lengths are integer millimetres.

```ts
Estimate {
  schemaVersion: 2; id; name; country: "RU" | "KZ" | "BY" | "KG";
  rooms: EstimateRoom[];                       // ≤ 20
  calcs: EstimateCalc[];                       // ≤ 60
  prices: Record<productKey, number>;          // shared-consumable pack prices (Р2)
  totals?: { sum; byRoom; saved; missing; at };// for the header (Р3)
  activeRoomId?; updatedAt; master?;
}
EstimateRoom { id; name; type: living|bedroom|kitchen|bathroom|hall|other;
               shape?: rect|l; lengthMm?; widthMm?; heightMm?;   // optional: a room exists from the first size
               cutLengthMm?; cutWidthMm?; cutCorner?; openings?: Opening[] }
EstimateCalc { id; roomId; tool; toolVersion;  // 0 = unknown (moved from the old list)
               surface?: floor|walls|ceiling|floor-walls|walls-ceiling;
               label?;                          // legacy, no longer edited
               input;                           // own material fields that differ from defaults only
               prices?;                         // main-material prices by item key
               openedAt; addedAt?;              // addedAt set = in the list (Р4)
               draft? }                         // edits after adding, until «Обновить в списке»
productKey = `${key}|${variant}|${pack.kind}|${pack.size.value}|${pack.size.unit}`
```

Schema checks: unique room and calc ids, every calc has its room, the active room exists. `migrateProject()` moves schema 1 (the planner's rooms with works) to schema 2. Ids are `r1`, `c1`… (`nextId()`), pure so the same estimate always gets the same ids.

## Architecture

```
packages/calc/project          pure: schema 2, migrateProject, productKey, mergeItems, aggregateEstimate
        ▲
apps/web/src/entities/estimate  Zustand store `umnyaut:estimate:v1` + pure ops, legacy move, snapshot
        ▲
features/estimate-totals        loads calculators on demand, computes the estimate, saves totals
features/edit-room              RoomBar (room row + picker) and RoomEditor
features/room-list              AddToList button (Добавить / В списке / Обновить)
        ▲
widgets/calculator-shell        useCalculator (input ↔ calc ↔ room), CalcChips, shared block, result
widgets/site-header             list button reading only the count from storage
widgets/home-room               home room block, «Ваш ремонт» from totals
views/estimate                  /spisok/ board, export, /spisok/prosmotr/ read-only document
```

**Store.** `entities/estimate/model/store.ts` is a thin Zustand `persist` wrapper (`skipHydration`) over pure steps in `model/ops.ts`; every rule — limits, silent room creation, «Комната N» names, wall-bound resets, undo of a removed calc — is a tested pure function taking the estimate and the time. `hydrateEstimate()` is called from an effect once per page: on the first run it moves `umnyaut:room:v1` + `umnyaut:list:v1` into a new estimate (`model/legacy.ts`) and deletes the old keys only after the write; a stored estimate wins over old data from a stale tab. Selectors `useActiveRoom`, `useRoomCalcs`, `useToolCalcs(tool)` return stable objects so components re-render only when their part changes.

**Calculator input flow** (`widgets/calculator-shell/model/useCalculator.ts`). Render 1 equals the server render (defaults, RU). After mount: a valid `?s=` wins alone; otherwise the last opened calc of this tool in the active room is applied over the room's sizes. Own edits go to that calc (created on the first edit; once in the list, into `draft`); room edits go to the room; room edits made elsewhere (row, editor, another room) flow back into the fields. `ownInput()` keeps only changed non-room fields, `surfaceOf()` reads the calc's surface from `ToolDef.surface`.

**Aggregation.** The browser computes each calc (`calcItems()`: defaults → calc input → room sizes → schema → `compute()`), then the pure `aggregateEstimate({ roomIds, calcs, shared, prices })` returns room lines (main materials), shared lines (needs summed per product key, rounded once, each calc's share and the packs it would buy alone, `savedPacks`, `saved` money when priced), overlaps per room, Р11 replacements and totals. Two property tests guard it: merged bought ≥ need, merged packs ≤ the sum of separate packs.

**Where it is computed.**

- In a calculator, `EstimateSync` (a client-only dynamic import, out of the first-screen JS) loads the modules of the estimate's calcs via `useToolModules`, keeps the totals saved for the header (`saveTotals` writes only on change) and reports the open calc's shared consumables and the list's products for the shared block.
- On `/spisok/`, `EstimateBoard` hydrates, loads the needed modules, recounts, saves totals and builds the board (`views/estimate/model/board.ts`).
- The header only reads stored data: it parses `umnyaut:estimate:v1` itself and counts calcs with `addedAt`, so no store or schema code ships on every page. The home «Ваш ремонт» uses the store but shows the saved `totals`, never loading calculators.

**Performance trade-off (measured 2026-10-19, P17.15).** First-screen JS is unchanged by the estimate (tool pages ≤ 238 KB, `/spisok/` 217 KB, `js:check`). With a filled list the calculators of other calcs load on demand (≈ 33 KB on the tile page), and because the room is applied after mount, the late result becomes the LCP: 4.0–4.3 s in the lab against 3.4 s with an empty list. CLS stays ≤ 0.05. The chips row is a separate chunk; one run in three it lands after the room and shifts the result by ≈ 0.05 — importing it statically would put tool pages at 252.8 KB, over budget.

## Configuration

Per tool, in `packages/catalog/src/tools/<id>.ts`:

| Key | Purpose |
|---|---|
| `items.<key>.shared: true` | The item is a shared consumable, merged across the estimate |
| `items.<key>.product` | Form fields that pick the item's product: `variant`, `customName` (grout «Свой цвет»), `pack` |
| `surface` | `{ field, values }` — a select maps to a `Surface` (several calcs per room), or `{ fixed }` |
| `sharedBlock` | `{ title, groups }` — the grey block's title and the field groups it gathers |
| `wallBound` | `{ fields, note }` — fields reset when the walls are renumbered, and how the editor names them |
| `nextSteps` | «Дальше по ремонту»: tools that continue the work with the same room |

Catalog-wide: `packages/catalog/src/estimate.ts` — `workOrder` (row order, rough → finish), `roomSuggestions` (room type → tools for empty rooms), all `/spisok/` strings; `shell.ts` — room editor, chips and recount strings; `home.ts` — `typeWorks` for the home room block.

Limits: `ESTIMATE_LIMITS` — 20 rooms, 60 calcs, 20 openings per room, room name 40, estimate name 80. Snapshot: `SNAPSHOT_MAX` 8 KB, `SNAPSHOT_PREFIX` `#s=`.

## Usage

Add a shared consumable to a new tool — no estimate code changes:

```ts
// packages/catalog/src/tools/<id>.ts
items: {
  primer: { title: "Грунтовка", photo: "primer", shared: true, product: { pack: "primerPackL" } },
},
```

The calc module returns `variant` on the item when the product has kinds (adhesive class, grout colour), so `productKey()` keeps different products apart.

Read the estimate in a component:

```ts
import { hydrateEstimate, useActiveRoom, useToolCalcs } from "@/entities/estimate";

useEffect(() => void hydrateEstimate(), []);
const room = useActiveRoom();          // null until hydrated or with no rooms
const calcs = useToolCalcs("plitka");  // this tool's calcs in the active room, drafts too
```

Seed an estimate in a Playwright test or Lighthouse: write `{ state: { estimate }, version: 1 }` under `umnyaut:estimate:v1` before the page loads (`e2e/estimate.spec.ts`, `scripts/lighthouse-seed.cjs`).

Not built yet (stage G): the short link `/p/<id>` with the snapshot in Supabase (P17.17, needs Phase 7) — `adoptEstimate`, `mergeEstimate`, `replaceEstimate` in `entities/estimate/model/share.ts` are kept for it but unused since «Забрать себе» was removed; «Сохранить в Telegram» (P17.18, needs Phase 12).

## Cross-references

- [Calculator Shell, Pages and Routing](./calculator-shell-and-pages.md) — the shell this page plugs into, routes and storage keys
- [Home Room Block](./home-room-block.md) — «Какую комнату считаем?» and «Ваш ремонт» on the home page
- [Room Plan, Layout Schemes and Laying Guides](./room-plan-and-layout-guides.md) — `FloorPlan`, opening places, wall numbering
- [Calculation Engine](../code/calc-engine.md) — `PurchaseItem.variant`, `productKey`, `mergeItems`, `aggregateEstimate`
- [Architecture Overview](../architecture/overview.md) — state and where things run
- [Server API and Data](../code/server-api-and-data.md) — `projects` table for the future short link
- [Product and Domain](../business/product-and-domain.md) — the merged shopping list as the product
- [Design System](../design/design-system.md) — one orange element, `Hint` with the cat's head
- [Development Plan](../plan/development-plan.md) — Phase 17 tasks
- Source: `docs/specs/UmnyAut — комнаты и смета спецификация.md`

## File Structure

| Path | Description |
|---|---|
| `packages/calc/src/project/schema.ts` | Schema 2 (`Estimate`, rooms, calcs, totals), limits, `migrateProject`, `nextId` |
| `packages/calc/src/project/merge.ts` | `productKey`, `mergeItems` |
| `packages/calc/src/project/estimate.ts` | `aggregateEstimate`, `surfaceParts`, aggregate types |
| `apps/web/src/entities/estimate/model/store.ts` | Zustand store `umnyaut:estimate:v1`, `hydrateEstimate`, selectors |
| `apps/web/src/entities/estimate/model/ops.ts` | Pure estimate steps: rooms, calcs, drafts, undo, `wallNumbering` |
| `apps/web/src/entities/estimate/model/legacy.ts` | One-time move from `umnyaut:room:v1` and `umnyaut:list:v1` |
| `apps/web/src/entities/estimate/model/snapshot.ts` | `#s=` snapshot encode / decode with size limits |
| `apps/web/src/features/estimate-totals/` | `calcItems`, `computeEstimate`, `sharedOf`, `productsOf`, `saveTotals`, `useToolModules`, `EstimateSync` |
| `apps/web/src/features/edit-room/` | `RoomBar`, `RoomEditor`, recount and reset line (`recalcOf`) |
| `apps/web/src/features/room-list/` | `AddToList` button |
| `apps/web/src/widgets/calculator-shell/model/calcs.ts` | `ownInput`, `surfaceOf`, `manyCalcs`, `nextSurface`, `overlapOf`, chip labels |
| `apps/web/src/widgets/calculator-shell/model/shared.ts` | Shared block: list products, «взять его?» offers |
| `apps/web/src/widgets/calculator-shell/ui/Calcs.tsx` | `CalcChips`, `CalcOverlapHint` |
| `apps/web/src/widgets/site-header/ui/EstimateButton.tsx` | Header list button with the count |
| `apps/web/src/views/estimate/` | `/spisok/` board, room cards, total card, export, read-only shared page |
| `apps/web/app/spisok/page.tsx`, `apps/web/app/spisok/prosmotr/page.tsx` | Thin routes |
| `packages/catalog/src/estimate.ts` | `workOrder`, `roomSuggestions`, list strings |
| `apps/web/e2e/scenarios.spec.ts`, `apps/web/e2e/estimate.spec.ts` | Scenarios 1–7; list page journeys |
| `apps/web/lighthouserc.estimate.cjs`, `apps/web/scripts/lighthouse-seed.cjs` | Lighthouse with a filled list |
