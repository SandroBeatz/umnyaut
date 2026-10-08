---
version: 1.0
date: 2026-10-08
category: code
---

# Calculation Engine (`@umnyaut/calc`)

> Version 1.0 · 2026-10-08 · [Code](../code/)

## Overview

`packages/calc` holds every formula in the product. Each calculator is a **pure function**: the same input always gives the same result, with no network, no clock, no randomness. That lets one piece of code compute at build time (static HTML), in the browser on every keystroke, inside the Telegram mini app, inside the widget, and in tests.

The package does not know about React, HTTP, or the database. Its only dependency is Zod. It is also the single biggest product risk (a wrong formula means a person buys the wrong amount), so it carries the strictest testing rules in the repo.

> Status: planned, not yet implemented. Contracts below are fixed by the technical spec §5 and design spec §18.

## Architecture

### Tool contract

```ts
export interface ToolModule<I, R extends ToolResult = ToolResult> {
  id: ToolId;                          // 'laminat'
  version: number;                     // bump when the formula changes
  input: z.ZodType<I>;                 // input schema with allowed bounds
  defaults(ctx: CalcContext): I;       // typical values, aware of room and country
  compute(input: I, ctx: CalcContext): R;
}

export interface CalcContext {
  room?: Room;                         // "My room", if already entered
  country: 'RU' | 'KZ' | 'BY' | 'KG';
}

export interface ToolResult {
  items: PurchaseItem[];               // what to buy: main + related
  summary: Quantity[];                 // intermediate numbers: area, perimeter
  cost?: Cost;                         // when a pack price is entered
  warnings: Warning[];                 // code, level, numbers for the text
  steps: Step[];                       // "How calculated": formula + substituted numbers
  layout?: Layout;                     // scheme geometry, if any
}

export interface PurchaseItem {
  key: string;                         // 'laminate' | 'underlay' | 'plinth' — also the photo key
  role: 'main' | 'related';
  need: Quantity;                      // required by calculation
  pack: Pack;                          // package size
  packs: number;                       // packages to buy, integer
  bought: Quantity;                    // amount that will be bought
  leftover: Quantity;                  // leftover
  shopQuery?: string;                  // query for "View material" (stage 3)
  nextTool?: ToolId;                   // detailed calc for this item
}
```

This contract covers standard requirements 1, 2, 4, 5, 6, 7 and 15. The planner merges `items` from several tools via `mergeItems()` without recomputing anything itself.

### Room model

```ts
interface Room {
  shape: 'rect' | 'l' | 'polygon';
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  cut?: { lengthMm: number; widthMm: number };   // cut-out for L-shaped room
  points?: [number, number][];                   // free contour, planner v2
  openings: { type: 'door' | 'window'; widthMm: number; heightMm: number; count: number }[];
}
```

### Layout geometry (one shape for all schemes)

```ts
interface Layout {
  kind: 'rows' | 'grid' | 'strips' | 'points' | 'outline';
  widthMm: number;
  heightMm: number;
  pieces: { x: number; y: number; w: number; h: number; cut: boolean; reused?: boolean }[];
  stats: { whole: number; cut: number; wasteM2: number };
}
```

Engines return `Layout`; a single `LayoutScheme` component draws it as SVG. Above 2,000 pieces the scheme simplifies to rows.

### Calculation rules

| Topic | Rule |
|---|---|
| Units | Lengths inside the module are **integer millimetres**. Areas/volumes in m²/m³. The form converts m/cm → mm |
| Rounding | Full precision until the end. Packages always round **up** via `ceilPacks()` with 1e‑9 tolerance (10.0000001 must not become 11) |
| Display | Decimal places and formatting belong to the UI, not the formula |
| Waste | `WasteRule`: default % depends on laying method and room shape; user can override |
| Texts | The module returns **codes and numbers** only: `{ code: 'narrow_last_row', widthMm: 50 }`. Russian text lives in `catalog` |
| Norms | Consumption rates, lux norms, cable tables are data in `catalog` with `source` and `checkedAt` |
| Errors | `compute` never throws on schema-valid input. Doubtful input → a warning, not a refusal |
| Version | `version` is stored in projects; when a formula changes, projects recompute and show “calculation updated” |

### Shared building blocks

| Block | Does | Used by |
|---|---|---|
| `geometry` | Area/perimeter of rect, L-shape, polygon; wall area minus openings | Almost all |
| `packs` | Round to packages, leftover, best can-set with minimal overpay | All with purchases |
| `waste` | Waste rules by method | Floor, tile, wallpaper, panels |
| `coverage` | Rate per m² × layers × base coefficient | Paint, primer, putty, plaster, adhesive, grout |
| `rows` | Row layout: offset, trimming, last row, offcut reuse | Laminate, vinyl, panels, lining |
| `grid` | Grid from centre or corner: joint, cut tiles | Tile |
| `strips` | Strips from a roll with repeat and offset | Wallpaper, linoleum, curtains |
| `frame` | Framing: profiles, hangers, fasteners by pitch | Drywall, drywall ceiling, panel battens |
| `power` | Power by volume with corrections | Radiators, AC, underfloor heating, lighting |

Only three engines need new geometry: `rows`, `grid`, `strips`.

### Wave‑1 approaches

| Tool | URL | Blocks | Approach |
|---|---|---|---|
| Room area | `/osnova/ploshchad-komnaty/` | `geometry` | Rect; L = rect − cut; niches/protrusions signed. Writes “My room” |
| Wall area | `/osnova/ploshchad-sten/` | `geometry` | Perimeter × height − Σ openings; ceiling = floor |
| Wallpaper | `/steny/oboi/` | `strips`, `packs` | Strips around perimeter w/o openings; strips per roll = ⌊roll length ÷ (height + allowance + repeat)⌋; rolls = ⌈strips ÷ strips per roll⌉; glue by area |
| Paint | `/steny/kraska/` | `coverage`, `packs` | Area × label rate × layers × surface coef; can set by search with minimal overpay |
| Laminate | `/pol/laminat/` | `rows`, `waste`, `packs` | Row by row: offset, trimming, offcut moves to next row if ≥ minimum. Diagonal/herringbone = waste % at launch |
| Linoleum | `/pol/linoleum/` | `strips` | For each roll width × 2 directions: sheets, cut length, seams, waste, price; variants sorted |
| Plinth | `/pol/plintus/` | `geometry`, `packs` | ⌈(perimeter − doors) ÷ plank length⌉; corners by shape, caps by doors, joiners by joints |
| Tile | `/plitka/plitka/` | `grid`, `waste`, `packs` | Grid with joint from centre or corner; whole and cut tiles; boxes |
| Tile adhesive | `/plitka/klej/` | `coverage` | Area × rate by trowel notch for tile format × base coef |
| Grout | `/plitka/zatirka/` | `coverage` | kg/m² = (A + B) ÷ (A × B) × joint width × depth × density |

Wave 2/3 approaches: technical spec §8. Tools `kabel`, `radiatory`, `styazhka` carry a `disclaimer` flag in `catalog`.

## Configuration

No runtime configuration. Norms and presets are data in `packages/catalog` (each with `source` and `checkedAt`). Coverage threshold for `packages/calc`: **95% of lines**.

## Usage

```ts
import { laminat } from '@umnyaut/calc/tools/laminat';

const ctx = { country: 'RU', room: myRoom } as const;
const input = laminat.defaults(ctx);
const result = laminat.compute({ ...input, packAreaM2: 2.22 }, ctx);
// result.items[0] → { key: 'laminate', role: 'main', packs: 10, ... }
```

### Tests (mandatory for every tool)

1. **Golden examples** — `golden.ts` with ≥ 10 entries: input, expected result, source (manufacturer datasheet, manual calc, competitor cross-check). One shared test runs all tools; **the build fails if a tool has fewer than 10**.
2. **Invariants via fast-check** — for any valid input: bought ≥ need; packs is an integer; more area never yields fewer packs; no `NaN`/`Infinity` in the result.
3. **Coverage** ≥ 95% lines for `packages/calc`.
4. **Reviewer export** — `pnpm calc:export` dumps a wave's golden examples into a table a master can read without code access; corrections come back as new golden examples.

Performance target: `compute()` < 5 ms; tile/laminate layout goes through `useDeferredValue` in the UI.

## Cross-references

- [Architecture Overview](../architecture/overview.md) — import rules (`calc` imports only Zod)
- [Product and Domain](../business/product-and-domain.md) — calculator standard and catalog waves
- [Calculator Shell, Pages and Routing](../ui/calculator-shell-and-pages.md) — how the UI calls `defaults()`/`compute()`
- [Server API and Data](../code/server-api-and-data.md) — `ProjectData` stores only input + `toolVersion`
- [Engineering Practices](../practices/engineering-practices.md) — testing strategy
- Skill specs: [new-calculator](../skills/new-calculator.md), [calculator-release-check](../skills/calculator-release-check.md)
- Agent specs: [calc-engineer](../agents/calc-engineer.md), [formula-reviewer](../agents/formula-reviewer.md)

## File Structure

| Path | Description |
|---|---|
| `packages/calc/src/types.ts` | `ToolModule`, `ToolResult`, `PurchaseItem`, `Room`, `Layout`, `Quantity`, `Pack` |
| `packages/calc/src/blocks/{geometry,packs,waste,coverage,rows,grid,strips,frame,power}.ts` | Shared building blocks |
| `packages/calc/src/tools/<id>/index.ts` | One tool module |
| `packages/calc/src/tools/<id>/golden.ts` | Golden examples for the tool |
| `packages/calc/src/project/` | `ProjectData` schema, `mergeItems()`, schema migrations |
| `packages/calc/test/golden.test.ts` | Runs all golden files, enforces ≥ 10 |
| `packages/calc/test/invariants.test.ts` | fast-check properties |
