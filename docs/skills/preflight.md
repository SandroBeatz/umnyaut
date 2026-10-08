---
spec_version: 1.0
date: 2026-10-08
status: draft
skill_slug: preflight
skill_name: Preflight
targets: [claude-code, codex, universal]
---

# Preflight — Skill Specification

> Spec v1.0 · 2026-10-08 · status: draft · [Skills index](../README.md)

Status is `draft` until the monorepo exists and the exact script names are known.

## 1. Purpose

Runs locally the same chain CI runs on a PR, so failures are caught before pushing: Biome, Steiger, typecheck, tests, `next build`, server-HTML guard, and optionally the Docker image smoke test. Reports a concise pass/fail summary with the first actionable error per step.

## 2. When to trigger

Should trigger: «прогони проверки», “run preflight”, “is this ready to push?”, “check CI locally”, before creating a PR.

Should NOT trigger: a single failing test investigation (debug directly); release readiness of a tool (`calculator-release-check`); deploying.

## 3. Inputs

Optional scope (`--affected` default via Turborepo, or `--all`), optional `--docker` flag.

## 4. Outputs

```
Preflight (affected: calc, web)
✅ biome   ✅ steiger   ✅ tsc   ❌ test (calc: golden.test.ts › zatirka has 9 examples)   ⏭ build   ⏭ docker
```

No file modifications unless the user asks for `--fix` (Biome autofix only).

## 5. Workflow

1. `pnpm install --frozen-lockfile` if lockfile changed.
2. `pnpm turbo run lint typecheck test --filter=...[origin/develop]` (Biome, Steiger, `tsc --noEmit`, Vitest).
3. `pnpm turbo run build --filter=web`.
4. Server-HTML guard script against build output.
5. With `--docker`: build `apps/web/Dockerfile`, run container, hit `/api/health`.
6. Stop at first failing stage, print the first error and the command to reproduce.

## 6. Resources

Root `package.json` scripts and `turbo.json` (to be created in milestone 1.1); `.github/workflows/ci.yml` must stay in sync with this sequence.

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
| claude-code | .claude/skills/preflight/ | — | — |
| codex | AGENTS.md#skill-preflight | — | — |

## 11. Changelog

- v1.0 — Initial draft from tech spec §15 pipeline.
