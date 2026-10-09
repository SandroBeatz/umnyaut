---
version: 1.1
date: 2026-10-09
category: design
---

# Design System

> Version 1.1 · 2026-10-09 · [Design](../design/)

## Overview

Light interface with soft cards, **teal actions**, a single **orange accent** per screen, a ginger tabby mascot, and brand-free material photos. Visual language comes from two concepts (`docs/details/umnyaut-reference.png`, `umnyaut-desctop-reference.png`); structure and behaviour come from the business and technical specs — where they conflict, the specs win.

Key decisions:

1. Three colours with hard roles: navy `#0F1E34` text, teal `#157779` actions/selection, orange `#F87C08` one accent per screen.
2. **Text on orange is navy, not white** (white on `#F87C08` = 2.67 contrast).
3. One font — **Onest**, one variable file (~55 KB).
4. Mascot appears in key places but never takes first-screen height on a tool page (56–64 px inside the result header).
5. One photo per shopping-list item; missing photo → category icon (a tool never waits for an image).
6. No “Calculate” button and no separate result screen.
7. Sticky result bar on phone.
8. No bottom tab bar on the site — only in the Telegram mini app.

> Source: `docs/specs/UmnyAut — дизайн-спецификация.md`; mockups: `docs/specs/UmnyAut — макеты ключевых экранов.html`.

## Design decisions

### Principles (lower number wins)

1. The purchase number is the largest thing on screen (“10 пачек” > page title).
2. Phone first screen = fields + result. Mascot, photos, ads, banners get no space if they push the number below 660 px.
3. One orange element in view.
4. Finger in a store: tap ≥ 48 px, input value 18 px, text contrast ≥ 4.5.
5. The mascot explains, never decorates.
6. Photos show the material, not a product (no brands, prices, discounts).

### Colour tokens (Tailwind 4 `@theme` in `packages/ui`; dark via `data-theme="dark"` on `html`)

| Token | Light | Dark | Use |
|---|---|---|---|
| `--color-bg` | `#FFFFFF` | `#0B1626` | Page |
| `--color-surface` | `#FFFFFF` | `#14253D` | Cards, fields |
| `--color-surface-sunken` | `#F4F6F8` | `#0F1E34` | Neutral section backgrounds, ad slot |
| `--color-surface-mint` | `#EDF9F8` | `#12303A` | Mint backgrounds, RoomBar, behind mascot |
| `--color-border` | `#E2E7ED` | `#2A3F5C` | Card borders |
| `--color-border-input` | `#8693A6` | `#6F7F97` | Input border |
| `--color-text` | `#0F1E34` | `#EEF2F6` | Text |
| `--color-text-muted` | `#55627A` | `#A9B5C7` | Secondary |
| `--color-text-subtle` | `#6B778C` | `#8D9BB0` | Placeholders, units (on surface only) |
| `--color-primary` | `#157779` | `#45C4B8` | Buttons, links, selected |
| `--color-primary-hover` | `#0F6466` | `#6AD3C8` | Hover/press; text on mint |
| `--color-on-primary` | `#FFFFFF` | `#06222A` | Text on teal |
| `--color-primary-soft` | `#D5F0EC` | `#1B4A4F` | Selected chip, icon circle |
| `--color-accent` | `#F87C08` | `#FF9433` | Orange button |
| `--color-accent-hover` | `#E06F05` | `#FFA552` | |
| `--color-on-accent` | `#0F1E34` | `#0F1E34` | Text on orange |
| `--color-accent-soft` | `#FFF3E5` | `#3A2A16` | Warning background |
| `--color-accent-text` | `#B45305` | `#FF9433` | Orange text/icon |
| `--color-danger` / `-soft` | `#C62828` / `#FDECEC` | `#FF8A80` / `#3B1C22` | Errors |
| `--color-focus` | `#157779` | `#45C4B8` | Focus ring 2 px + 2 px offset |
| `--color-brand-navy` | `#0F1E34` | `#0F1E34` (fixed) | Background for the white logo; never flips with the theme |

In the dark theme the default logo turns its word light by itself (`text-text`). Use `tone="white"` only on `brand-navy`, never on a token that flips.

No separate green for success — “Сохранено” is teal. Forbidden by contrast: white on orange; orange 500 as text on white (use 700); teal 600 text on mint 100 (use 700).

Only three orange buttons exist: “Рассчитать ремонт” (home), “Показать список покупок” (planner), “Посмотреть материал” (stage 3). Tool pages have **no** orange button before stage 3.

Dark theme: tokens ready; site launches light. Telegram mini app gets dark first (stage 2). In dark, mascot and photos always sit on `--color-surface-mint`.

### Typography — Onest variable

One `onest-var.woff2` subset (basic Latin, Cyrillic, `₽ ₸ × ² ³ ≈ → − — « » № °`), via `next/font/local`, `font-display: swap`, preloaded; fallback `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` with `size-adjust`.

| Style | Phone | ≥ 1024 | Weight | Where |
|---|---|---|---|---|
| `display` | 32/38 | 48/54 | 800 | Home headline |
| `h1` | 26/32 | 36/42 | 800 | Page title |
| `h2` | 22/28 | 26/32 | 700 | Sections |
| `h3` | 18/24 | 18/24 | 700 | Card titles |
| `body` | 16/24 | 16/26 | 400 | Text |
| `body-strong` | 16/24 | 16/24 | 600 | Material names, buttons |
| `small` | 14/20 | 14/20 | 400 | Labels |
| `caption` | 12/16 | 12/16 | 500 | Tags, “Реклама”, checked date |
| `result` | 40/44 | 48/52 | 800 | Main result number |
| `result-unit` | 20/28 | 22/28 | 600 | “пачек” next to number |
| `quantity` | 20/24 | 20/24 | 700 | Quantity in list row |
| `input` | 18/24 | 18/24 | 600 | Field value |

Numbers: `tabular-nums` wherever digits change; decimal comma, thin non-breaking space thousands (“12 460 ₽”, “19,8 м²”); number + unit never wrap; dimensions with “×” and spaces (“4,6 × 4,3 × 2,7 м”); plurals via `Intl.PluralRules`. BYN/KGS rendered as `Intl.NumberFormat` gives them (“Br”, “сом”).

### Grid, spacing, radius, shadow, layers

| Width | Cols | Margin | Gutter |
|---|---|---|---|
| 360–639 | 4 | 16 | 12 |
| 640–1023 | 8 | 24 | 16 |
| ≥ 1024 | 12 | 32 | 24 |
| ≥ 1280 | 12 | auto (container 1200) | 24 |

Min width 320 px. Spacing step 4: 4·8·12·16·20·24·32·40·48·64. Radius: `sm` 8, `md` 12 (fields, 48 px buttons), `lg` 16 (cards, 56 px buttons), `xl` 24, `full`. Shadows navy-tinted: `sm 0 1px 2px rgb(15 30 52/.06)`, `md 0 4px 16px rgb(15 30 52/.08)`, `lg 0 12px 32px rgb(15 30 52/.14)`; no shadows in dark. z-index: sticky header 30, sticky result 40, cookie banner 50, sheets/dialogs 60, toasts 70.

### Icons

Lucide via `lucide-react`, imported per icon. 24 grid, 2 px stroke, sizes 16/20/24, `currentColor`. Icon in circle: 48 px `--color-primary-soft` + 24 px `--color-primary-hover`. Icon-only buttons 48 × 48 with `aria-label`. No emoji. Nine custom category icons in Lucide style; four needed at launch (osnova, pol, steny, plitka).

### Logo

Only from SVG files (never re-typeset): `logo.svg`, `logo-white.svg`, `icon.svg`, `icon-white.svg`, `favicon.svg`, `favicon-dark.svg` → `packages/ui/assets/brand/`. Header height 32 px phone / 40 px ≥ 1024; clear space ¼ height; shift down 7% for optical alignment; word `#0F1E34` or white, sparks always `#F87C08`. Favicon is the “У” mark, not the cat.

### Mascot «Умняут»

Ginger tabby in round glasses and navy overalls/apron with the “У” mark, tape measure on the belt. Speaks first person, short, formal “вы”, ≤ 60 chars per bubble.

| # | Pose | Where | Stage | Source file in `docs/details/` |
|---|---|---|---|---|
| 1 | `hello` | Home hero, bot `/start`, OG image | 1 | `Friendly Orange Tabby Mascot with Raised Paw.png` / `Cheerful Cat Mascot with Blueprint.png` |
| 2 | `done` | Result header, saved project | 1 | `Winking Cat Mascot with Calculator and Thumbs-Up.png` |
| 3 | `warn` | Warnings, electrical disclaimers | 1 | `Friendly Orange Tabby Mascot with Raised Paw.png` (to confirm) |
| 4 | `oops` | 404, save failure, offline | 1 | `Apologetic Tabby Cat Shrugging.png` |
| 5 | `head` | Bot avatar, 40 px hints, header ≥ 1024 | 1 | `Cute Orange Tabby Cat Avatar.png` |
| 6 | `measure` | My room card, planner step 1 | 2 | `Orange Tabby Measuring Tape Mascot.png` |
| 7 | `point` | “How we calculate”, next steps | 2 | `Orange Tabby Mascot Pointing with Pencil.png` |
| 8 | `empty` | Empty “My calculations” | 2 | `Curious Cat and Open Box.png` |
| 9 | `think` | AI recognition wait | 3 | `Thoughtful Tabby Cat Planner.png` |
| 10 | `camera` | Scan label | 3 | `Focused Orange Tabby with Smartphone.png` |
| 11 | `master` | Master mode entry | 3 | `Construction Cat with Tablet and Hard Hat.png` |

A turnaround sheet (`Orange Tabby Mascot Turnaround Sheet.png`) and 11 poses at 1254 px now exist — this partially resolves the design spec's open question; the spec asked for ≥ 2048 px, so verify they are sufficient for the 400 px hero at 2×. Short videos (`hello-video.mp4`, `done.mp4`, `oops.mp4`, `empty.mp4`, `think.mp4`) also exist, while the spec says “no character animation at launch” — needs a decision (see [Development Plan](../plan/development-plan.md) open questions).

Sizes: home hero 160 / 400 px; result header 56 / 96 px; hint 40 px head; empty/404 160 / 240 px; saved project 64 / 120 px. Rules: one cat per view; never adds height on a tool page; never covers numbers/fields/scheme; always on a mint spot; bubble text duplicated in normal text; no jokes about input errors; no cat in widget, print, client estimate, or near ads; only a 200 ms fade-in. Export AVIF + WebP via `picture`, 1× and 2×; head ≤ 4 KB, 56–96 px ≤ 10 KB, hero ≤ 60 KB.

### Material photos

One photo per `PurchaseItem.key`. Style: single object on transparent background, ¾ view, soft shadow, light from top-left, white/light-grey packaging (one teal stripe allowed), **no letters, numbers, logos**. Source 1024 × 1024 PNG, object 80% of frame. Built at build time by a `sharp` script → AVIF/WebP at 128/192/320 px, path `/img/m/<key>-<width>.avif`, hashed, cached 1 year. Budgets: ≤ 15 KB images on the phone first screen, ≤ 80 KB per calculator page. `MaterialThumb` falls back to a mint tile with the category icon. Launch set: 12 material photos + 4 category photos.

### Motion

Hover/press/focus 120 ms; result number change 150 ms opacity 0.4 → 1; accordion 200 ms; sticky bar/toast 200 ms (8 px slide); sheet/dialog 320 ms with 40% backdrop. Single curve `cubic-bezier(0.2, 0, 0, 1)`. `prefers-reduced-motion` keeps only opacity. No parallax, scroll animations or rolling counters.

### Accessibility

Contrast ≥ 4.5 text, ≥ 3 borders/icons; tap ≥ 48 × 48 with ≥ 8 px spacing; visible labels on every field; focus ring always visible; logical Tab order; sheets trap focus and close on Esc; meaning never by colour alone (cut pieces hatched, errors in text, chips with check); schemes have a text summary; layout survives 200% font size (`rem`); result block `aria-live="polite"`. Lighthouse a11y ≥ 95.

### Tone of voice

| Rule | Do | Don't |
|---|---|---|
| Result names the purchase | «Нужно купить: 10 пачек» | «Результат расчёта: 22,14 м²» |
| Button = verb + object | «Сохранить расчёт», «Посчитать плинтус» | «ОК», «Подробнее» |
| Label = what to measure | «Длина комнаты», «Досок в пачке» | «Параметр L» |
| Error says what to enter | «От 0,5 до 30 м» | «Некорректное значение» |
| Warning = reason + way out | «Последний ряд выйдет 5 см. Подрежьте первый ряд» | «Внимание!» |
| Honest about accuracy | «Типовая цена, проверена в ноябре 2026» | «Актуальные цены в вашем регионе» |
| No exclamations/caps | «Ссылка скопирована» | «УСПЕШНО!» |

All UI strings live in `catalog` and `content`, never in components.

## Configuration

| What | Where |
|---|---|
| Tokens, type scale (`text-display` … `text-input`), keyframes, reduced motion | `packages/ui/src/theme.css` — `@theme static` so every token is emitted (dark overrides and `var()` use need them) |
| Font | `packages/ui/assets/fonts/onest-var.woff2` (36 KB), built by `pnpm --filter @umnyaut/ui font` from the Onest TTF at a pinned google/fonts commit; loaded with `next/font/local` in `apps/web/app/fonts.ts` |
| Brand | `packages/ui/assets/brand/*.svg`; `Logo` component draws the same paths; favicon `apps/web/app/icon.svg` switches with `prefers-color-scheme` |
| Mascot | Sources stay in `docs/details/`; `pnpm --filter web images` crops faint alpha, writes hashed AVIF/WebP to `apps/web/public/img/mascot/` and `src/shared/config/mascot.gen.ts`. Outputs are committed (encoders differ by platform); CI `images:check` verifies sources unchanged and budgets: AVIF ≤ budget, WebP fallback ≤ 2×. `/img/*` is served `immutable` |
| Components | `packages/ui/src/{components,media,icons,format}`; all strings come in as props from `catalog`. Gallery: `/dev/ui` (404 when `APP_ENV=production`, noindex) |
| Contrast | `packages/ui/src/theme.test.ts` checks the §5 pairs against the real token values |

## Usage

See component specs (buttons, inputs, result, navigation, messages) in design spec §11 and the screen compositions in §12–14; mockups show laminate (phone first screen, sticky bar, full page, desktop), home (phone, desktop), planner step 4, saved project (owner), Telegram entry (light, dark).

## Cross-references

- [Calculator Shell, Pages and Routing](../ui/calculator-shell-and-pages.md) — which block shows what
- [Product and Domain](../business/product-and-domain.md) — dictionary and principles
- [Telegram Bot](../integrations/telegram-bot.md) — theme mapping
- [Engineering Practices](../practices/engineering-practices.md) — performance budget
- Skill spec: [ui-component](../skills/ui-component.md); agent spec: [frontend-builder](../agents/frontend-builder.md)

## File Structure

| Path | Description |
|---|---|
| `docs/details/logo*.svg`, `icon*.svg`, `favicon*.svg` | Brand sources |
| `docs/details/*Tabby*.png`, `*Cat*.png` | Mascot poses (1254 px) + turnaround sheet |
| `docs/details/*.mp4` | Mascot animation clips (usage undecided) |
| `docs/details/umnyaut-reference.png`, `umnyaut-desctop-reference.png` | Concepts (mood only) |
| `docs/details/cat-emblem.png`, `logo-cat.png`, `favicon-cat.png` | Small cat marks |
