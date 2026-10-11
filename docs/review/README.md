---
version: 1.0
date: 2026-10-10
category: plan
---

# Reviewer Handouts

> Version 1.0 · 2026-10-10 · [Plan](../plan/)

## Overview

Files sent to the practising master (account A26, content plan C10) for an independent check of the calculators. The handout itself is in Russian, for the reviewer; this README is the project-side note.

| File | What | How it is made |
|---|---|---|
| [wave-1-master.md](./wave-1-master.md) | Every golden example of the 10 live wave-1 tools: parameters by field label, our answer in packs, the hand derivation with sources, Qalculator observations, open questions per tool | `pnpm review:export` (`tooling/scripts/review-export.ts`) — regenerate after any golden change |

| [wave-1-release-check.md](./wave-1-release-check.md) | The 16-requirement release check per tool with blockers | `calculator-release-check` skill, by hand |

Raw rows for a spreadsheet: `pnpm calc:export --csv --out wave-1.csv`.

## Usage

1. Regenerate: `pnpm review:export`.
2. The owner sends the file to the master and collects the marked rows and answers.
3. Each correction becomes a new golden example (with `source.kind: "reviewer"`) or a norm change with its decision in [Norm Sources — Wave 1](../code/norm-sources-wave-1.md).

## Cross-references

- [Development Plan](../plan/development-plan.md) — P6.10
- [Content Plan](../plan/content-plan.md) — C10
- [Calculation Engine](../code/calc-engine.md) — golden examples and the reviewer export
