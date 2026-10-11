---
version: 1.3
date: 2026-10-11
category: plan
---

# Wave 1 — Release Check

> Version 1.3 · 2026-10-11 · [Reviewer Handouts](./README.md)

## Overview

`calculator-release-check` against the 16-requirement standard (`.claude/skills/calculator-release-check/references/standard.md`). v1.1 ran on `feature/phase-6-wave-1` after the formula reviews; v1.2 (P8.8) re-ran it on `feature/phase-8-site-pages` with the content: no formula changed since v1.1, so requirements 1–16 keep their status and the content part of the definition of done is now checked too. Lighthouse runs in Phase 9.

## v1.3 — schemes moved to Phase 16, laminate pilot

Requirement 15 (scheme) moved from Phase 10 to [Phase 16](../plan/development-plan.md#phase-16--room-plan-layout-schemes-and-laying-guides-oct-2026--jan-2027) (owner, 2026-10-11), design in [Room Plan, Layout Schemes and Laying Guides](../ui/room-plan-and-layout-guides.md). Laminate (straight laying) now has `result.layout`: the plan with doors and windows, the scheme from the engine's own row plan, «Как укладывать» and the cut list per row. It is not READY on 15 yet: the guide texts wait for the master (P16.11), and laminate is formula **version 2** (a full offcut pool now gives up its shortest piece — narrow rooms bought too many boards) — it needs a `formula-reviewer` pass. Diagonal and herringbone have no scheme yet (P16.10). Wallpaper, linoleum and tile: no scheme (P16.5–P16.8).

## v1.2 — content (P8.8)

| Check | Result |
|---|---|
| Tests | calc 100, catalog 54, ui 59, web 56 — all pass; build OK |
| No-JS HTML of the 10 tool pages | exactly one `H1`, canonical, the result number in the server HTML (e.g. laminate «10», wall area «44,78»), 6 FAQ, no unreplaced `{{…}}` |
| Body length | 301–389 words for all 10 (target 300–600) |
| Frontmatter | title 49–58, description 119–159, question 27–38 characters — all within limits after norm substitution |
| Norms in text | rates, reserves, overlaps, densities, pack sizes via `{{norm.*}}`; the remaining digits are worked-example inputs (tile size, notch size, a 25 kg bag in a worked example) or source ranges («в источнике 10–15 мм») — not literals of a catalog norm |
| FAQ from real queries | each tool has two questions from `_СВОДКА_все_запросы.csv`; laminate `question` no longer uses the zero-demand form |

Verdicts after v1.2: the same as v1.1 below — all 10 READY, except requirement 15 (scheme) for wallpaper, laminate, linoleum and tile, moved to Phase 10 by the owner (now Phase 16, see v1.3).

| Tool | Verdict (v1.1) | Open |
|---|---|---|
| ploshchad-komnaty | READY | — |
| ploshchad-sten | READY | — |
| oboi | READY except 15 | scheme → Phase 16 (P16.8, formula v2) |
| kraska | READY | 16: cans are a fixed set, not presets (non-blocking) |
| plintus | READY | — |
| laminat | READY except 15 | scheme live for straight laying (v1.3); master review of the guide (P16.11), `formula-reviewer` pass on v2 |
| linoleum | READY except 15 | scheme → Phase 16 (P16.5); 16: widths are a dropdown (non-blocking) |
| plitka | READY except 15 | scheme → Phase 16 (P16.6) |
| klej | READY | — |
| zatirka | READY | — |

v1.0 of this check (the same day) found blockers 2, 3, 4, 5; they were fixed: pack prices for every purchase tool (`priced()`), L-shaped floors for laminate, linoleum and tile, tile adhesive and grout and linoleum cold welding as related items, editable laminate diagonal %. Requirement 15 moved to Phase 10 by the owner.

## Requirements

| # | Requirement | Status across purchase tools | Evidence |
|---|---|---|---|
| 1 | Purchase units | ✅ all | `purchase()` / `purchaseSet()`, integer packs, `bought`, `leftover`; invariants on 20–40 thousand inputs |
| 2 | Waste by method | ✅ all (v1.1) | tile reserve, grout reserve, linoleum allowance, wallpaper trim are fields; laminate diagonal/herringbone 15 % is fixed |
| 3 | Openings & shape | ✅ all (v1.1: L-shaped floors for laminate, linoleum, tile) | openings fields; L-shape from “My room” in plinth, adhesive, grout; floors of laminate, linoleum, tile are rectangles |
| 4 | Related materials | ✅ all (v1.1: tile adhesive and grout, linoleum cold welding) | tile → adhesive and grout are next steps, not items; linoleum seam welding is a note only |
| 5 | Cost | ✅ all (v1.1: `price_<item>` fields, total, per m², «без N позиций») | no `kind: "price"` field in any tool; `result.cost` never set (shell can show it) |
| 6 | Warnings | ✅ all | warning codes in calc, Russian text in catalog |
| 7 | How calculated | ✅ all | steps with the user's numbers |
| 8 | Norm source | ✅ all | 45+ norms with `source` + `checkedAt`; registry and norm-sources tests |
| 9 | Report an error | ✅ global | `ReportError` in HowCalculated (sending in Phase 7) |
| 10 | Tests | ✅ all | 10–19 golden examples per tool, each with a source |
| 11 | Instant result | ✅ all | `html:check`: digits in the server HTML of 15 pages; H1 and FAQ present without JS |
| 12 | Phone input | ✅ all | length fields with units and bounds; first screen ≤ 660 px in Playwright |
| 13 | Room remembered | ✅ all | room-bound fields; room list recomputes from “My room” |
| 14 | Save & send | ✅ global | `ResultActions`, `?s=`; «В список» for purchase tools |
| 15 | Scheme | → Phase 16 for wallpaper, tile, linoleum; laminate live, waits for review | laminate `result.layout` (straight); others none yet (P16.5–P16.8) |
| 16 | Presets | ✅ except paint, linoleum | paint cans and linoleum widths are fixed sets / a dropdown, not presets |

## Non-blocking

- ~~Content bodies are 130–290 words and use literal numbers instead of `{{norm.*}}`~~ — fixed in v1.2 (P8.5).
- Plinth description was 170 characters (limit 160) — fixed with this check.
- No Lighthouse report yet — Phase 9.

## Manual

Real-phone check, events in Metrika (Phase 9), master sign-off on the [handout](./wave-1-master.md), owner review of the 10 tool texts (C11).

## Cross-references

- [Development Plan](../plan/development-plan.md) — P6.1–P6.9
- [Calculation Engine](../code/calc-engine.md)
- [Norm Sources — Wave 1](../code/norm-sources-wave-1.md)
