---
spec_version: 1.0
date: 2026-10-08
status: built
skill_slug: calculator-release-check
skill_name: Calculator Release Check
targets: [claude-code, codex, universal]
---

# Calculator Release Check — Skill Specification

> Spec v1.0 · 2026-10-08 · status: built · [Skills index](../README.md)

## 1. Purpose

Answers “is tool X ready to ship?” by checking it against the 16-requirement calculator standard and the definition of done, producing a pass/fail checklist with evidence. It turns the business spec's definition of a “useful calculator” into a repeatable gate, so no tool reaches prod missing warnings, “how calculated”, sources, or tests.

## 2. When to trigger

Should trigger:
- «Проверь, готов ли калькулятор обоев к релизу», “is `laminat` ready to ship?”
- “Run the release check for wave 1”, “DoD check for plitka”
- Before opening a PR `develop` → `main` that includes a new tool

Should NOT trigger:
- Generic code review of a diff → `code-reviewer` agent
- Running lint/tests only → `preflight`
- Writing the tool → `new-calculator`

## 3. Inputs

Tool id(s) or “wave N”. Reads the tool's five files, `docs/business/product-and-domain.md` (standard), test output, built HTML (`.next` / export), Lighthouse CI report if present.

## 4. Outputs

A Markdown report per tool:

```
## <id> — READY | NOT READY
| # | Requirement | Status | Evidence |
|---|---|---|---|
| 1 | Purchase units | ✅ | items[0].packs integer, leftover present |
...
Blocking: <list>   Non-blocking: <list>   Manual: real-phone check, events in Metrika
```

No files are modified.

## 5. Workflow

1. Load the standard (16 requirements) and DoD.
2. Static checks per requirement: e.g. 1 → `PurchaseItem` has `packs`/`bought`/`leftover`; 2 → `WasteRule` used and overridable field exists; 3 → `openings` field or shape support; 4 → `role: 'related'` items; 6 → ≥ 1 warning code with catalog text; 7 → non-empty `steps`; 8 → norms have `source` + `checkedAt`; 10 → ≥ 10 golden examples with sources; 12 → length fields with `room` binding / units; 13 → `room` bindings; 15 → `layout` for layout tools; 16 → presets where standard formats exist.
3. Run tests for the tool (golden, invariants, registry, content schema).
4. Check built HTML without JS: title, one H1, canonical, result numbers, FAQ.
5. Check content: 300–600 words, frontmatter limits, norms inserted via substitutions not literals.
6. Read Lighthouse report if available against thresholds.
7. List what must be verified manually (real phone, Metrika events, reviewer sign-off) and output the report.

## 6. Resources

`docs/business/product-and-domain.md` (standard), `docs/practices/engineering-practices.md` (DoD, budgets), `docs/business/seo-and-analytics.md` (HTML guard). Optional script: word counter for Markdown body excluding frontmatter.

## 7. Examples

- “Is `oboi` ready?” → NOT READY: req. 8 missing `checkedAt` on glue norm; golden has 9 entries. Others ✅.
- “Release check wave 1” → table of 10 tools, 8 READY, 2 NOT READY with blockers.

## 8. Acceptance criteria

- Makes zero file edits.
- Reports all 16 requirements for each tool, marking 15/16 as N/A with reason when not applicable.
- Flags < 10 golden examples and missing sources as blocking.
- Distinguishes automated evidence from manual checks.

## 9. Target adaptation

### 9.1 Claude Code
`.claude/skills/calculator-release-check/SKILL.md`, read-only workflow; may run test commands. Bundle `references/standard.md` (the 16 requirements table).

### 9.2 Codex / AGENTS.md
`## Skill: calculator-release-check` in `AGENTS.md` with the checklist and report template.

### 9.3 Universal
Walk the 16 requirements against the tool's files and tests; output the table; change nothing.

## 10. Materialization log

| Tool | Location | Built from spec v | Date |
|---|---|---|---|
| claude-code | .claude/skills/calculator-release-check/ | 1.0 | 2026-10-08 |
| codex | AGENTS.md#skill-calculator-release-check | — | — |

## 11. Changelog

- v1.0 — Initial spec from business spec §7 and tech spec §15.
