---
version: 1.2
date: 2026-10-09
category: code
---

# Norm Sources — Wave 1

> Version 1.2 · 2026-10-09 · [Code](../code/)

## Overview

Primary sources for the norms of the eight wave‑1 tools (content plan C01). **Every norm in `packages/catalog/src/norms.ts` must have a row here with the full source link and the date it was checked**; the `source` field of a `Norm` names the same document. Qalculator is never a source.

Status values: **confirmed** — accepted by the owner (2026-10-09); **default, unconfirmed** — used with a visible «проверьте по этикетке» hint until a better source exists.

## Design decisions

1. **Formula first, product second.** Where a manufacturer publishes a formula (grout) or a notch table (tile adhesive), the tool uses it; product numbers become presets the user can change.
2. **Label ranges → conservative editable default.** Paint, primer and wallpaper paste are sold with a range on the label. The tool uses the conservative default (owner decision: paint 10 m²/l) and offers the field «Расход по этикетке».
3. **ГЭСН (Minstroy estimate norms) are a cross-check, not a source.** They average waste over many jobs; our tools compute the layout.
4. **Standards give sizes and limits**, not consumption: ГОСТ 6810 (wallpaper roll), ГОСТ 7251 (linoleum roll), СП 71.13330 (adhesive layer within the manufacturer's limit).

## Sources

| # | Document | Publisher | Link | Checked |
|---|---|---|---|---|
| S1 | «Как рассчитать расход плиточного клея на 1 м²» | Ceresit (Henkel) | https://ceresit.ru/ru/blog/plitochnaya-oblicovka/raschet-kleya-dlya-plitki/ | 2026-10-09 |
| S2 | Ceresit CM 11 Plus, product page | Ceresit (Henkel) | https://www.ceresit.ru/ru/products/tiling/tile-adhesives/cm_11_plus.html | 2026-10-09 |
| S3 | «Как рассчитать расход затирки для плитки» | Ceresit (Henkel) | https://ceresit.ru/ru/blog/plitochnaya-oblicovka/raschet-zatirki-dlya-plitki/ | 2026-10-09 |
| S4 | Keracolor FF, technical data sheet (consumption table) | Mapei | https://cdnmedia.mapei.com/docs/librariesprovider52/products-documents/1_00131_keracolor-ff-sg-23022023_29291268390942ceb2a0fe6a6616403b.pdf?sfvrsn=bf8c64e1_0 | 2026-10-09 |
| S5 | ГОСТ 6810‑2002 «Обои. Технические условия» | Межгосударственный стандарт | https://docs.cntd.ru/document/1200032267 | 2026-10-09 |
| S6 | Метилан Флизелин Ультра Премиум, product page | Metylan (Henkel) | https://www.metylan.ru/ru/katalog/oboynyy-kley-metylan/metilan-flizelin-ultra-premium.html | 2026-10-09 (page renders by JS; numbers from the search snippet, not read directly) |
| S7 | PARADE Professional E2 PRO'LATEX2, product page | PARADE | https://parade.ru/catalog/professional/parade-professional-e2-pro-latex2/ | 2026-10-09 |
| S8 | Ceresit CT 17 PRO, product page | Ceresit (Henkel) | https://www.ceresit.ru/ru/products/tiling/supplementary-materials/ct_17_pro/ | 2026-10-09 |
| S9 | «Укладка ламината и уход» | Tarkett | https://www.tarkett.ru/hub/vidy-napolnykh-pokrytiy/ukladka-laminata-i-ukhod/ | 2026-10-09 |
| S10 | «Монтаж ламината Quick-Step» | Quick-Step (Unilin) | https://www.quick-step.ru/laminate/installation/ | 2026-10-09 |
| S11 | «Укладка линолеума и уход» | Tarkett | https://www.tarkett.ru/hub/vidy-napolnykh-pokrytiy/ukladka-linoleuma-i-ukhod/ | 2026-10-09 |
| S12 | ГОСТ 7251‑2016 «Линолеум поливинилхлоридный на тканой и нетканой подоснове» | Межгосударственный стандарт | https://docs.cntd.ru/document/1200141418 | 2026-10-09 |
| S13 | Плинтусы, каталог | Arbiton | https://arbiton.com/ru/plintus | 2026-10-09 |
| S14 | Напольные плинтусы, каталог | IDEAL | https://ideal.ru/product/plintusy/ | 2026-10-09 |
| S15 | СП 71.13330.2017 «Изоляционные и отделочные покрытия», п. 7.4.15 | Минстрой России | https://docs.cntd.ru/document/456082588 | 2026-10-09 |
| S16 | ГЭСН 11‑01‑034‑04 (ламинат), ГЭСН 11‑01‑027‑02 (плитка) — cross-check only | Минстрой России | https://fsnb2022.ru/gesn/gesn11-01-034-04.html · https://fsnb2022.ru/gesn/gesn11-01-027-02.html | 2026-10-09 |
| S17 | Инструкция по поклейке обоев (ARTSIMPLE) | SURGAZ (ООО «Фортпост»), manufacturer | https://artsimple.ru/instruction | 2026-10-09 |

## Norms

| Norm id | Value used | Source | Status | Notes |
|---|---|---|---|---|
| `tileAdhesive.notch4`, `tileAdhesive.notch6`, `tileAdhesive.notch8`, `tileAdhesive.notch10` | 2,0 / 2,7 / 3,2 / 4,2 kg/m² for notch 4 / 6 / 8 / 10 mm | S1 | confirmed | Tile side 10 / 15 / 20 / 30 cm in the same table; S1 also gives V = S × Vст × h |
| `tileAdhesive.perMm` | 1,2 kg/m² per 1 mm of layer | S2 | confirmed | For a user-entered layer thickness |
| `tileAdhesive.bag` | 25 kg | S2 | confirmed | Preset; 5 kg second preset |
| `grout.density` | 1,6 | S3 | confirmed (owner: 1,6) | Mapei S4 implies ~1,5; we keep the larger value. S4 rows are golden cross-checks with that difference explained |
| `grout.reserve` | 10% | S3 (10–15%) | confirmed | Lower bound of the range |
| `wallpaper.rollWidth`, `wallpaper.rollLength` | 0,53 m / 10,05 m | S5 | confirmed | 1,06 × 10,05 and 1,06 × 25 m as market presets |
| `wallpaper.trimAllowance` | 10 cm per strip | S17 (4–5 cm top and 4–5 cm bottom) | confirmed | Upper bound of the range; editable field «Припуск на подрезку» |
| `wallpaperPaste.coverage` | 30 m² per 250 g (non-woven) | S6 | **default, unconfirmed** | Owner can't check a pack yet; shown with «проверьте по пачке», field editable |
| `paint.coverage` | 10 m²/l per coat | S7 (12–14 m²/l) | confirmed (owner: conservative) | Below the datasheet on purpose: rough walls and colour changes |
| `paint.coats` | 2 | S7 | confirmed | |
| `paint.cans` (preset, not a norm) | 0,9 / 2,7 / 9 l | S7 | confirmed | Can-set optimiser `bestPackSet`; lives in the tool's presets |
| `primer.consumption` | 0,15 l/m², 1 coat | S8 (0,1–0,2) | confirmed | Middle of the range |
| `laminate.minOffset` | 300 mm | S9, S10 | confirmed | `rows` engine, offcut reuse |
| `laminate.minLastRow` | 50 mm | S10 | confirmed | Warning «последний ряд выйдет N см» |
| `laminate.expansionGap` | 10 mm (10–15) | S9 | confirmed | Per wall |
| `laminate.waste.diagonal` | 15% | — | **default, unconfirmed** (owner: keep with a note) | Labelled «по опыту укладчиков»; to be confirmed by the master (A26) |
| `laminate.waste.herringbone` | 15% | — | **default, unconfirmed** | Same note |
| `linoleum.seamOverlap` | 50 mm (3–5 cm) | S11 | confirmed | Pattern matching per seam |
| `linoleum.wallTrim` | 10 mm (0,5–1 cm) | S11 | confirmed | |
| `linoleum.rollWidthMin`, `linoleum.rollWidthMax` | 1,2 / 2,4 m (table 1 allows up to 3 m) | S12 | confirmed | Market presets 1,5 … 4 m (C03) |
| `plinth.length` | 2,5 m (2,2 m preset) | S13, S14 | confirmed | |
| `tile.joint.wall`, `tile.joint.floor` | 2 mm / 3 mm | S3 (1,5–2 wall 15 × 15; 2–3 floor 33 × 33) | confirmed | Upper bound of each range |
| Adhesive layer limit | ≤ manufacturer's value | S15 | confirmed | Warning when notch × format leaves the S1 table |

## Decisions log

| Date | Question | Owner decision |
|---|---|---|
| 2026-10-09 | Paint default coverage | Conservative 10 m²/l |
| 2026-10-09 | Grout density | 1,6 (Ceresit) |
| 2026-10-09 | Wallpaper paste from a real pack | Not available yet → default, unconfirmed |
| 2026-10-09 | Laminate diagonal / herringbone waste | 15% with the note «по опыту укладчиков» until the master confirms |

## Cross-references

- [Calculation Engine](./calc-engine.md) — `Norm`, golden sources, decisions to verify
- [Content Plan](../plan/content-plan.md) — C01, C03, C04
- [Competitive Benchmark](../business/competitive-benchmark.md) — why Qalculator is not a source
