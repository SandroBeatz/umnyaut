---
version: 1.0
date: 2026-10-09
category: code
---

# Norm Sources — Wave 1

> Version 1.0 · 2026-10-09 · [Code](../code/)

## Overview

Proposed primary sources for the norms of the eight wave‑1 tools (content plan C01). Nothing here enters `packages/catalog/src/norms.ts` until the owner confirms it; each confirmed row becomes a `Norm` with `source` and `checkedAt`. Qalculator is never a source.

Status of every row: **proposed** — collected 2026-10-09, awaiting owner confirmation.

## Design decisions

1. **Formula first, product second.** Where a manufacturer publishes a formula (grout) or a notch table (tile adhesive), the tool uses it; product-specific numbers become presets the user can change.
2. **Manufacturer ranges → editable default.** Paint, primer and wallpaper paste are sold with a range on the label. The tool shows the default and the field «Расход по этикетке», so the user can type the number from their can.
3. **ГЭСН (Minstroy estimate norms) are a sanity check, not a source.** They average waste over many jobs (e.g. 102,5 m² laminate per 100 m²), while our tools compute the layout. Used to cross-check golden examples only.
4. **Standards give sizes and limits**, not consumption: ГОСТ 6810 (wallpaper roll), ГОСТ 7251 (linoleum roll), СП 71.13330 (adhesive layer within the manufacturer's limit).

## Proposed norms

| Tool | Norm id | Value | Source | Notes |
|---|---|---|---|---|
| Tile adhesive | `tileAdhesive.byNotch` | notch 4 → 2,0; 6 → 2,7; 8 → 3,2; 10 → 4,2 kg/m² (tile side 10/15/20/30 cm) | Ceresit, «Как рассчитать расход плиточного клея» — ceresit.ru/ru/blog/plitochnaya-oblicovka/raschet-kleya-dlya-plitki/ | Same page: V = S × Vст × h (kg/m² per 1 mm × layer mm); CM 11 Plus ≈ 1,2 kg/m² per 1 mm |
| Tile adhesive | `tileAdhesive.bag` | 25 kg | Ceresit CM 11 Plus product page | Preset; 5 kg as second preset |
| Grout | `grout.formula` | (A + B) / (A × B) × joint width × joint depth × 1,6 kg/m² | Ceresit, «Как рассчитать расход затирки» — ceresit.ru/ru/blog/plitochnaya-oblicovka/raschet-zatirki-dlya-plitki/ | Same page: add 10–15% reserve |
| Grout | `grout.density.cement` | 1,6 (Ceresit); 1,5 implied by Mapei Keracolor FF table | Mapei Keracolor FF TDS, consumption table (e.g. 300 × 300 × 10, joint 3 → 0,3 kg/m²) — cdnmedia.mapei.com | Mapei rows become golden examples; the 1,5 vs 1,6 gap is within the table's rounding |
| Grout | `grout.reserve` | 10% | Ceresit (10–15%) | Lower bound; user can raise |
| Wallpaper | `wallpaper.roll` | 0,53 × 10,05 m; 1,06 × 10,05 m | ГОСТ 6810‑2002 «Обои. Технические условия» (preferred width 530 mm, length ≥ 10,05 m) | 1,06 × 25 m as a preset (common, not in the standard) |
| Wallpaper paste | `wallpaperPaste.coverage` | ≈ 30 m² per 250 g pack (non-woven), 40–48 m² (paper) | Metylan product pages (metylan.ru) + pack tables | **Weak:** the site renders by JS, numbers taken from search snippets and retailers; owner to confirm from a pack |
| Paint | `paint.coverage` | 12–14 m²/l per coat; 2 coats | PARADE Professional E2 PRO'LATEX2 — parade.ru | Default 10 m²/l (conservative between Parade 12–14 and Tikkurila 7–12) — owner decision |
| Paint | `paint.cans` | 0,9 / 2,7 / 9 l | PARADE E2 (same page) | Can-set optimiser `bestPackSet` |
| Primer | `primer.consumption` | 0,1–0,2 l/m², 1 coat | Ceresit CT 17 PRO — ceresit.ru | Default 0,15 l/m² |
| Laminate | `laminate.minOffset` | 300 mm between end joints | Tarkett «Укладка ламината» (tarkett.ru/hub) and Quick-Step installation guide | Drives the `rows` engine and offcut reuse |
| Laminate | `laminate.minLastRow` | 50 mm | Quick-Step installation guide (quick-step.ru/laminate/installation/) | Warning «последний ряд выйдет N см» |
| Laminate | `laminate.expansionGap` | 10–15 mm | Tarkett | Reduces laid width per wall |
| Laminate | `laminate.waste.diagonal` | 15% | — **no primary source found yet** | Content plan C04 says ~15%; needs a manufacturer guide or the master |
| Linoleum | `linoleum.trim` | 3–5 cm overlap per seam; 0,5–1 cm off the wall | Tarkett «Укладка линолеума» (tarkett.ru/hub) | Allowance per side for the `strips` engine |
| Linoleum | `linoleum.rollWidth` | 1,2–2,4 m (standard range), up to 3 m | ГОСТ 7251‑2016 | Presets 1,5 / 2 / 2,5 / 3 / 3,5 / 4 m from the market (C03) |
| Plinth | `plinth.length` | 2,5 m (also 2,2 m) | Arbiton (arbiton.com/ru/plintus), IDEAL (ideal.ru) catalogues | Corners, caps, joiners counted by geometry |
| Tile | `tile.joint` | 1,5–2 mm wall 15 × 15, 2–3 mm floor 33 × 33 | Ceresit grout guide (same page as grout) | Default joint by format |
| Cross-check | ГЭСН 11‑01‑034‑04 (laminate 102,5 m² / 100 m²), ГЭСН 11‑01‑027‑02 (tile 102 m² / 100 m²) | — | ГЭСН‑2020, Minstroy | Sanity check only (decision 3) |
| Limit | Adhesive layer thickness | ≤ manufacturer's value | СП 71.13330.2017, 7.4.15 | Warning when notch × format is outside the manufacturer table |

## Open questions for the owner

1. Paint default coverage: 10 m²/l (conservative) or the datasheet's 12 m²/l?
2. Grout density: Ceresit's 1,6 (more grout, safer) or Mapei's ~1,5?
3. Wallpaper paste: confirm the coverage from a real pack (Metylan / Quelyd / KLEO).
4. Laminate diagonal / herringbone waste: we have no primary source — keep 15% marked «по опыту укладчиков» or wait for the master (A26)?

## Cross-references

- [Calculation Engine](./calc-engine.md) — `Norm`, golden sources, decisions to verify
- [Content Plan](../plan/content-plan.md) — C01, C03, C04
- [Competitive Benchmark](../business/competitive-benchmark.md) — why Qalculator is not a source
