---
version: 1.4
date: 2026-10-12
category: ui
---

# Room Plan, Layout Schemes and Laying Guides

> Version 1.4 · 2026-10-12 · [UI](../ui/)

## Overview

The owner's request (2026-10-10): every calculator with a layout gets a simple, readable **picture of the room** — which wall is which, where the door and the windows are, the floor shape (L-shaped too) — and on top of it a **layout scheme** that says how to do the job: where to start the wallpaper and how far to step off the corner, where the linoleum seam and cuts go, which laminate boards are cut and which offcut goes where, how the tile grid sits. The plan opens in a popup where the user adjusts it (door on this wall, window there); the calculator then turns the plan into a step-by-step laying guide.

This is the product's main moat in the business spec («реальные раскладки там, где они влияют на покупку», standard requirement 15 «Схема»), so it is not decoration: the scheme must be **the same plan the purchase number came from**, never a separate drawing that could disagree with it.

This doc is the feasibility analysis, the data model, the per-calculator plan and the phase ([Phase 16](../plan/development-plan.md#phase-16--room-plan-layout-schemes-and-laying-guides-oct-2026--jan-2027)). The pilot ships on **laminate**; the other tools follow in the order below.

## Analysis

### What exists

| Piece | State |
|---|---|
| `Layout` type in `packages/calc/src/types.ts` | Declared (`kind`, `pieces`, `stats`), returned by no tool |
| `ToolResult.layout` | Declared, always empty |
| `LayoutScheme` widget | Specified (design spec §11, tech spec §6), not built; `widgets/layout-scheme/` did not exist |
| Mockup | «Схема укладки» for laminate in `docs/specs/UmnyAut — макеты ключевых экранов.html` (tool screen): rows, whole boards outlined, cut boards hatched teal 45°, orange dot on an offcut reused in another row, dimension lines, legend with counts, «Нижний ряд — 5,6 см: слишком узкий» |
| `layRows` (laminate) | Already records a per-row plan (`RowsResult.plan`: start piece, its source, end piece, its source), checked by an independent rule checker (`test/rows-plan.test.ts`). **The scheme can be drawn straight from it** |
| `gridLine` / `gridArea` (tile) | Deterministic per axis: whole tiles + edge cuts from a corner or the centre — positions follow directly |
| Linoleum variants | Sheet count, width, direction, short sheets of an L-shape — positions follow directly |
| `cutStrips` (wallpaper) | Counts strips over the **whole perimeter**, not per wall; no placement |
| Room model (`Room`, `RoomDraft`) | Length, width, height, L-cut size, openings **without a wall or a position**, no cut-out corner |
| `RoomScheme` (home) | Isometric box, no openings |
| `ResponsiveSheet` | Bottom sheet on the phone, dialog from 1024 px — fits the plan editor |

### Gaps

1. **Openings have no position.** A door is «800 × 2000, 1 шт.» — no wall, no offset. Nothing about «on which wall the door is» can be drawn or used today. → extend `Opening` with optional placements.
2. **The L-shape has no corner.** `cut` gives its size only. → `cutCorner`.
3. **No wall naming.** The guide must say «стена 2»; the plan must label walls the same way. → numbering rule below.
4. **No geometry out of the engines.** → per-engine layout builders that turn the computed plan into pieces.
5. **Wallpaper is not per wall.** A real hanging plan (start from a plumb line, wrap ≤ 2–5 cm round a corner, pieces above the door) counts strips **per wall**; that can differ from the perimeter count. → a per-wall engine, a formula version bump, new golden examples and a reviewer pass. This is the largest and riskiest item.
6. **Laying advice is not sourced.** «Ряды вдоль света», «начинать от окна», «первая полоса по отвесу» are practice, not datasheet numbers. → every guide rule gets a source in the norms register or ships marked «ждёт проверки мастером», like other unconfirmed norms.

### Feasibility

| Tool | Scheme | Plan (walls, openings) needed | Engine work | Formula change | Effort |
|---|---|---|---|---|---|
| Laminate (straight) | Rows, cut list per row, offcut moves | Floor + door/window for the guide | Builder from `RowsResult.plan` + replay of pools | No | M — **pilot** |
| Laminate (diagonal, ёлочка) | Outline only + note | — | — | No | S |
| Linoleum | Sheets, seams, cut lines, allowance | Floor + window (seam along the light), door (no seam in the doorway) | Builder from the chosen variant | No | S |
| Tile, floor | Grid, cut edges, start point | Floor + door (whole tiles at the doorway) | Builder from `gridLine` per axis | No | M |
| Tile, walls | Grid per wall around openings | Walls + opening positions | Per-wall grid with openings | Maybe (exact cut tiles around placed openings) | L |
| Wallpaper | Strips per wall, start line, pieces above/below openings, roll cut map | Walls + opening positions | New per-wall strip engine on top of `cutStrips` | **Yes** (version 2) | L |
| Plinth | Runs per wall, door gaps, corners, cut list | Floor + door positions | Builder from runs | Maybe (doors split real runs) | S |
| Room area, wall area | Plan with dimensions and openings | Optional | `FloorPlan` only | No | S |
| Paint, adhesive, grout | No own scheme (link to the wall/tile scheme) | — | — | No | — |
| Wave 2: vinyl/parquet | As laminate (`rows`) | As laminate | Reuse | No | S |
| Wave 2: drywall, stretch ceiling, lighting | Frame grid / points | Ceiling plan | `frame`, `points` builders | — | M–L |

Verdict: **feasible** with the current stack (SVG, no canvas, no new libraries; tech spec §2 «Схемы раскладки — SVG-компоненты React, геометрию считает calc»). Laminate, linoleum, tile-floor and plinth need no formula change. Wallpaper needs a new engine and is planned last among wave 1.

## Rules

1. **One plan.** The scheme is built from the very plan `compute()` used for the purchase number, in the same call (`ToolResult.layout`). No second algorithm in the UI. If the per-wall picture would change the count (wallpaper), the formula changes, with a version bump.
2. **Code computes, AI never does.** Guide steps are codes + numbers (`{ code: "start", values: { wall: 1, gap: 10 } }`); Russian text lives in `catalog` (`ToolDef.guide`).
3. **Positions are optional.** Without placed openings the scheme still draws (outline, rows, cuts) and the guide gives the position-free steps; placing a door or a window adds steps («ряды вдоль света из окна»). Nothing blocks the number.
4. **Canonical frame.** Engines lay in one frame (start at the top wall, left corner; an L-cut in the far bottom-right corner). The builder mirrors the result to the user's actual cut corner and start wall. Mirroring a rectangle changes no count; for an L-shape the start side is forced to the full side, so the engine order (full rows first) stays valid.
5. **Wall numbering.** Plan coordinates: x along the room length (right), y along the width (down). Walls are numbered **clockwise from the top-left corner**, 1-based in the UI: rectangle — 1 top, 2 right, 3 bottom, 4 left; an L-shape has 6 walls along its outline. An opening's offset is measured clockwise along its wall from the wall's first corner to the opening's near edge.
6. **Nothing above the result.** The scheme sits under the result card and its actions (design spec §13). On desktop it is a full-width card after the form/result grid — picture 7/12, legend, steps and cut list 5/12 — because anything in the grid after the sticky result column slides under it; the plan editor is a popup. The phone first screen budget (660 px) is untouched.
7. **Design tokens and the design spec.** Whole piece — outline 1 px; cut piece — teal hatching 45°; reused offcut — orange dot (the one orange element in the card); legend with counts and a text summary for screen readers («Рядов: 23 · целых: 59 · подрезанных: 40»); tap opens fullscreen; above 2,000 pieces rows are drawn as bands.
8. **Sources.** Laying advice is listed in the [Norm Sources](../code/norm-sources-wave-1.md) register when it changes a number; pure advice («начните от дальней от двери стены») is a guide step text marked for the master's review (C10) before release check.

## Data Model

### Room and openings (`packages/calc/src/types.ts`)

```ts
interface OpeningPlace {
  wall: number;          // 0-based wall index along the outline (UI shows wall + 1)
  offsetMm: number;      // from the wall's first corner, clockwise, to the opening's near edge
  sillMm?: number;       // windows: floor to the opening's bottom (wall schemes); default WINDOW_SILL_MM
}

interface Opening {
  type: "door" | "window";
  widthMm: number;
  heightMm: number;
  count: number;
  places?: readonly OpeningPlace[];   // one per counted opening; missing = not placed
}

interface Room {
  // … as before
  cutCorner?: "ne" | "se" | "sw" | "nw";   // where the L-cut sits on the plan; default "se"
}
```

All seven per-tool opening schemas are replaced by one shared `openingInputSchema` (`blocks/plan.ts`), so `places` survive when the room moves from one tool to another (a per-tool `z.object` would strip them). The stored room (`umnyaut:room:v1`) accepts both fields as optional — old data stays valid, no store version bump.

### Plan geometry (`blocks/plan.ts`)

- `roomOutline(lengthMm, widthMm, cut?, corner?)` → polygon points clockwise from the top-left-most corner, and `walls` (start point, end point, length, side `top/right/bottom/left`).
- `cornerFlips(corner)` → the x/y flips that map the canonical frame (cut at `se`) onto the actual corner.
- `placeOpenings(walls, openings)` → placed openings with coordinates, pulled back onto their wall, and `off` (how many did not fit — the `opening_off_wall` warning).
- `openingInputSchema`, `openingPlacesSchema`, `cutCornerSchema` → the shared Zod schemas (tools, room store, `ProjectData`).

### Layout (extends the existing type)

```ts
interface LayoutPiece {
  x: number; y: number; w: number; h: number;   // mm, plan frame
  cut: boolean;
  reused?: boolean;
  row?: number;          // rows: 0-based row index in laying order
}

interface Layout {
  kind: "rows" | "grid" | "strips" | "points" | "outline";
  widthMm: number; heightMm: number;
  outline: readonly (readonly [number, number])[];   // room contour
  walls: readonly PlanWall[];         // clockwise, with the side each faces
  pieces: readonly LayoutPiece[];
  marks: readonly LayoutMark[];       // doors, windows, the start corner, seams
  rows?: readonly LayoutRow[];        // cut list: start/end pieces, their source rows, where rests go
  elevations?: readonly LayoutElevation[];  // wall tiling: each wall unfolded with its tiles and openings
  guide: readonly Step[];             // laying steps: code + numbers, text in catalog `ToolDef.guide`
  stats: { whole: number; cut: number; reused: number; wasteM2: number };
}
```

## Per-Calculator Plan

### Laminate — pilot

- **Scheme:** the rows from `RowsResult.plan`: per row the start piece, whole boards, the end piece; cut pieces hatched, reused offcuts with an orange dot; row numbers; expansion gap; the L-cut clipped from the outline; the start corner marked «Старт»; door and window drawn on the outline.
- **Cut list («Как резать»):** per row — «начать куском 64 см (обрезок ряда 3) · 3 целых · закончить куском 41 см (отрезать от новой доски, остаток 88 см → ряд 5)». The source row of each offcut is found by replaying the pools in the plan's order with the engine's own rules; the replay must give the engine's board count (test).
- **Guide steps:** start wall and corner (opposite the door when the door is on a wall parallel to the rows; the full side of an L-shape), first row tongue to the wall with spacers of the gap, rows along the light from the window (info when the chosen direction is across it — with the cheaper/other direction already reported by `other_direction_cheaper`), narrow last row → trim the first row (existing `narrow_last_row`), the last row width.
- **Not in the pilot:** drag-and-drop in the editor, diagonal and herringbone schemes, doorway transitions.

### Linoleum

Sheets of the chosen width and direction with seam lines; allowance strip at the walls («припуск 5 см на подрезку»); the L-shape's short sheets; guide: seams along the light and outside the doorway, sheet order, where to cut (by the wall after at least two days of rest at ≥ +15 °C — Tarkett), cold welding along the seams.

### Tile (floor, then walls)

Floor grid from `gridLine` per axis: whole tiles, edge cuts with their widths, start point (centre lines or the corner), joint; guide: start from the marked point, whole tiles at the doorway when the door is placed (moves the corner start to the door side), narrowest cut warning.

Walls (done 2026-10-12, tile version 3): `Layout.elevations` — every wall unfolded as seen from the room, x from the wall's first corner (on the left from inside), y down from the ceiling. `wallGrid` lays columns from that corner and rows from the floor (from the centre: equal cuts at both ends) with the very `gridCells` the count uses; a door stands on the floor, a window on its sill (`OpeningPlace.sillMm`, default `WINDOW_SILL_MM` = 900 mm; a window or a door that would pass the ceiling is held under it). A tile wholly inside an opening is not laid, one over its edge is cut. **Once every counted opening is placed, the purchase is the scheme's count** (never more than the estimate); with an unplaced opening the count stays the estimate and the walls are drawn empty with «place the doors and windows». The card shows the floor plan for orientation, then the walls to one scale; the cut list is per wall. Guide: start corner and floor (or the axes), ceiling row width, a batten under the second row, tiles at openings, the assumed sill.

### Wallpaper

Done 2026-10-12 (wallpaper version 2, reviewer pass open): `hangStrips` in `blocks/hang.ts`, `Layout.elevations[].strips` (per wall: strip numbers, level line, corner width and rest, pieces) and `Layout.rolls` (roll cut map from `cutStrips().cuts`). Start at the first corner of the widest placed window's wall, clockwise; corner wrap 15 mm (`wallpaper.cornerWrap`), the rest of a corner strip ≥ 5 cm goes on the next wall; strips wholly across an opening become pieces. Counted this way once every opening is placed (or none); else the perimeter count and empty walls.

Version 3 (2026-10-12): the start is chosen, not fixed. `hangStrips` takes a level line on any wall and a closing corner; strips go clockwise from the line to that corner and anticlockwise back to it, so the last joint lands in the least visible corner (the one by the door; never at the main wall). Every inner corner wraps `wrapMm` (field, default the norm), an outer corner 3 cm; a strip that ends right at a corner makes the next wall's first strip wrap back. Bare zones (user-set rectangles, and «nothing under the window») are left out: a strip wholly across a window or a zone becomes pieces for what is left; a zone floor to ceiling leaves its strips out. `chooseStart` tries every wall with lines across one roll width, at opening edges (a strip wholly on a window) and at the corner, two closing corners each; the cutting plan decides: no part under 5 cm, then the fewest rolls, then no inserts under 10 cm, then the joint out of sight, then the fewest strips. Manual start (wall + line) and a symmetric main wall (a strip or a joint in the middle) fix the line. `planCuts` (`blocks/cutting.ts`) turns strips and parts into a roll map: strips in order on the pattern, parts into rests (tails, side rests), guillotine splits, each rest once; `Layout.rolls` carries cuts, rests and waste per roll, `Layout.roll` the roll size, `Layout.start` the line and the corner.

Version 4 (2026-10-12, owner's real room): doors, windows and bare zones that touch across the wall (a pier up to 10 cm — a balcony door beside its window; the casings cover it) are one opening for the strips: a strip wholly across the block becomes pieces per part (above both, under the window only). A strip partly over an opening is hung whole and trimmed on the wall (manufacturers: overlap the opening, relief cut at the corner, trim to the frame — no joint at the corner of the opening, where cracks start); what is trimmed off, rough-cut 5 cm in from each edge, is a rest in the cutting plan — only for rolls 1 m wide and more (non-woven, pasted on the wall: the off-cut is dry) (`HangBlank.cutouts` → `planCuts` strips' `cutouts`, `fromCutout` cuts). Input `aroundOpenings`: `whole` (default) or `edge` — the strip is cut lengthwise at the opening edge, the part on the wall full height (each ≥ 10 cm, its own narrow strip, packed into rests without a pattern), the part over the opening pieces; with a pattern strips stay whole (`edge_pattern`). The edges of bare zones are cut in either mode and are not joints at openings. The start search ranks joints at openings right after rolls and narrow inserts; a piece narrower than 10 cm beside a wider one on the same side becomes one piece as tall as both. The other way is computed too, for the hint: `edge_saves` (cut at the edges would need fewer rolls), `edge_no_gain` (it would not); `edge_seams` warns about the joints. On the walls: joints at opening edges in red (`strips.edgesMm`), relief cuts as short slanting lines. Owner's room (openings read off the plan): 6 → 5 rolls either way.

Plan as written: per-wall unfolded view (walls 1…n side by side): strips with numbers, the first plumb line (roll width − 1–2 cm from the starting corner), pieces above the door and above/below the window, corner wraps; a roll cut map (which strips come from which roll, tails). Guide: start from the window corner (overlap paper) or any corner with a plumb line (butt-joint non-woven), direction of work, step-off from the corner, order of strips, pattern match per strip. Needs the per-wall engine and formula version 2 with new golden examples and a reviewer pass — the count may differ from today's perimeter count; that difference is the point of review.

### Plinth

Runs along the outline split by placed doors; corners inner/outer; cut list per run (plank lengths, joiners); guide: start from the longest run, cut angles at corners.

### Room area, wall area

`FloorPlan` with dimensions and placed openings, as a picture only (no guide). It is also the room card's picture once positions exist.

## Pilot status (2026-10-11)

Laminate, straight laying, works on `feature/layout-guides`: plan editor, scheme, guide and cut list; e2e «laminate scheme». On the mockup room (4,6 × 4,3 м, 1285 × 192): 23 rows, 99 pieces (59 whole, 40 cut incl. the 5,6 cm last row), 14 reused offcuts, 85 boards — the same as the purchase. Known limits: an L-shape always starts on its wide side (the engine lays the long rows first), so a door there gets no «towards the door» step; the guide texts are unreviewed practice (P16.11).

## Usage

```ts
// packages/calc/src/tools/laminat/index.ts — straight laying returns the layout with the purchase number
const result = laminat.compute(input, { country: "RU" });
result.layout?.rows;   // cut list per row
result.layout?.guide;  // [{ code: "start", values: { wall: 1, gap: 10 } }, …]
```

```tsx
// apps/web/src/widgets/calculator-shell/ui/CalculatorShell.tsx — under the result column
{layout ? (
  <LayoutScheme
    tool={tool}
    layout={layout}
    room={planRoomOf(values)}
    openings={values[planField.name]}
    onOpeningsChange={(next) => calc.setValues({ [planField.name]: next })}
  />
) : null}
```

The plan editor is a form field of kind `plan` (`catalog` → `FieldDef`), bound to the room's openings like the `openings` field, and a button on the scheme card; it opens in a `ResponsiveSheet`. Once it changes anything, every door and window becomes its own opening with `count: 1`, so a place never belongs to the wrong one of several equal openings (areas stay the same). The L-cut corner is a select field bound to the room (`room: "cutCorner"`).

## Cross-references

- [Calculator Shell, Pages and Routing](./calculator-shell-and-pages.md) — where `LayoutScheme` sits in the shell (block 15)
- [Calculation Engine](../code/calc-engine.md) — `Layout` type, `rows`, `grid`, `strips` engines
- [Design System](../design/design-system.md) — hatching, orange dot, tokens, fullscreen
- [Norm Sources — Wave 1](../code/norm-sources-wave-1.md) — sources for guide rules that change numbers
- [Wave 1 — Release Check](../review/wave-1-release-check.md) — requirement 15 waits for these schemes
- [Development Plan](../plan/development-plan.md) — Phase 16 tasks
- [Product and Domain](../business/product-and-domain.md) — requirement 15 «Схема»

## File Structure

| Path | What |
|---|---|
| `packages/calc/src/blocks/plan.ts` | Shared opening schema, outline and walls, mirroring, opening placement |
| `packages/calc/src/blocks/layout-rows.ts` | `traceRows` (cut list and offcut sources from a `RowsResult.plan`), `rowsLayout` (pieces on the plan) |
| `packages/calc/src/tools/laminat/index.ts` | Returns `layout` for straight laying |
| `packages/catalog/src/tools/laminat.ts` | `plan` field, guide texts |
| `apps/web/src/entities/room/ui/FloorPlan.tsx` | Top-down SVG of the room: outline, wall numbers, dimensions, doors, windows |
| `apps/web/src/features/edit-room-plan/` | Plan editor in a popup: L-cut corner, openings on walls |
| `apps/web/src/widgets/calculator-shell/ui/LayoutScheme.tsx` | `LayoutScheme`: scheme card, legend, guide, cut list, fullscreen (inside the shell widget: FSD forbids widget → widget imports) |
| `apps/web/src/widgets/calculator-shell/model/scheme-text.ts` | Guide and cut-list lines from codes and numbers |
| `apps/web/src/widgets/calculator-shell/model/plan.ts` | `planRoomOf(values)`: the room the plan draws, from a tool's input |
| `packages/calc/src/blocks/layout-grid.ts` | `gridCells`, `gridLayout` (tile floor), `wallGrid` (one unfolded wall around its openings) |
| `packages/calc/src/blocks/hang.ts` | `hangStrips`: wallpaper strips from a level line both ways to a closing corner, corners, rests, pieces, bare zones |
| `packages/calc/src/blocks/cutting.ts` | `planCuts`: the roll cutting plan — strips, parts into rests, guillotine splits, waste |
| `apps/web/src/widgets/calculator-shell/ui/RollMap.tsx` | One roll of the cutting map as a picture |
| `apps/web/src/widgets/calculator-shell/ui/WallElevations.tsx` | Wall tiling picture: floor plan for orientation, walls to one scale |
| `packages/calc/test/layout-rows.test.ts` | Outline, placement, replay = engine board count, pieces fill rows, laminate scheme cases |
