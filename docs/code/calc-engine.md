---
version: 1.4
date: 2026-10-10
category: code
---

# Calculation Engine (`@umnyaut/calc`)

> Version 1.4 · 2026-10-10 · [Code](../code/)

## Overview

`packages/calc` holds every formula in the product. Each calculator is a **pure function**: the same input always gives the same result, with no network, no clock, no randomness. That lets one piece of code compute at build time (static HTML), in the browser on every keystroke, inside the Telegram mini app, inside the widget, and in tests.

The package does not know about React, HTTP, or the database. Its only dependency is Zod. It is also the single biggest product risk (a wrong formula means a person buys the wrong amount), so it carries the strictest testing rules in the repo.

> Status: core implemented (Phase 4): types, blocks `geometry`/`packs`/`waste`/`coverage`, golden harness, invariants, reviewer export, `ProjectData` v1 and a `mergeItems()` stub. Live tools: room area, wall area (Phase 5), wallpaper and paint (Phase 6) with the `strips` engine (`cutStrips`) and can sets (`purchaseSet`). The wall list (P6.11) merges works with `mergeItems()` — same key and pack summed, rounded once (walls primer + ceiling primer = one 10 л canister); can sets from different works are merged per size, not re-optimised (P11.1). A can set returns one line per size with the same key: golden expectations and the monotonic invariant compare the sum per key (total bought must not drop when the area grows). Engines `rows`, `grid`, `frame`, `power` arrive with their tools.

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

// As implemented (packages/calc/src/types.ts):
interface Quantity { value: number; unit: 'mm' | 'm' | 'm2' | 'm3' | 'kg' | 'l' | 'pcs' }
interface Pack { kind: 'pack' | 'roll' | 'bag' | 'bucket' | 'can' | 'box' | 'piece' | 'tube'; size: Quantity }
interface Warning { code: string; level: 'info' | 'warning'; values?: Record<string, number> }
interface Step { code: string; values: Record<string, number> }   // text per code lives in catalog
// summary entries carry a key: { key: 'floorArea', value: 19.78, unit: 'm2' }
```

Numbers of a warning sit in `values` (`{ code: 'narrow_last_row', level: 'warning', values: { widthMm: 50 } }`) rather than flat on the object, so the type stays closed.

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
| Rounding | Full precision until the end. Packages always round **up** via `ceilPacks()`. Its 1e‑9 tolerance is relative to the ratio and only absorbs float noise (0.1 × 3 / 0.1 → 3, not 4); a real excess such as 10.0000001 still buys 11. Any positive need buys at least one pack |
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
| Wallpaper | `/steny/oboi/` | `strips`, `packs` | Strips = ⌈(perimeter − Σ max(opening width − roll width, 0)) ÷ roll width⌉ — a strip that only partly covers an opening is still full height; each strip is height + 10 cm trim. `cutStrips` cuts them on the repeat (offset match: phases 0 and repeat/2 alternate) after a worst-case lead of repeat − 1 mm per roll (the fitters' «высота + раппорт»), and puts the pieces above doors and above/below windows (none under 5 cm) into roll tails first; need = rolls × roll length − largest tail; paste by net wall area ÷ m² per pack; warning when strips use the roll within the ±1,5% length tolerance |
| Paint | `/steny/kraska/` | `coverage`, `packs` | Area (walls without openings and/or ceiling) × coats ÷ coverage from the can; `purchaseSet` picks the 0,9 / 2,7 / 9 л set with the least overbuy, then the fewest cans, one purchase line per size with the same key; primer = area × rate in one canister size (a litre-based optimiser would buy 7 × 1 л instead of 10 л — needs prices) |
| Laminate | `/pol/laminat/` | `rows`, `waste`, `packs` | Row by row: offset, trimming, offcut moves to next row if ≥ minimum. Diagonal/herringbone = waste % at launch |
| Linoleum | `/pol/linoleum/` | `strips` | For each roll width × 2 directions: sheets, cut length, seams, waste, price; variants sorted |
| Plinth | `/pol/plintus/` | `geometry`, `packs` | ⌈(perimeter − doors) ÷ plank length⌉; corners by shape, caps by doors, joiners by joints |
| Tile | `/plitka/plitka/` | `grid`, `waste`, `packs` | Grid with joint from centre or corner; whole and cut tiles; boxes |
| Tile adhesive | `/plitka/klej/` | `coverage` | Area × rate by trowel notch for tile format × base coef |
| Grout | `/plitka/zatirka/` | `coverage` | kg/m² = (A + B) ÷ (A × B) × joint width × depth × density |

Wave 2/3 approaches: technical spec §8. Tools `kabel`, `radiatory`, `styazhka` carry a `disclaimer` flag in `catalog`.

### Decisions to verify in real testing

Taken in Phase 4 without real tools. Re-check each one once the first formulas, golden examples and the reviewer's feedback exist (plan P6.12); change the rule here if testing disagrees.

| # | Decision | Current behaviour | How to verify | When |
|---|---|---|---|---|
| 1 | Rounding tolerance of `ceilPacks()` | Relative 1e‑9, only float noise: 0.1 × 3 / 0.1 → 3 packs, but 10.0000001 → 11. The spec example «10.0000001 must not become 11» is not followed | Golden examples on exact pack multiples for wave‑1 tools; compare with the reviewer and Qalculator. If real inputs land just above a multiple (e.g. dimensions in cm → m² with tiny excess), consider a wider tolerance | P5.8, P6.x, reviewer pass (P6.10) |
| 2 | Tiny positive need | Any need > 0 buys at least one pack (found by fast-check: 1e‑9 and 5e‑324 gave 0) | Check that no tool produces a phantom 1 pack from a near-zero leftover of geometry (e.g. openings almost equal to walls); if it does, the tool must clamp or warn, not `ceilPacks` | First tools with openings (P5.8 wall area, P6.4 wallpaper, P6.5 paint) |
| 3 | Norms registry is empty | No consumption rate, overlap or waste % exists until a tool brings it with `source` + `checkedAt`; content with `{{norm.*}}` fails the build without the norm | Each wave‑1 tool adds its norms from P0.7 sources; reviewer confirms values | P0.7, Phase 6 |
| 4 | Harness proven only on a demo tool | Golden and invariant runs skip `version: 0`; the harness is tested on `test/fixtures/demo-tool.ts` | The first real tool (P5.8) must show up in `golden.test.ts` and `invariants.test.ts` as executed, not skipped, and fail when a golden number is broken on purpose | P5.8 |
| 5 | `tsx` with disabled `esbuild` postinstall | `allowBuilds: { esbuild: false }` in `pnpm-workspace.yaml`; the platform binary comes from esbuild's optional package | Run `pnpm calc:export` on CI (Linux) and on the owner's Mac once real golden files exist | P6.10 |
| 6 | Pack choice by litres, not by money | `bestPackSet` without prices minimises overbuy in litres, then pack count. Paint uses it (0,9 / 2,7 / 9 л) — owner, 2026-10-10: keep least overbuy until prices, even where one 9 л can is likely cheaper than 3 × 2,7 л; primer stays one canister size because 7 × 1 л would beat 10 л | Add pack price fields (`kind: "price"` per size) and switch both to the cheapest set; compare with real shop prices per country | Phase 7+ (prices), owner decision |

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

1. **Golden examples** — `golden.ts` exports a `GoldenFile`: ≥ 10 examples, each with `input` (merged over `defaults()`), a partial `expected` (items by key, summary, warning codes, cost) and a `source` (datasheet, norm, manual derivation, reviewer). Competitor numbers go to `benchmarks`, never to `expected`; a benchmark that differs must carry an `explanation`. One shared test (`test/golden.test.ts`) runs every tool with `version ≥ 1`; **CI fails if a tool has fewer than 10**. Placeholders (`version: 0`) are skipped.
2. **Invariants via fast-check** — for any valid input: bought ≥ need; packs is an integer; more area never yields fewer packs; no `NaN`/`Infinity` in the result. Each tool adds an entry to `test/arbitraries.ts` (input generator + `grow()`); a tool with a formula and no entry fails.
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
| `packages/calc/src/project/` | `ProjectData` v1 Zod schema (+ `roomSchema`), `migrateProject()`, `mergeItems()` (stub: sums same key + pack, first-seen order) |
| `packages/calc/src/golden.ts` | `GoldenFile` types, `matchExpectation()`, `validateGolden()` |
| `packages/calc/src/invariants.ts` | `resultViolations()`, `growthViolations()` |
| `packages/calc/test/golden.test.ts` | Runs all golden files, enforces ≥ 10 |
| `packages/calc/test/invariants.test.ts` | fast-check properties per tool; generators in `test/arbitraries.ts` |
| `packages/calc/test/harness.test.ts` | Self-test of the harness on a demo tool (`test/fixtures/demo-tool.ts`) |
| `packages/calc/scripts/export-golden.ts` | `pnpm calc:export [--csv] [--out file] [ids…]` — reviewer table |
