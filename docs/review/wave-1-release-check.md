---
version: 1.1
date: 2026-10-10
category: plan
---

# Wave 1 — Release Check

> Version 1.1 · 2026-10-10 · [Reviewer Handouts](./README.md)

## Overview

`calculator-release-check` against the 16-requirement standard (`.claude/skills/calculator-release-check/references/standard.md`) on `feature/phase-6-wave-1` after the formula reviews. Content (body 300–600 words, `{{norm.*}}` substitutions) is completed in Phase 8 by plan and is listed, not blocking. Lighthouse runs in Phase 9.

| Tool | Verdict (v1.1) | Open |
|---|---|---|
| ploshchad-komnaty | READY | — |
| ploshchad-sten | READY | — |
| oboi | READY except 15 | scheme → Phase 10 (owner) |
| kraska | READY | 16: cans are a fixed set, not presets (non-blocking) |
| plintus | READY | — |
| laminat | READY except 15 | scheme → Phase 10 |
| linoleum | READY except 15 | scheme → Phase 10; 16: widths are a dropdown (non-blocking) |
| plitka | READY except 15 | scheme → Phase 10 |
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
| 15 | Scheme | → Phase 10 (owner) for wallpaper, laminate, tile, linoleum | no `result.layout` yet (plan P6.9, else Phase 10) |
| 16 | Presets | ✅ except paint, linoleum | paint cans and linoleum widths are fixed sets / a dropdown, not presets |

## Non-blocking

- Content bodies are 130–290 words (target 300–600) and use literal numbers instead of `{{norm.*}}` — Phase 8 (`tool-content`).
- Plinth description was 170 characters (limit 160) — fixed with this check.
- No Lighthouse report yet — Phase 9.

## Manual

Real-phone check, events in Metrika (Phase 9), master sign-off on the [handout](./wave-1-master.md).

## Cross-references

- [Development Plan](../plan/development-plan.md) — P6.1–P6.9
- [Calculation Engine](../code/calc-engine.md)
- [Norm Sources — Wave 1](../code/norm-sources-wave-1.md)
