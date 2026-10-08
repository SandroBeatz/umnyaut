---
spec_version: 1.0
date: 2026-10-08
status: built
skill_slug: tool-content
skill_name: Tool Content
targets: [claude-code, codex, universal]
---

# Tool Content — Skill Specification

> Spec v1.0 · 2026-10-08 · status: built · [Skills index](../README.md)

## 1. Purpose

Writes or updates the Russian-language Markdown under a calculator (`apps/web/content/tools/<id>.md`) and its SEO frontmatter, following the product's content rules: 300–600 words, real queries as FAQ, norms inserted from `catalog` so text never contradicts code, no filler. Content is one of three pillars of search traffic, and the place where a wrong number in text would destroy trust.

## 2. When to trigger

Should trigger:
- «Напиши текст для калькулятора ламината», “write content for `zatirka`”
- “Update FAQ for oboi from new Wordstat queries”, «перепиши title и description для плитки»
- Creating a variation page's text (`content/tools/<id>/<variant>.md`) or a reference page

Should NOT trigger:
- Blog posts, news, reviews, ratings — the product does not publish these
- UI microcopy in components/catalog (button labels, warnings) → part of `new-calculator` / `ui-component`
- Translating to other languages (single-language site)

## 3. Inputs

Tool id; main query and refinements (from `docs/specs/_СВОДКА_все_запросы.csv`, Wordstat exports, or Webmaster queries the user provides); the tool's catalog entry (norms, presets) and calc steps; worked example values (from `defaults()`).

## 4. Outputs

`apps/web/content/tools/<id>.md`:

```markdown
---
title: "Калькулятор ламината онлайн: пачки, подложка и плинтус за минуту"   # ≤ 65
description: "…"                                                             # ≤ 160
h1: "Калькулятор ламината"                                                   # ≤ 40
question: "Сколько нужно ламината на комнату"                                # ≤ 42
updatedAt: 2026-11-20
checkedAt: 2026-11-12
example: { … }        # input of the worked example
faq:
  - q: "…"
    a: "…"
---
## Как считается ламинат
…
## Какой запас выбрать
…
## Пример расчёта
…
## Частые ошибки
…
```

## 5. Workflow

1. Gather queries: main query (title + H1), four forms (“калькулятор”, “расчёт”, “сколько нужно”, “расход на м²”) each covered by a section, top refinements → 5–8 FAQ.
2. Pull every number (waste %, consumption rates, overlaps) from `catalog` and insert as substitutions `{{norm.<key>}}`, never as literals — text must not drift from code.
3. Write 300–600 words: how it's calculated, which waste to choose, worked example matching `defaults()` output, common mistakes, FAQ, related tools. Tone: formal “вы”, short, store-language; vocabulary per the design dictionary (расчёт, список покупок, моя комната, запас).
4. Frontmatter within limits; `question` phrased as a real search query with demand (check the CSV — e.g. «сколько пачек ламината нужно» has zero demand, prefer «сколько нужно ламината»).
5. Validate: frontmatter schema, word count, ≥ 3 FAQ (≥ 5 target), no literal norm numbers, no promises of “актуальные цены”.

## 6. Resources

`docs/business/seo-and-analytics.md`, `docs/design/design-system.md` (tone + dictionary), `docs/specs/_СВОДКА_все_запросы.csv`. Optional script: word counter + literal-number detector.

## 7. Examples

- “Write content for `zatirka`” → ~450 words, title «Калькулятор затирки для плитки: расход на м² и количество упаковок», FAQ from «расход затирки на 1 м2», grout density via `{{norm.grout.density}}`.
- «Обнови FAQ обоев по новым запросам» → adds 2 FAQ, bumps `updatedAt`, rest untouched.

## 8. Acceptance criteria

- Body 300–600 words (excluding frontmatter and FAQ answers counted separately ≤ 600 total recommended).
- Frontmatter passes schema; length limits respected.
- No numeric norm literal that exists in `catalog`.
- Language Russian, vocabulary matches the dictionary; no exclamation marks.

## 9. Target adaptation

### 9.1 Claude Code
`.claude/skills/tool-content/SKILL.md`; may delegate drafting to the `seo-content-writer` agent.

### 9.2 Codex / AGENTS.md
`## Skill: tool-content` section with rules and template.

### 9.3 Universal
Write the Markdown per the template and rules above; validate limits.

## 10. Materialization log

| Tool | Location | Built from spec v | Date |
|---|---|---|---|
| claude-code | .claude/skills/tool-content/ | 1.0 | 2026-10-08 |
| codex | AGENTS.md#skill-tool-content | — | — |

## 11. Changelog

- v1.0 — Initial spec from business spec §7, §11 and tech spec §7.
