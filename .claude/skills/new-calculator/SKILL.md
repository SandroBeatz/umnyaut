---
name: new-calculator
description: Add a new UmnyAut calculator (tool) end to end — the five files per tool (calc module, ≥10 golden examples, catalog entry, content stub, optional layout scheme) on the shared ToolModule contract, with passing tests. Use when the user asks to add/implement/create a calculator or tool, e.g. "добавь калькулятор затирки", "сделай калькулятор ламината", "добавь инструмент плинтус", "implement wave-2 tool shtukaturka", "create the five files for radiatory", or works on a roadmap task «Калькулятор: <name>». Do NOT use for fixing an existing formula bug (edit directly, then calculator-release-check), writing only the page text (tool-content), building shell/UI components (ui-component), or a variation page of an existing tool.
---

# New Calculator

Adds a tool to the catalog. The rule: **code computes, never AI** — implement a deterministic formula from cited norm sources and prove it with golden examples. Never invent norms.

Source spec: `docs/skills/new-calculator.md` (v1.0). Contract and rules: `docs/code/calc-engine.md`, form/frontmatter: `docs/ui/calculator-shell-and-pages.md`, approaches per tool: tech spec §8 and business spec §8 in `docs/specs/`.

## Inputs

- Tool id (transliterated, e.g. `zatirka`) and Russian name.
- Category slug: `osnova|pol|steny|plitka|potolok|elektrika|klimat|strojmaterialy|interer`.
- Norm sources and draft golden examples if the user has them. If missing — ask, or propose sources and mark them **unverified** in the report.

## Outputs (exact paths)

| File | Content |
|---|---|
| `packages/calc/src/tools/<id>/index.ts` | `ToolModule`: Zod input with bounds, `defaults(ctx)`, `compute()` returning codes not text |
| `packages/calc/src/tools/<id>/golden.ts` | `GoldenFile`: ≥ 10 examples `{ name, input, ctx?, expected, source }` + optional Qalculator `benchmarks` (shape: `references/golden-template.ts`) |
| `packages/calc/test/arbitraries.ts` (entry, not a file) | fast-check `input` generator within the schema bounds + `grow(input)` that enlarges the area — required by the invariants test |
| `packages/catalog/src/tools/<id>.ts` | URL, category, titles, `FieldDef[]` (≤ 4 `main`), presets, next steps, warning/step texts (RU), norms with `source` + `checkedAt`, `disclaimer` for electrical/heating/screed |
| `apps/web/content/tools/<id>.md` | Frontmatter + placeholder body (full text → `tool-content` skill) |
| `apps/web/src/widgets/layout-scheme/<id>.tsx` | Only if the tool returns `layout` |

No route files. Plus a short report.

## Workflow

1. **Locate the approach.** Read the tool row in tech spec §8 / `calc-engine.md` and the business-spec column “what it counts beyond the formula”. That column is the product's edge — implement it, not just area × rate.
2. **Pick building blocks**: `geometry`, `packs`, `waste`, `coverage`, `rows`, `grid`, `strips`, `frame`, `power`. Reuse; extend a block only if another planned tool needs the same logic.
3. **Write golden examples first** (≥ 10, each with `source`): typical case, the spec's example if any, small room, large room, openings, each laying method/option, pack boundary (exact multiple and +ε), a warning case. Writing them first prevents fitting tests to code.
4. **Implement `index.ts`**:
   - Imports: Zod and internal `calc` modules only. No React, `fetch`, `Date.now()`, `Math.random()`, no Russian strings.
   - Integer mm internally; full precision until the end; packages via `ceilPacks()` only.
   - `PurchaseItem` with `need`, `pack`, integer `packs`, `bought`, `leftover`; related items as `role: 'related'`.
   - Warnings as `{ code, level, ...numbers }`; `steps` with substituted numbers; never throw on schema-valid input.
   - New tool starts at `version: 1`.
5. **Catalog entry.** Russian strings live here. ≤ 4 `main` fields (without which the calc is meaningless); `planner` fields if it joins the planner; presets for standard formats; next-step chain (laminate → underlay → plinth, wallpaper → glue → primer, tile → adhesive → grout, plaster → putty → paint).
6. **Content stub.** Frontmatter: `title` ≤ 65, `description` ≤ 160, `h1` ≤ 40, `question` ≤ 42, `updatedAt`, `checkedAt`, `example`, ≥ 3 `faq` placeholders. Hand the body to `tool-content`.
7. **Scheme** only for layout tools; geometry comes from `result.layout`, the component only draws.
8. **Verify**: calc tests (golden + invariants + coverage ≥ 95%), registry tests, typecheck. Iterate until green. Never weaken a test to pass.
9. Optionally ask the `formula-reviewer` agent (if built) for an independent check.

For heavy implementation, delegate to the `calc-engineer` agent if available.

## Report template

```
Tool: <id> v1 · category <slug>
Formula: <one paragraph>
Blocks: …
Golden: N cases (sources: …)
Unverified: <list or "none">
Tests: golden ✅ invariants ✅ coverage NN% ✅ tsc ✅
Files: …
```

## Acceptance checklist

- [ ] Four mandatory files at exact paths; scheme only if `layout` returned
- [ ] `golden.ts` ≥ 10 entries, each with non-empty `source`
- [ ] calc, invariant and registry tests pass; `packages/calc` coverage ≥ 95%
- [ ] `index.ts` imports only Zod + internal calc; no Russian strings
- [ ] Catalog: ≤ 4 `main` fields; every norm has `source` + `checkedAt`
- [ ] No route file added
