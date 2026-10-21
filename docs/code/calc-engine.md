---
version: 2.2
date: 2026-10-19
category: code
---

# Calculation Engine (`@umnyaut/calc`)

> Version 2.2 · 2026-10-19 · [Code](../code/)

## Overview

`packages/calc` holds every formula in the product. Each calculator is a **pure function**: the same input always gives the same result, with no network, no clock, no randomness. That lets one piece of code compute at build time (static HTML), in the browser on every keystroke, inside the Telegram mini app, inside the widget, and in tests.

The package does not know about React, HTTP, or the database. Its only dependency is Zod. It is also the single biggest product risk (a wrong formula means a person buys the wrong amount), so it carries the strictest testing rules in the repo.

> Status: core implemented (Phase 4): types, blocks `geometry`/`packs`/`waste`/`coverage`, golden harness, invariants, reviewer export, project schema 2 (the estimate), `productKey()` / `mergeItems()` and `aggregateEstimate()` (Phase 17). Live tools (10): room area, wall area (Phase 5); wallpaper, paint, plinth, linoleum, laminate, tile, tile adhesive, grout (Phase 6) with the engines `strips` (`cutStrips`), `rows` (`layRows`), `grid` (`gridArea`) and can sets (`purchaseSet`); `frame` and `power` arrive with wave 2. The list of purchases merges calcs with `mergeItems()` by product key — same key and pack summed, rounded once (walls primer + ceiling primer = one 10 л canister); can sets from different works are merged per size, not re-optimised (P11.1). A can set returns one line per size with the same key: golden expectations and the monotonic invariant compare the sum per key (total bought must not drop when the area grows).

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
  variant?: string;                    // product kind: adhesive class, grout colour, wallpaper type (Р1)
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

This contract covers standard requirements 1, 2, 4, 5, 6, 7 and 15. The estimate merges `items` from several calcs via `aggregateEstimate()` without recomputing anything itself (see Estimate aggregation below).

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
  outline: [number, number][];          // room contour, clockwise from the top-left corner
  walls: PlanWall[];                    // numbered clockwise; the UI shows wall + 1
  pieces: { x: number; y: number; w: number; h: number; cut: boolean; reused?: boolean; row?: number }[];
  marks: LayoutMark[];                  // placed doors and windows, the start corner
  rows?: LayoutRow[];                   // row layouts: what to cut per row, where each offcut comes from and goes
  guide: Step[];                        // laying steps as codes + numbers; text in catalog `ToolDef.guide`
  stats: { whole: number; cut: number; reused: number; wasteM2: number };
}
```

Engines return `Layout` built from the very plan they counted the purchase on; a single `LayoutScheme` component draws it as SVG. Above 2,000 pieces the scheme simplifies to rows. Live for laminate (straight laying): `traceRows` + `rowsLayout` in `blocks/layout-rows.ts`. Room plan helpers (`roomOutline`, `placeOpenings`, `cornerFlips`, shared `openingInputSchema` with optional `places`) are in `blocks/plan.ts`; `Room` gains `cutCorner` and `Opening` gains `places` — positions never change a count. Full design and the per-tool plan: [Room Plan, Layout Schemes and Laying Guides](../ui/room-plan-and-layout-guides.md).

### Estimate aggregation (Phase 17)

`packages/calc/src/project` turns many computed calcs into one list of purchases. It is pure: the browser computes each calc with its tool module and passes the items.

- **Product key (Р1)** — `productKey(item)` = `key | variant | pack.kind | pack.size.value | pack.size.unit`. `PurchaseItem.variant` carries the product kind (adhesive class C1T / C2TE, grout colour, wallpaper type for paste), so white and graphite grout never merge. Variants changed no formula and no golden number (P17.4). Shared-consumable prices are stored in the estimate under this key, so its spelling must never change.
- **`mergeItems(items)`** — groups by product key, sums `need`, rounds up to packs once via `purchase()` (0.4 + 0.4 bag buys 1 bag); `main` wins over `related`; first-seen order.
- **`aggregateEstimate({ roomIds, calcs, shared, prices })`** — `calcs` are `EstimateCalcItems` (`id`, `roomId`, `surface`, `items`, main-material `prices`, `priceBasis`); `shared` is the set of item keys the catalog flags `shared`. Returns:
  - `rooms[]` — main-material lines per room with `cost` where priced, `sum`, `missing`;
  - `shared[]` — one `SharedLine` per product key: the merged item, each calc's `SharedShare` (need and the packs it would buy alone), `separatePacks`, `savedPacks`, and `saved` money when priced;
  - `overlaps[]` — two finish calcs of a room on the same surface part (`surfaceParts()`: `floor-walls` → floor + walls);
  - `replaced[]` — Р11: a calc that counts a consumable itself (adhesive, grout) replaces the one another calc of the room brings along, only when it covers that calc's surface whole; a calc without a surface (moved from the old planner) replaces nothing;
  - `totals` — `sum`, `byRoom`, `saved`, `savedPacks`, `missing`.
- **Surfaces** — tile, adhesive and grout gained «Пол и стены» (`floor-walls`, one tile for both; formula versions bumped with new goldens, P17.5); tile gained primer as a related item (P17.6).
- **Tests** — unit tests and fast-check properties in `project/estimate.test.ts`: merged bought ≥ need, merged packs ≤ the sum of separate packs.

UI side, storage and scenarios: [Rooms and Estimate](../ui/rooms-and-estimate.md).

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
| `rows` | Row layout: offset, trimming, last row, offcut reuse (pools capped at 8; a full pool gives up its shortest piece — laminate v2) | Laminate, vinyl, panels, lining |
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
| Wallpaper | `/steny/oboi/` | `strips`, `hang`, `cutting`, `packs` | Version 3: with every opening placed (or none) the start is chosen (level line, both directions to the least visible corner, inner/outer corner wraps, rests carried on, strips wholly across an opening or a bare zone become pieces) and rolls come from a cutting plan (`planCuts`: strips on the pattern, pieces and narrow strips from rests, each rest once); otherwise strips = ⌈(perimeter − Σ max(opening width − roll width, 0)) ÷ roll width⌉ — a strip that only partly covers an opening is still full height; each strip is height + 10 cm trim. `cutStrips` cuts them on the repeat (offset match: phases 0 and repeat/2 alternate; since v7 each phase may come from its own roll, as fitters cut a drop match from two rolls alternately, whichever needs fewer rolls — never more than straight + 1) after a worst-case lead of repeat − 1 mm once per roll (less than the fitters' per-strip «высота + раппорт»), and puts the pieces above doors and above/below windows (none under 5 cm) into roll tails first; need = rolls × roll length − largest tail; paste by net wall area ÷ m² per pack; warning when strips use the roll within the ±1,5% length tolerance |
| Paint | `/steny/kraska/` | `coverage`, `packs` | Area (walls without openings and/or ceiling) × coats ÷ coverage from the can; `purchaseSet` picks the 0,9 / 2,7 / 9 л set with the least overbuy, then the fewest cans, one purchase line per size with the same key; primer = area × rate in one canister size (a litre-based optimiser would buy 7 × 1 л instead of 10 л — needs prices) |
| Laminate | `/pol/laminat/` | `rows`, `waste`, `packs` | `layRows`: rows = ⌈(across − 2 × gap) ÷ board width⌉; each row starts with a start-side offcut (the right part left by a row-end cut — click locks forbid turning a piece) if the end joints stay ≥ 30 cm from the previous row and no end is shorter than 30 cm, else a whole board, else a board cut to shift the joints (its left part may only END a later row). The scheme is the beam-searched plan; since v3 boards bought = max(that plan, the same rules laid row by row without look-ahead, `greedyRows`: the first start offcut that can be trimmed from its sawn end to keep the 30 cm offset and a ≥ 30 cm row end, else a whole board, else a cut start — first one whose row end an offcut at hand closes), so a fitter without the scheme still has enough. Mockup 4,6 × 4,3, 1285 × 192 × 9 → 85 boards both ways, 10 packs (rows across: 80, 9); 2,08 × 4,436 → 39 / 5; 1,4 × 1 → scheme 7, row by row 8. Last row < 5 cm warns; diagonal/herringbone = area + 15 % (unconfirmed), herringbone warns it needs A/B boards; underlay in 1 m strips as long as the room, cut from rolls (never fewer than by area): mockup 3 rolls |
| Linoleum | `/pol/linoleum/` | `packs` | Every roll width (1,5 … 4 м, or one pinned) × both directions: sheets n with n·w − (n − 1)·overlap ≥ the room across, cut = n × (room along + allowance, default 5 cm, v4), rounded to the shop cut step; the allowance no longer widens the room across; a sheet that ends at a placed door's wall is cut 10 cm longer, and a door in an outer wall along the sheets makes them cover the room across + 10 cm per such wall (sheet 1 starts in the doorway when the door is on its side) — doorway, unconfirmed C10; every variant is laid with its doorways before the choice (4 × 3 m, door on the 4 m wall: 4 m roll × 3,2 m = 12,8 m², not 3 m × 4,1 m with a bare doorway). Fewest seams first (Tarkett: «избегайте швов, выбирая максимальную ширину»), then the smallest bought area (price is per m²), then along the length. Bought by area: `Pack.kind: "running"` with `width`, one cut step = width × step, so needs of different widths stay comparable; the shell shows «8,8 м · ширина 2,5 м · 22 м²». Implemented in v1 without the `strips` block (no pattern repeat input yet) |
| Plinth | `/pol/plintus/` | `geometry`, `packs` | v2: a cut plan (`planRuns`) — runs as one ribbon from the longest, offcuts carried on, no piece under 30 cm in a run (unconfirmed C10), one more plank when less than 30 cm is left; with every door placed the real runs, else each door splits the longest run; joiners = mid-run joints of the plan; inner corners 4 (5 + 1 outer for an L-shape) less those a placed door takes; `door_wider_than_wall` against the door's own wall; 2 caps per door; fasteners per straight run ⌈run ÷ 40 cm⌉ + 1 (doors split the longest run; Arbiton INDO manual) |
| Tile | `/plitka/plitka/` | `grid`, `packs` | `gridArea` from a corner or the centre (parity with the wider cut; a remainder ≤ joint is no cut); every cut piece takes a tile (Kerama Marazzi); walls one by one: with every opening placed on the plan, tile by tile around them (`wallGrid`: tiles wholly inside an opening dropped, tiles over its edge cut; windows on their sill, default 90 cm — version 3), else minus whole tiles surely inside openings, ⌊(size − tile) ÷ pitch⌋ (a door lines up with the rows from a corner); + 10 % reserve; diagonal = area ÷ tile × 1,15; boxes |
| Tile adhesive | `/plitka/klej/` | `coverage` | Floor (L-shape from the room) or walls without openings × kg/m² from the CM 11 PRO notch table by the longer side, or 1,2 kg/m² × layer mm; from 30 × 30 + 1 mm on the tile back (+1,2 kg/m², unconfirmed); bags |
| Grout | `/plitka/zatirka/` | `coverage` | kg/m² = (A + B) ÷ (A × B) × joint × depth (= tile thickness) × 1,6, + 10 %; the CE 40 table equals this formula at its own 12,5–14 mm depth (golden cross-checks); packs of 2 kg |

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

### Phase 6 check (P6.12, 2026-10-10)

| # | Verdict | Evidence from the 10 wave-1 tools |
|---|---|---|
| 1 | Keep relative 1e‑9 | Exact pack multiples in golden for paint (9 л), adhesive (50 кг), grout (2 кг), wallpaper (3 × 3,35 м = 10,05), linoleum (4,0 м), tile (70 шт.): none bought an extra pack. Inputs are integer mm, so float noise never reached a real boundary; the reviewer probed +ε (15,002 м → 7 планок) and it held |
| 2 | Keep; tools clamp | Phantom packs from near-zero geometry were found and handled in the tools, not in `ceilPacks`: a 3 mm gap above a door bought a whole roll (wallpaper now drops pieces under 5 cm); openings ≥ walls return no items (wallpaper, paint, adhesive, grout, tile); doors ≥ perimeter (plinth) |
| 3 | Done | 45 norms from 19 sources (S1–S19) in [Norm Sources — Wave 1](./norm-sources-wave-1.md); 7 working defaults flagged `unconfirmed`; catalog tests keep every calc default equal to its norm |
| 4 | Done | All 10 tools run golden and invariants; deep property runs (20–30 thousand inputs) found real defects the 300-run CI pass missed: wallpaper monotonicity with zero strips, fractional can sizes in `bestPackSet`, a zero linoleum sheet step, an oversized cut-out turning into a real L-shape. CI keeps 600 runs with a 30 s timeout |
| 5 | Mac ✅, CI step added | `pnpm calc:export` writes 128 rows on macOS; the CI job runs it on Linux and checks > 100 rows |
| 6 | Open (prices) | Least overbuy in litres stays for paint; primer one canister size (owner, 2026-10-10) |

New rules learnt in Phase 6: one line per pack size with the same item key (can sets) — golden and invariants compare sums per key; goods bought by the running metre are compared by area (`Pack.width`); a rule found by fast-check gets a golden example or a documented arbitrary constraint, never a weaker test.

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

A tool page loads only its own calculator: `@umnyaut/calc/modules/<id>` exports that tool's `module` (with its price mapping) alone, and the web shell's `ToolCalculator` maps each tool id to a `next/dynamic` import of it — server-rendered and preloaded as before, but one chunk per tool instead of all ten in the first-screen JS. `toolModules` (all of them) stays for the server, tests and the home page's lazy cards; the room list loads the modules it needs with `loadToolModule` (`apps/web/src/entities/tool/model/load.ts`).

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
- [Rooms and Estimate](../ui/rooms-and-estimate.md) — how the browser feeds `aggregateEstimate()` and shows its result
- [Engineering Practices](../practices/engineering-practices.md) — testing strategy
- Skill specs: [new-calculator](../skills/new-calculator.md), [calculator-release-check](../skills/calculator-release-check.md)
- Agent specs: [calc-engineer](../agents/calc-engineer.md), [formula-reviewer](../agents/formula-reviewer.md)

## File Structure

| Path | Description |
|---|---|
| `packages/calc/src/types.ts` | `ToolModule`, `ToolResult`, `PurchaseItem`, `Room`, `Layout`, `Quantity`, `Pack` |
| `packages/calc/src/blocks/{geometry,packs,waste,coverage,rows,grid,strips,frame,power}.ts` | Shared building blocks |
| `packages/calc/src/tools/<id>/index.ts` | One tool module |
| `packages/calc/src/modules/<id>.ts` | One tool's module with its price mapping, alone (`@umnyaut/calc/modules/<id>`: a page loads only its own) |
| `packages/calc/src/tools/<id>/golden.ts` | Golden examples for the tool |
| `packages/calc/src/project/schema.ts` | Project schema 2 = the estimate (`Estimate`, `EstimateRoom`, `EstimateCalc`, `EstimateTotals`, `Surface`), `ESTIMATE_LIMITS`, `migrateProject()` v1 → v2, `nextId()` |
| `packages/calc/src/project/merge.ts` | `productKey()`, `mergeItems()` by product key |
| `packages/calc/src/project/estimate.ts` | `aggregateEstimate()`, `surfaceParts()` |
| `packages/calc/src/golden.ts` | `GoldenFile` types, `matchExpectation()`, `validateGolden()` |
| `packages/calc/src/invariants.ts` | `resultViolations()`, `growthViolations()` |
| `packages/calc/test/golden.test.ts` | Runs all golden files, enforces ≥ 10 |
| `packages/calc/test/invariants.test.ts` | fast-check properties per tool; generators in `test/arbitraries.ts` |
| `packages/calc/test/harness.test.ts` | Self-test of the harness on a demo tool (`test/fixtures/demo-tool.ts`) |
| `packages/calc/scripts/export-golden.ts` | `pnpm calc:export [--csv] [--out file] [ids…]` — reviewer table |
