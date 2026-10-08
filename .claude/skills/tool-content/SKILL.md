---
name: tool-content
description: Write or update the Russian-language Markdown text and SEO frontmatter under an UmnyAut calculator (apps/web/content/tools/<id>.md), variation or reference page — 300–600 words, FAQ from real queries, norms inserted from catalog via substitutions. Use when the user asks «напиши текст для калькулятора ламината», "write content for zatirka", "update FAQ for oboi from new Wordstat queries", «перепиши title и description для плитки», or needs text for a variation/reference page. Do NOT use for blog posts, news, reviews or ratings (the product publishes none), UI microcopy in components or catalog (button labels, warnings), or translations.
---

# Tool Content

The calculator is the product; text supports it and must never contradict the code. Source spec: `docs/skills/tool-content.md` (v1.0). Rules: `docs/business/seo-and-analytics.md`, tone and dictionary: `docs/design/design-system.md`. For bulk drafting, delegate to the `seo-content-writer` agent if available.

## Inputs

Tool id; main query + refinements (from `docs/specs/_СВОДКА_все_запросы.csv`, Wordstat or Webmaster exports from the user); the tool's catalog entry (norms, presets) and `defaults()` / `steps` for the worked example.

## Output

`apps/web/content/tools/<id>.md` (variations: `apps/web/content/tools/<id>/<variant>.md`):

```markdown
---
title: "Калькулятор ламината онлайн: пачки, подложка и плинтус за минуту"   # ≤ 65
description: "…"                                                             # ≤ 160
h1: "Калькулятор ламината"                                                   # ≤ 40
question: "Сколько нужно ламината на комнату"                                # ≤ 42
updatedAt: YYYY-MM-DD
checkedAt: YYYY-MM-DD
example: { … }        # input of the worked example
faq:
  - q: "…"
    a: "…"
---
## Как считается …
## Какой запас выбрать
## Пример расчёта
## Частые ошибки
```

## Workflow

1. **Queries.** Main query → `title` and `h1`. Cover the four forms as sections: «калькулятор X», «расчёт X», «сколько X нужно», «расход X на м²». Top refinements → 5–8 FAQ.
2. **Numbers from code.** Every norm (waste %, consumption, overlap, density) goes in as `{{norm.<key>}}` from `catalog`. Never type a norm literal. If a needed norm is missing in `catalog`, list it in the report — don't invent it.
3. **Write 300–600 words**: how it's calculated, which waste to choose, worked example matching `defaults()`, common mistakes, FAQ, related tools.
4. **Tone**: Russian, «вы», short sentences, store language. No exclamation marks, caps, «актуальные цены», filler.
   Dictionary: расчёт (not калькуляция), список покупок (not корзина), моя комната (not помещение), запас (not коэффициент отходов), мои расчёты (not профиль); «смета» only in master mode.
5. **`question`** must be a real query with demand — check the CSV (e.g. «сколько пачек ламината нужно» = 0/mo; prefer «сколько нужно ламината» ≈ 4k/mo).
6. **Variations** only if all three hold: own confirmed demand, genuinely different calc/preset, own example + ≥ 3 FAQ. Never pages per size combination.
7. **Validate**: frontmatter limits, word count, ≥ 3 FAQ (target 5–8), no literal norms. Run the content schema test if the repo has it.

## Report

File(s) written · word count · main query + forms covered · FAQ sources · missing norms (if any).
