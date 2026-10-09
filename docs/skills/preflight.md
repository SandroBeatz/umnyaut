---
spec_version: 1.1
date: 2026-10-08
status: built
skill_slug: preflight
skill_name: Preflight
targets: [claude-code, codex, universal]
---

# Preflight — Skill Specification

> Spec v1.1 · 2026-10-08 · status: built · [Skills index](../README.md)

## 1. Purpose

Runs locally the same chain CI runs on a PR, so failures are caught before pushing: Biome, boundary guard, Steiger, typecheck, tests, `next build`, server-HTML guard, and optionally the Docker image smoke test. Reports a concise pass/fail summary with the first actionable error per step.

## 2. When to trigger

Should trigger: «прогони проверки», “run preflight”, “is this ready to push?”, “check CI locally”, before creating a PR.

Should NOT trigger: a single failing test investigation (debug directly); release readiness of a tool (`calculator-release-check`); deploying.

## 3. Inputs

Optional scope (`--affected` default via Turborepo, or `--all`), optional `--docker` flag.

## 4. Outputs

```
Preflight (affected: calc, web)
✅ biome   ✅ guard   ✅ steiger   ❌ tsc+test (calc: golden.test.ts › zatirka has 9 examples)   ⏭ build   ⏭ html   ⏭ docker
```

No file modifications unless the user asks for `--fix` (Biome autofix only).

## 5. Workflow

Node 24 (`.nvmrc`) and pnpm 12 (`packageManager`, via corepack).

1. `pnpm install --frozen-lockfile` if lockfile changed or `node_modules` is missing.
2. `--fix` only: `pnpm format` (Biome autofix).
3. `pnpm lint` — Biome.
4. `pnpm guard` — `tooling/scripts/check-boundaries.mjs`: package import boundaries, calc purity, `import "server-only"` first in `server/**`, no `server/` from `src/`, FSD layer order including `views`.
5. `pnpm steiger` — FSD slice structure.
6. `pnpm turbo run typecheck test --filter='...[origin/develop]'` (`--all`: without the filter).
7. `pnpm turbo run build --filter=web` (the web `build` script runs the guard again before `next build`).
8. Server-HTML guard against build output (from P5.10).
9. With `--docker`: build `apps/web/Dockerfile`, run container, hit `/api/health` (from P2.1/P2.3).
10. Stop at first failing stage, print the first error and the command to reproduce.

`pnpm check` runs steps 3–7 for all packages in one command.

## 6. Resources

Root `package.json` scripts (`lint`, `format`, `guard`, `steiger`, `typecheck`, `test`, `build`, `check`), `turbo.json`, `tooling/scripts/check-boundaries.mjs`; `.github/workflows/ci.yml` (P2.4) must stay in sync with this sequence.

## 7. Examples

- “run preflight” → all green, ~2 min.
- “preflight --docker” after Dockerfile change → container health check fails with port mismatch; shows log tail.

## 8. Acceptance criteria

- Executes the same stages, in the same order, as `ci.yml`.
- Makes no edits without `--fix`.
- Reports per-stage status and the first error with a reproduce command.

## 9. Target adaptation

### 9.1 Claude Code
`.claude/skills/preflight/SKILL.md`; replaces the legacy `preflight` skill from the old project.

### 9.2 Codex / AGENTS.md
`## Skill: preflight` listing the command sequence.

### 9.3 Universal
Run the listed commands in order, stop at first failure, summarize.

## 10. Materialization log

| Tool | Location | Built from spec v | Date |
|---|---|---|---|
| claude-code | .claude/skills/preflight/ | 1.1 | 2026-10-08 |
| codex | AGENTS.md#skill-preflight | — | — |

## 11. Changelog

- v1.1 — Real script names from Phase 1; added the boundary guard stage; status built.
- v1.0 — Initial draft from tech spec §15 pipeline.
