---
name: calculator-release-check
description: Check whether an UmnyAut calculator is ready to ship against the 16-requirement calculator standard and the definition of done, producing a pass/fail checklist with evidence — read-only. Use when the user asks «проверь, готов ли калькулятор обоев к релизу», "is laminat ready to ship?", "run the release check for wave 1", "DoD check for plitka", or before a PR develop → main that includes a new tool. Do NOT use for generic diff review (code-reviewer agent), just running lint/tests (preflight), or writing a tool (new-calculator).
---

# Calculator Release Check

Turns the business spec's definition of a “useful calculator” into a repeatable gate. **Makes zero file edits.** May run test commands.

Source spec: `docs/skills/calculator-release-check.md` (v1.0). Standard: `references/standard.md` (also `docs/business/product-and-domain.md`). DoD and budgets: `docs/practices/engineering-practices.md`.

## Inputs

Tool id(s) or “wave N” (wave lists in `docs/business/product-and-domain.md`).

## Workflow

1. Load `references/standard.md`.
2. For each tool, read its five files: `packages/calc/src/tools/<id>/{index,golden}.ts`, `packages/catalog/src/tools/<id>.ts`, `apps/web/content/tools/<id>.md`, optional `apps/web/src/widgets/layout-scheme/<id>.tsx`.
3. Static check per requirement (evidence hints in the standard file).
4. Run tests for the tool: golden, invariants, registry, content schema.
5. Inspect built HTML without JS (build output): `title`, exactly one `H1`, `canonical`, result numbers, FAQ present.
6. Content: body 300–600 words, frontmatter limits (title ≤ 65, description ≤ 160, h1 ≤ 40, question ≤ 42), norms via `{{norm.*}}` substitutions, not literals.
7. If a Lighthouse CI report exists, compare with thresholds (LCP ≤ 2.0 s, INP ≤ 200 ms, CLS ≤ 0.05, JS ≤ 150 KB gz, perf ≥ 90, SEO 100, a11y ≥ 95).
8. List manual checks that cannot be automated.

## Blocking rules

- < 10 golden examples, or any example without `source` → blocking.
- Any norm without `source`/`checkedAt` → blocking (req. 8).
- Missing any of req. 1–14 → blocking. 15/16 → N/A with reason when not applicable (15 is required for tile, laminate, wallpaper).
- No-JS HTML lacking result numbers → blocking.

## Output (per tool)

```
## <id> — READY | NOT READY
| # | Requirement | Status | Evidence |
|---|---|---|---|
| 1 | Purchase units | ✅ | items[0].packs integer, leftover present |
…
Blocking: …
Non-blocking: …
Manual: real-phone check, events visible in Metrika, reviewer sign-off
```

For a wave, add a summary table on top: tool · verdict · blockers count.
