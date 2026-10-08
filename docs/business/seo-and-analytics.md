---
version: 1.0
date: 2026-10-08
category: business
---

# SEO and Analytics

> Version 1.0 · 2026-10-08 · [Business](../business/)

## Overview

Search is the main acquisition channel (Yandex + Google, four countries). Everything a search engine needs is **generated from the tool registry**, never hand-written per page. Analytics answers three questions per page: is it found, do people calculate on it, do they take the next step. Funnel: search impression → click → useful calculation → action.

> Status: planned. Sources: business spec §6, §11, §12; technical spec §14.

## Rules

### Page types and indexing

Nine page types, seven indexed. ~150 indexed pages by month 12; tool pages and their variations bring most traffic. URLs are short transliterated slugs nested by category, with trailing slash.

**Variation rule** (protection from low-quality filters) — a separate page only when **all three** hold: own demand confirmed (Wordstat / Webmaster queries); calculation or preset genuinely differs; own example and FAQ. Otherwise the query becomes a section of the main page. Never create pages per size combination (“обои на комнату 3×4”).

### Page semantics

Main query in `title` and `H1`. Four query forms (“калькулятор X”, “расчёт X”, “сколько X нужно”, “расход X на м²”) covered by sections of one page. Wordstat refinements become FAQ. Example title: «Калькулятор ламината онлайн: пачки, подложка и плинтус за минуту».

### Technical SEO

| Element | Implementation |
|---|---|
| Meta | `generateMetadata` from frontmatter; title ≤ 65, description ≤ 160; build warns on overflow |
| Canonical | Absolute URL without params on every page; `?s=` pages point to clean URL |
| JSON-LD | `WebApplication` (tool), `FAQPage` (FAQ), `BreadcrumbList` (tool, category), `Organization` + `WebSite` (home) |
| Sitemap | `sitemap.ts` from registry; only indexable pages; `lastmod` = last text or formula change |
| robots.txt | Only `/api/` disallowed. Yandex `Clean-param: s`. Saved projects are **not** disallowed (robots must see `noindex`) |
| Indexing | CI diffs sitemap after deploy → IndexNow for new/changed URLs; Google via Search Console sitemap |
| Redirects | `www` → apex, `http` → `https`; 301 map for renamed tools in `catalog` |
| OG image | One shared at launch; per-tool generation later |
| Linking | Breadcrumbs, next steps, related tools, category list in footer |

**Server HTML guard (CI):** open built HTML of every indexable page **without JavaScript** and assert: `title`, exactly one `H1`, `canonical`, text, and result numbers present.

### Growth loops after wave 1

1. Variations — monthly, for queries where a page ranks 8–30 with a distinct intent.
2. Reference pages — “расход X на 1 м²”, package sizes, norm tables; each links into the tool with values prefilled.
3. Product presets — calc page for a specific mix/format where demand exists.

Links & distribution: niche publications 1–2/month from month 2; outreach to curated lists (Lifehacker, T—Zh) at 20+ tools; free widget with backlink from month 6; every shared project is a new visitor. **No paid links.** Trust signals: About page with author, Methodology with sources, checked date on each tool, report-error button.

Rhythm: weekly 30 min in Webmaster/Search Console; monthly decision on new pages.

### Events

```ts
type EventMap = {
  tool_view:         { tool: ToolId };
  calc_started:      { tool: ToolId };                       // first field change
  calc_completed:    { tool: ToolId; fieldsChanged: number; via: 'panel' | 'sticky' };
  calc_adjusted:     { tool: ToolId };                       // change after a useful calc
  price_added:       { tool: ToolId; item: string };
  how_opened:        { tool: ToolId };
  next_tool_clicked: { tool: ToolId; next: ToolId };
  project_saved:     { works: number };
  project_shared:    { channel: 'link' | 'text' | 'print' | 'telegram' };
  result_copied:     { tool: ToolId };
  project_reopened:  { ageDays: number };
  shop_clicked:      { tool: ToolId; item: string; shop: string };
  ai_used:           { feature: AiFeature };
  ai_corrected:      { feature: AiFeature; fields: number };
  error_reported:    { tool: ToolId };
  js_error:          { tool?: ToolId };
};
track('calc_completed', { tool: 'laminat', fieldsChanged: 3, via: 'panel' });
```

`calc_completed` = ≥ 2 fields changed **and** result visible for 5 s (not a button click — results are live).

| Topic | Decision |
|---|---|
| Sinks | Own anonymous counter (always, via `navigator.sendBeacon('/api/e')` → `events_daily`) + Yandex Metrika (after consent). GA4 later as a third adapter |
| Common params | `track()` adds country, source (`web`/`tg`/`embed`), category, variation |
| URL in hits | Strip `s` param before sending to Metrika |
| Personal data | Only tool ids and counts. No dimensions, prices, texts |
| Webvisor | Master-mode name/phone fields excluded via class |

### Cookie consent — strict mode at launch

Metrika script is **not loaded** until “Принять”. Narrow bottom banner (≤ 96 px on phone), two equal buttons “Принять” / “Отклонить”, policy link, no pre-checked boxes, no wall. Choice in localStorage; “Настройки cookie” link in footer; after refusal the banner hides for 6 months. Everything (calcs, room, saving) works without consent. Ads get a separate consent category before the first ad block.

### Reading the data

| Picture | Diagnosis | Action |
|---|---|---|
| Many impressions, few clicks | Weak title or low position | Rewrite title/description, add sections |
| Clicks but few calcs | Page doesn't answer, first screen overloaded | Change defaults, raise result |
| Many calcs, few actions | Result doesn't lead further | Improve result block and links |
| Good usage, few impressions | Not enough query coverage | Variations, reference pages, links |

## Data Model

`events_daily(day, event, tool, country, source, count)` — see [Server API and Data](../code/server-api-and-data.md). Reports: weekly (useful calcs total and by tool, calc rate, new queries); monthly table per tool (impressions, clicks, position, calcs, actions, revenue) → decide develop / fix / leave. `pnpm report:weekly` aggregates Metrika, Webmaster and Search Console APIs (stage 2).

## Cross-references

- [Product and Domain](../business/product-and-domain.md) — north-star metric and checkpoints
- [Calculator Shell, Pages and Routing](../ui/calculator-shell-and-pages.md) — routes, headers, content frontmatter
- [Server API and Data](../code/server-api-and-data.md) — `/api/e`
- [Engineering Practices](../practices/engineering-practices.md) — performance budget, Lighthouse CI
- Skill spec: [tool-content](../skills/tool-content.md); agent spec: [seo-content-writer](../agents/seo-content-writer.md)
- Demand data: `docs/specs/_СВОДКА_все_запросы.csv`
