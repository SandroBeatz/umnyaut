---
version: 1.1
date: 2026-10-09
category: plan
---

# Content and Assets Plan

> Version 1.1 · 2026-10-09 · [Plan](../plan/)

## Overview

Everything that fills the site besides code: texts, data (norms, presets, prices), and visual assets. Each item has an ID (`C…` for content/data, `G…` for graphics), the phase it belongs to, a deadline, and who produces it (owner, agent, or external). The [Development Plan](./development-plan.md) references these IDs.

Rules from the specs that apply to all content:
- Russian, «вы», store language, dictionary from [Design System](../design/design-system.md). No exclamation marks, no «актуальные цены».
- Every norm number lives in `packages/catalog` with `source` + `checkedAt`; texts reference it via `{{norm.*}}`.
- No blog, news, reviews, ratings, per-size pages.
- Tool text 300–600 words + 5–8 FAQ from real queries.
- Qalculator is the mandatory benchmark for overlapping tools, but never a norm or golden-answer source without an independent derivation.

## Rules

### C — Data (lives in `packages/catalog`)

| ID | Item | Phase | Due | Producer | Notes |
|---|---|---|---|---|---|
| C01 | Norm sources for wave 1 (≥ 2 per tool) | 0 | 21 Oct | Owner + `formula-reviewer` | Primary datasheets, standards and laying guides; Qalculator may expose an edge case but is not a norm source; fills `[ИСТОЧНИК НОРМЫ]` placeholders |
| C02 | Golden example drafts for wave 1 (10 per tool) | 0→6 | per tool | `calc-engineer` | From C01 + manual calcs; ≥ 3 shared Qalculator scenarios with every difference explained |
| C03 | Presets wave 1 | 6 | with tool | `calc-engineer` | Laminate boards (e.g. 1285 × 192 × 9 шт, 1380 × 193 × 8, 1292 × 194 × 8), wallpaper rolls (0,53 × 10; 1,06 × 10; 1,06 × 25), paint cans (0,9 / 2,5 / 5 / 9 л), primer canisters, tile formats (20 × 20 … 60 × 120), adhesive/grout bag sizes, plinth lengths (2,0 / 2,2 / 2,5 м), linoleum widths (1,5 … 5 м), underlay rolls |
| C04 | Waste rules by method and room shape | 4 | 1 Nov | `calc-engineer` | Straight 5–10%, diagonal ~15%, herringbone, tile from centre/corner |
| C05 | Warning texts and step texts (RU) per tool | 6 | with tool | `calc-engineer` | Reason + way out («Последний ряд выйдет 5 см. Подрежьте первый ряд») |
| C06 | Next-step chains | 6 | 27 Nov | `calc-engineer` | laminate → underlay → plinth; wallpaper → glue → primer; tile → adhesive → grout |
| C07 | Country configs RU/KZ/BY/KG | 7 | 15 Nov | Owner | Currency, locale, typical prices per price key with check date, (wave 2: electricity tariffs, climate regions); `shops: []` until stage 3 |
| C08 | Wave 2 norms & presets | 10 | Dec–Jan | Owner + agents | Plaster/putty/primer consumption, screed mixes, lux norms by room type (СП), radiator/AC power coefficients, drywall profiles; electricity tariffs per country |
| C09 | Wave 3 norms & presets | 14 | Feb–Apr | Owner + agents | ПУЭ cable tables (with disclaimer), concrete grades, lumber sections, brick/block sizes, curtain gathering coefficients |
| C10 | Reviewer export tables per wave | 9 / 13 / 14 | end of wave | `pnpm calc:export` → master (A26) | Corrections become new golden examples |

### C — Texts (live in `apps/web/content`)

| ID | Item | Phase | Due | Producer |
|---|---|---|---|---|
| C11 | Tool texts wave 1 (10 × 300–600 words + FAQ + frontmatter) | 8 | 27 Nov | `seo-content-writer` + owner review |
| C12 | Category texts (osnova, pol, steny, plitka): one-line description, work order, short text + FAQ | 8 | 20 Nov | `seo-content-writer` |
| C13 | Home copy: label; H1 «Одна комната — весь список покупок»; subline «Введите размеры один раз — получите проверенный список покупок для всего ремонта»; proof points «Проверенные формулы», «Размеры не нужно повторять», «Один список по всем работам»; “How we calculate” | 8 | 20 Nov | Owner |
| C14 | «Методика» — sources per norm, how we round, checked dates, note that photos show material types not products | 8 | 25 Nov | Owner + agent |
| C15 | «О проекте» — author, why, contact (trust signal) | 8 | 25 Nov | Owner |
| C16 | «Политика конфиденциальности» — exactly the data table from tech spec §16; cookie section (strict mode) | 8 | 25 Nov | Owner (lawyer review later, A32) |
| C17 | «Контакты» (`hello@umnyaut.com`), «Партнёрам» (widget teaser, cooperation) | 8 | 25 Nov | Owner |
| C18 | System copy: 404, offline bar, save failed, project not found, empty “My calculations”, cookie banner, report-error sheet | 5–8 | with component | Owner (from design spec §15–16) |
| C19 | Mascot lines (≤ 60 chars) | 5 | 8 Nov | Owner (first set in design spec §16) |
| C20 | Tool texts wave 2 (10) | 10 | Jan | `seo-content-writer` |
| C21 | Planner copy (steps, buttons, empty states), saved project titles | 11 | Jan | Owner |
| C22 | Bot texts: `/start`, `/my`, `/forget`, descriptions for BotFather | 12 | Jan | Owner |
| C23 | Tool texts wave 3 (10) + category texts for potolok, elektrika, klimat, strojmaterialy, interer | 14 | Apr | `seo-content-writer` |
| C24 | Variations (only by the 3-condition rule) | 14–15 | monthly | `seo-content-writer` |
| C25 | Reference pages (`/spravochnik/…`): consumption tables, package sizes | 15 | May–Sep | `seo-content-writer` |
| C26 | External publications (1–2/month), outreach letters to curated lists | 10+ | from Dec | Owner |

### G — Graphics (sources in repo, built by `sharp` at build time)

| ID | Item | Count | Phase | Due | Notes |
|---|---|---|---|---|---|
| G01 | Mascot character sheet | 1 | 3 | 28 Oct | **Exists**: `docs/details/Orange Tabby Mascot Turnaround Sheet.png` — confirm as canonical |
| G02 | Mascot poses stage 1: `hello`, `done`, `warn`, `oops`, `head` | 5 | 3 | 8 Nov | Candidates exist in `docs/details/` (1254 px). Remove background → transparent PNG; check 2× hero (800 px); export AVIF/WebP; head ≤ 4 KB, 56–96 px ≤ 10 KB, hero ≤ 60 KB |
| G03 | Category icons (Lucide style, 24 grid, 2 px): osnova, pol, steny, plitka | 4 | 3 | 8 Nov | SVG in `packages/ui/assets/icons/` |
| G04 | Trial material photos: laminate pack, wallpaper roll, adhesive bag | 3 | 3 | 1 Nov | Approve style + real weights (128 px ≈ 3–5 KB) |
| G05 | Material photos wave 1 | 12 | 6–8 | 27 Nov | Wallpaper roll, wallpaper glue, paint can, primer canister, laminate pack, underlay roll, plinth plank, plinth fittings, linoleum roll, tile stack, tile adhesive bag, grout pack. No brands/letters, ¾ view, 1024² PNG. Tool ships without photo if late (icon fallback) |
| G06 | Category photos (3:2) + brush-stroke SVG mask | 4 + 1 | 8 | 20 Nov | Material in work: roller on wall, boards on floor, trowel |
| G07 | Home hero background (desktop ≥ 1024 only, ≤ 70 KB) | 1 | 8 | 20 Nov | Optional; mint background otherwise |
| G08 | App icons: `apple-touch-icon` 180, manifest 192/512 maskable | 3 | 9 | 30 Nov | From `icon.svg` / `icon-white.svg` |
| G09 | OG image 1200 × 630 (mint bg, logo, cat, positioning line) | 1 | 9 | 30 Nov | — |
| G10 | Bot avatar 640 × 640 (head on mint circle) | 1 | 12 | Jan | — |
| G11 | Mascot stage 2: `measure`, `point`, `empty` | 3 | 10–12 | Jan | Candidates exist |
| G12 | Material photos wave 2 + 3 category photos/icons | ~14 + 3 | 10 | Jan | — |
| G13 | Mascot stage 3: `think`, `camera`, `master` | 3 | 14 | Apr | Candidates exist |
| G14 | Material photos wave 3 + 2 category photos/icons | ~17 + 2 | 14 | Apr | — |
| G15 | Mascot clips (`*.mp4` in `docs/details/`) | 5 | — | — | **Not used at launch** (spec: no character animation). Decide later for bot/stage 2 |

Brand files to copy in Phase 3: `logo.svg`, `logo-white.svg`, `icon.svg`, `icon-white.svg`, `favicon.svg`, `favicon-dark.svg` → `packages/ui/assets/brand/`.

## Data Model

Content frontmatter schema (validated by Zod at build): `title ≤ 65`, `description ≤ 160`, `h1 ≤ 40`, `question ≤ 42`, `updatedAt`, `checkedAt`, `example`, `faq[] (≥ 3; target 5–8)`. Variations additionally require their own `example` and ≥ 3 FAQ.

## Usage

Producing a wave-1 tool's content: C01 sources → C02 golden → tool code (phase 6) → C05/C06 texts in catalog → G05 photo (optional) → C11 text via `tool-content` skill → `calculator-release-check`.

The tool page must explain any material result difference from Qalculator when it comes from a deliberate method choice (for example, actual rows/offcuts instead of a fixed percentage). Do not name the competitor in ordinary user copy unless a comparison page has its own confirmed demand; keep the evidence in the benchmark record and methodology.

## Cross-references

- [Development Plan](./development-plan.md)
- [Design System](../design/design-system.md) — asset specs, tone
- [SEO and Analytics](../business/seo-and-analytics.md) — content rules
- [Competitive Benchmark](../business/competitive-benchmark.md) — comparison cases and evidence rules
- Source: design spec §9–10, §16, §18; business spec §7–8, §11
