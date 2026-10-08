---
name: preflight
description: Run UmnyAut's CI chain locally before pushing — Biome, boundary guard, Steiger, tsc, Vitest, next build (and later the server-HTML guard and Docker smoke test) — and report per-stage pass/fail with the first actionable error. Use when the user says «прогони проверки», «проверь перед пушем», "run preflight", "is this ready to push?", "check CI locally", or before creating a PR. Do NOT use to debug a single failing test (debug directly), for a tool's release readiness (calculator-release-check), or for deploying.
---

# Preflight

Runs the same stages, in the same order, as CI, stops at the first failing stage and reports. Makes **no edits** unless the user passes `--fix` (then only `pnpm format`, Biome autofix).

Source spec: `docs/skills/preflight.md`. Keep this sequence in sync with `.github/workflows/ci.yml` once it exists (Phase 2, P2.4).

## Inputs

- Scope: `--affected` (default; Turborepo filter against `origin/develop`) or `--all`.
- `--fix`: run Biome autofix first.
- `--docker`: also build and smoke-test the prod image (available after P2.1).

## Environment

Node 24 (`.nvmrc`) and pnpm 12 via corepack. If `node -v` is not 24.x, run commands after `source ~/.nvm/nvm.sh && nvm use` (or the user's version manager). Never use `npm`/`npx` for project scripts.

## Workflow

1. If `pnpm-lock.yaml` changed vs `origin/develop` or `node_modules` is missing: `pnpm install --frozen-lockfile`.
2. `--fix` only: `pnpm format`.
3. **biome** — `pnpm lint`
4. **guard** — `pnpm guard` (import boundaries, `server-only` first line, calc purity, FSD layer order incl. `views`)
5. **steiger** — `pnpm steiger`
6. **tsc + test** — affected: `pnpm turbo run typecheck test --filter='...[origin/develop]'`; all: `pnpm turbo run typecheck test`
7. **build** — `pnpm turbo run build --filter=web`
8. **html** — server-HTML guard against the build output (skip with ⏭ until P5.10 adds the script).
9. **docker** — only with `--docker`: `docker build -f apps/web/Dockerfile .`, run the container, `curl -f http://localhost:3000/api/health` (skip with ⏭ until P2.1/P2.3 exist).

Stop at the first failing stage; mark the rest ⏭.

## Output

One status line, then the first error of the failing stage and the command to reproduce:

```
Preflight (affected: calc, web)
✅ biome   ✅ guard   ✅ steiger   ❌ tsc+test   ⏭ build   ⏭ html   ⏭ docker

@umnyaut/calc test — golden.test.ts › zatirka has 9 examples (needs ≥ 10)
Reproduce: pnpm --filter @umnyaut/calc test
```

All green: the status line plus total time. Don't paste full logs.
