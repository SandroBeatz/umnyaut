---
spec_version: 1.0
date: 2026-10-08
status: built
skill_slug: new-calculator
skill_name: New Calculator
targets: [claude-code, codex, universal]
---

# New Calculator — Skill Specification

> Spec v1.0 · 2026-10-08 · status: built · [Skills index](../README.md)

## 1. Purpose

Adds a new tool to the UmnyAut catalog end to end: the five files every calculator needs, wired to the shared `ToolModule` contract, with ≥ 10 golden examples and passing invariants. A calculator is the project's main unit of work (60–80 of them by month 12), so a repeatable, checkable procedure keeps formulas correct and the catalog consistent.

The skill encodes the rule “code computes, never AI”: the agent implements a deterministic formula from cited norm sources and proves it with golden examples; it never invents norms.

## 2. When to trigger

Should trigger:
- “Add the laminate calculator”, «сделай калькулятор затирки», «добавь инструмент плинтус»
- “Implement wave‑2 tool `shtukaturka`”, “create the five files for `radiatory`”
- A roadmap task titled «Калькулятор: <name>»

Should NOT trigger:
- Fixing a bug inside an existing tool's formula → normal editing + `calculator-release-check`
- Writing only the Russian text under a tool → `tool-content`
- Building a shared shell block or design component → `ui-component`
- A variation page of an existing tool (catalog entry + content only) — handle inline, but follow the variation rule

## 3. Inputs

- Tool id (transliterated, e.g. `zatirka`) and Russian name.
- Category slug (`osnova|pol|steny|plitka|potolok|elektrika|klimat|strojmaterialy|interer`).
- Norm sources (manufacturer datasheets, SP/ПУЭ tables) and draft golden examples, if the user has them. If missing, the skill asks for them or proposes sources and marks them unverified.
- Reads: `docs/code/calc-engine.md`, `docs/ui/calculator-shell-and-pages.md`, business spec catalog tables (§8) and tech spec §8 for the approach.

## 4. Outputs

Exactly these files (scheme only when the tool needs one):

| File | Content |
|---|---|
| `packages/calc/src/tools/<id>/index.ts` | `ToolModule`: Zod input with bounds, `defaults(ctx)`, `compute()` returning codes not text |
| `packages/calc/src/tools/<id>/golden.ts` | ≥ 10 examples `{ name, input, ctx, expect, source }` |
| `packages/catalog/src/tools/<id>.ts` | URL, category, titles, `FieldDef[]` (≤ 4 `main`), presets, next steps, warning/step texts, norms with `source` + `checkedAt`, `disclaimer` if electrical/heating/screed |
| `apps/web/content/tools/<id>.md` | Frontmatter + placeholder body (full text via `tool-content`) |
| `apps/web/src/widgets/layout-scheme/<id>.tsx` | Only if layout affects the result |

Plus a short report: formula summary, sources used, any unverified norms, test results.

## 5. Workflow

1. **Locate the approach.** Read the tool row in the tech spec §8 / `calc-engine.md` and the business spec “what it counts beyond the formula” column. That column is the differentiator — implement it, not just area × rate.
2. **Pick building blocks** (`geometry`, `packs`, `waste`, `coverage`, `rows`, `grid`, `strips`, `frame`, `power`). Reuse; add to a block only if the logic is shared by another planned tool.
3. **Write golden examples first.** At least 10, covering: typical case, the business-spec example if any, small room, large room, openings, each laying method/option, pack boundary (exact multiple and +ε), and a warning case. Each has a `source`. Writing them first prevents fitting tests to code.
4. **Implement `index.ts`.** Integer mm internally; full precision until the end; `ceilPacks()` for packages; return warning codes with numbers; `steps` with substituted numbers; never throw on schema-valid input; bump nothing (new tool starts at `version: 1`).
5. **Catalog entry.** Russian strings only here. Mark ≤ 4 `main` fields (those without which the calc is meaningless), `planner` fields if the tool joins the planner, presets for standard formats, next-step chain (e.g. laminate → underlay → plinth).
6. **Content stub.** Frontmatter with limits (title ≤ 65, description ≤ 160, h1 ≤ 40, question ≤ 42, example, ≥ 3 FAQ placeholders). Delegate full text to `tool-content`.
7. **Scheme** only for layout tools; geometry comes from `result.layout`, the component only draws.
8. **Verify:** run calc tests (golden + invariants + coverage), registry tests, typecheck. Fix until green.
9. **Report** sources, assumptions, anything needing reviewer confirmation.

## 6. Resources

- `docs/code/calc-engine.md` — contract, rules, blocks.
- `docs/ui/calculator-shell-and-pages.md` — `FieldDef`, frontmatter.
- `docs/specs/UmnyAut — техническая спецификация.md` §5, §8.
- Optional bundled reference: a golden-example template file showing the expected shape.

## 7. Examples

- Input: «Добавь калькулятор затирки» → Output: `zatirka` module using `coverage` with kg/m² = (A + B) ÷ (A × B) × joint width × depth × density, 10 golden examples (formats 30×30, 60×60, 20×60 mosaic…, joint 2–5 mm), catalog entry under `plitka`, content stub; report lists the grout density source.
- Input: “Implement laminate (wave 1)” → Output: `laminat` on `rows` + `waste` + `packs`, related items underlay and plinth, warning `narrow_last_row`, golden example 4.6 × 4.3 m, pack 2.22 m² → 10 packs; scheme file present.

## 8. Acceptance criteria

- The four mandatory files exist with the exact paths; scheme file only if `layout` is returned.
- `golden.ts` has ≥ 10 entries, each with a non-empty `source`.
- `calc` tests, invariants and registry tests pass; `packages/calc` coverage ≥ 95%.
- `index.ts` imports nothing but Zod and internal `calc` modules; contains no Russian strings.
- Catalog entry has ≤ 4 `main` fields and every norm has `source` + `checkedAt`.
- No route file was added.

## 9. Target adaptation

### 9.1 Claude Code

`.claude/skills/new-calculator/SKILL.md`; description encodes §2 triggers (RU + EN phrasings). Bundle `references/golden-template.ts`. Allow delegating to the `calc-engineer` subagent for implementation and `formula-reviewer` for a second opinion.

### 9.2 Codex / AGENTS.md

Section `## Skill: new-calculator` in `AGENTS.md` with triggers, the five-file table, workflow steps and acceptance checks.

### 9.3 Universal

Given a tool id and sources: write ≥ 10 golden examples, implement a pure `ToolModule` per the contract in `docs/code/calc-engine.md`, add the catalog entry and content stub, and run the tests until green.

## 10. Materialization log

| Tool | Location | Built from spec v | Date |
|---|---|---|---|
| claude-code | .claude/skills/new-calculator/ | 1.0 | 2026-10-08 |
| codex | AGENTS.md#skill-new-calculator | — | — |

## 11. Changelog

- v1.0 — Initial spec from tech spec §4–5, §8, §19.
