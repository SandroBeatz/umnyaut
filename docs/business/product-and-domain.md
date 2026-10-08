---
version: 1.0
date: 2026-10-08
category: business
---

# Product and Domain

> Version 1.0 · 2026-10-08 · [Business](../business/)

## Overview

UmnyAut answers one question for a person doing a renovation: **“how much do I buy and what will it cost?”** Working tagline: «Умные расчёты для ремонта: введите размеры — получите список покупок».

The niche is crowded (Kalk.pro, Perpendicular.pro, Zhitov calculators, Toolfox, Profi.ru, retailers, AI answers in SERP). Simple formulas are a commodity. UmnyAut wins on **accuracy and the “what to buy” answer**: layout-aware math, pattern repeat, openings, whole packages, related materials, one shared room across tools, and a saved link.

Markets from day one: **Russia, Kazakhstan, Belarus, Kyrgyzstan** — one Russian-language page set, country is configuration (currency, typical prices, shops). Promotion in Yandex and Google simultaneously. Brand: «Умняут» in Russian text, `UmnyAut` in domain/code.

## Rules

### Audience

| Segment | Situation | Needs | Role |
|---|---|---|---|
| DIY renovator | In a store or comparing prices, on a phone | Exact pack count, waste, related materials | Primary |
| Hired a crew | Got an estimate and doubts it | Independent check | Primary |
| Finishing master | Calculates for a client on site | Fast calc, send to client in a messenger | Second primary (master mode, stage 3) |
| Shop / renovation studio | Wants a calculator on its site | Embeddable widget | B2B, from month 6 |

### Product principles (non-negotiable)

1. Result in **purchase units** (packs, rolls, bags, cans). m² is an intermediate number.
2. Room dimensions are entered **once** and flow into every tool.
3. Every result expands into **“How it was calculated”** with the user's numbers substituted.
4. **No registration.** A calculation is saved by link.
5. **Phone is the primary screen** — people calculate in the store.
6. **Nothing covers the result**: no ads, no AI, no pop-ups above it.

### AI rule

**Code always computes the number.** AI only turns a photo or text into form parameters, the person confirms them, then the normal formula runs. AI is never used for: quantity calculation, room size from a photo, a chat consultant on every page, unreviewed page texts.

### Calculator standard (16 requirements)

A tool ships only when it meets requirements 1–14; 15 is required where layout affects the result (tile, laminate, wallpaper); 16 where the material has standard formats.

| # | Requirement | Meaning |
|---|---|---|
| 1 | Purchase units | Whole packages, how much will be bought, leftover |
| 2 | Waste by method | % depends on layout, repeat, room shape; user can override |
| 3 | Openings & shape | Windows, doors, niches; non-rectangular rooms |
| 4 | Related materials | “What else you'll need” with quantities |
| 5 | Cost | Pack price optional; total and price per m² |
| 6 | Warnings | Signal when input/result is out of reasonable bounds |
| 7 | “How calculated” | Formula with user's numbers |
| 8 | Norm source | Link to methodology + last checked date |
| 9 | Report an error | One button, no registration |
| 10 | Tests | 10 golden examples per tool |
| 11 | Instant result | Fields prefilled with typical values, live recalculation |
| 12 | Phone input | Numeric keyboard, large fields, m and cm |
| 13 | Room remembered | Dimensions carry to the next tool |
| 14 | Save & send | Link, messenger text, print |
| 15 | Scheme | Where layout affects the result |
| 16 | Presets | Typical material sizes and popular products |

Text under a tool: 300–600 words — how it's calculated, which waste to pick, a worked example, common mistakes, 5–8 FAQ from real queries, related tools. No filler articles.

### Catalog: first 30 tools in three waves

Complexity: **S** formula · **M** geometry + packages · **L** layout with scheme or framing system.

| Wave | Dates | Tools |
|---|---|---|
| 1 | Nov 2026 | Room area (M), Wall area (S), Wallpaper (M), Paint (M), Laminate (L), Linoleum (M), Plinth (S), Tile (L), Tile adhesive (S), Grout (S) |
| 2 | Dec 2026 – Jan 2027 | Plaster (M), Putty (S), Primer (S), Screed/self-leveling (M), Vinyl/parquet (S), Stretch ceiling (M), Lighting (M), Radiators (M), Drywall (L), Electricity usage (S) |
| 3 | Feb – Apr 2027 | Air conditioner (M), Underfloor heating (M), Cable cross-section (M), Drywall ceiling (M), Decorative plaster/liquid wallpaper (S), PVC panels/lining (M), Concrete (M), Lumber (S), Brick/blocks (M), Curtains (S) |

Composition is a hypothesis until research scoring (`Score = Demand × Value × Chance / Complexity`). Data-donor tools (room area, wall area) go to wave 1 regardless of score. Seasonal tools ship 2–3 months before peak. If time runs short, laminate/tile **schemes** slip to wave 2; pack counts ship immediately.

“Next step” chains carry dimensions forward: laminate → underlay → plinth; wallpaper → glue → primer; tile → adhesive → grout; plaster → putty → paint.

### Renovation planner

The core tool (moved from month 4 to month 2). Flow: Room → Works (checkboxes) → Materials (typical params, editable pack/price) → Shopping list (merged items, total, work order) → Actions (save link, messenger, print, open detail calc).

| Version | When | Scope |
|---|---|---|
| 1 | Stage 2 | One rectangular room, six wave‑1 works, project by link without account |
| 2 | Stage 3 | Multiple rooms, complex shape, rough finishing, PDF/CSV, input from plan photo |
| 3 | Stage 4 | Contractor estimate check, partner offers per list item |

Saved projects (`/p/a8H2k`) are not indexed, live 12 months after last open, contain no personal data. Planner KPI: share of projects reopened within 7 days, target ≥ 25%.

### Master mode (stage 3 light → stage 4 paid)

A light layer over the planner, not a full estimating app (that market is taken). Light (free, no account): work lines with own price per m²/m/pcs, quantities derived from room dimensions, master/client header, client link + PDF. Paid (if demand confirmed): price list, objects & clients, markup/discount/advance, own logo. Go/no-go at stage 3→4: ≥ 10% of projects have work lines **and** ≥ 3 masters ready to pay. 50k ₽/month ≈ 100–170 paying masters at 300–500 ₽.

### Telegram bot (stage 2)

A shell over the same calculations: mini app with tools and planner, “My calculations” by Telegram account, photo intake for labels/plans, forwarding estimates. Primary return channel for KZ/BY/KG, secondary for RU (Telegram restricted in Russia since Feb 2026). No ads in the bot. Messenger layer is abstracted to add a second messenger later.

### Monetization

Ads alone are small (≈ 130–240 ₽ per 1,000 visits in the niche). Layers: Yandex ad network (stage 3 test), affiliate “View material” button (Lemana PRO up to 6.5%), service leads, B2B widget, paid features (estimate check), sponsored presets (100k+ traffic). Ad rules: never above the result; ≤ 2 blocks per tool page on phone; no pop-ups/fullscreen; every new block checked against useful-calc rate.

### Goals and checkpoints

North-star metric: **useful calculations per week** (visits where ≥ 2 fields changed and the result was visible 5 s).

| When | Go condition | Otherwise |
|---|---|---|
| End of month 1 | All pages indexed in Yandex & Google; formulas covered by tests | Stop new tools, fix tech |
| Month 3 | Impressions grow 4 weeks in a row; ≥ 40% visits with a calc | Work on indexing/snippets |
| Month 6 | ≥ 3k visits/month | Narrow to 1–2 growing clusters |
| Month 12 | ≥ 15k visits/month + first revenue | Support mode, ≤ 2 h/week |

Budget: “working” level, 4–7k ₽/month (domain, hosting, formula review by a master per wave, AI ceiling, one lawyer consult).

## Data Model

Domain vocabulary (one concept — one word across the site):

| Use | Don't use |
|---|---|
| Расчёт (calculation) | Калькуляция, вычисление |
| Список покупок (shopping list) | Корзина, заказ, спецификация |
| Моя комната (my room) | Помещение, объект |
| Запас (waste allowance) | Коэффициент отходов |
| Мои расчёты (my calculations) | Профиль, личный кабинет |
| Смета (estimate) — master mode only | Смета for a normal shopping list |

Core entities: **Room** (shape, dimensions in mm, openings), **Tool** (registry entry + calc module), **PurchaseItem** (need, pack, packs, bought, leftover), **Project** (rooms × works, input only, results recomputed), **Country** (currency, locale, typical prices, shops). Type definitions: [Calculation Engine](../code/calc-engine.md).

## Usage

Reference example from the business spec (laminate, room 4.6 × 4.3 m, door 0.8 m) — the standard requires more than “area + 10%”:

- Warning: with 193 mm boards the last row is 5 cm → advise trimming the first row.
- Underlay: 2 rolls × 10 m².
- Plinth: perimeter 17.8 m − door → 17 m → 7 planks × 2.5 m + corners and caps.
- Row scheme with offsets and how many boards go to offcuts.
- Buttons: Save, Send to messenger, Calculate plinth (dimensions carried over).

The mockup (`docs/specs/UmnyAut — макеты ключевых экранов.html`) shows the expected result: **10 packs**, 22.2 m² bought, waste 2.4 m², underlay 2 rolls, plinth 7 planks, total 12,460 ₽ (630 ₽/m²), 23 rows: 60 whole, 23 cut, 18 reused offcuts.

## Cross-references

- [Architecture Overview](../architecture/overview.md) — how the product principles map to system design
- [Calculation Engine](../code/calc-engine.md) — implements requirements 1, 2, 4–7, 10, 15
- [Calculator Shell, Pages and Routing](../ui/calculator-shell-and-pages.md) — implements 3, 8, 9, 11–14, 16
- [SEO and Analytics](../business/seo-and-analytics.md) — page types, events, north-star metric
- [Design System](../design/design-system.md) — tone of voice and dictionary
- [Development Plan](../plan/development-plan.md) — stages and checkpoints as engineering tasks
- Source: `docs/specs/UmnyAut — бизнес-спецификация.md`
