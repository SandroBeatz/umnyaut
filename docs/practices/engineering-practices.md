---
version: 1.0
date: 2026-10-08
category: practices
---

# Engineering Practices

> Version 1.0 · 2026-10-08 · [Practices](../practices/)

## Overview

Conventions for a one-developer, 8–10 h/week project where AI agents do a large share of implementation. Rules are chosen so that acceptance can be **checked automatically** (tests, schemas, Lighthouse thresholds) rather than by memory.

## Rules

### Stack and tooling

TypeScript `strict` · Next.js 16 App Router, React 19.2 + React Compiler · Tailwind CSS 4 · shadcn/ui on Radix (copied into `packages/ui`) · Zustand (persist) for room/settings only · Zod for all inputs, API bodies, AI responses, env, frontmatter · Vitest + fast-check + Testing Library + Playwright · **Biome** (lint + format), **Steiger** (FSD), `tsc --noEmit` · pnpm workspaces + Turborepo, Node.js 24 LTS. Versions: latest stable on start day, pinned by lockfile. Check current APIs via Context7 before using a library.

### Code rules

- Import boundaries from [Architecture Overview](../architecture/overview.md) are absolute. `calc` imports only Zod; no `Date.now()`, `Math.random()`, `fetch` inside it.
- Every `apps/web/server/**` file starts with `import "server-only"`.
- No Vercel-only APIs. Post-response work via `after()` through the platform layer.
- No `cookies()`/`headers()` in indexable pages.
- No Russian UI strings in components — they live in `catalog` / `content`.
- Lengths in integer mm inside `calc`; packs rounded up only via `ceilPacks()`.
- `compute()` never throws on schema-valid input — return warnings.
- One tool id everywhere (module, URL, content file, analytics).
- Code identifiers English or transliteration; comments sparse and in English.

### Testing strategy

| Level | Tool | Checks |
|---|---|---|
| Formulas | Vitest, fast-check | ≥ 10 golden examples per tool (build fails otherwise); invariants; ≥ 95% line coverage in `calc` |
| Registry & content | Vitest | Each tool has module + registry entry + text + 10 examples; unique URLs; links point to existing tools; frontmatter schema; ≤ 4 `main` fields; reserved segments unused |
| Components | Vitest + Testing Library | Numeric field (comma, empty, paste); shell input priority |
| API | Vitest + local Supabase | Project CRUD, `editToken`, limits, Telegram signature |
| Server HTML | Script | No-JS HTML has title, one H1, canonical, text, result numbers |
| E2E | Playwright, phone viewport | Laminate calc; room → plinth; save & open project; `?s=` link; error report |
| Performance | Lighthouse CI | Thresholds below on home, tool, planner |

### Performance budget (tool page, mobile Lighthouse)

LCP ≤ 2.0 s · INP ≤ 200 ms · CLS ≤ 0.05 · first-screen JS ≤ 150 KB gzip · CSS ≤ 15 KB gzip · ≤ 2 font files (we use 1) · zero third-party domains before interaction · Lighthouse perf ≥ 90, SEO 100, a11y ≥ 95 · images ≤ 15 KB on phone first screen, ≤ 80 KB per page.

### Git workflow

- `main` → prod (VPS). `develop` → staging (Vercel). Feature branches → PR into `develop` (Vercel preview per PR). Release = PR `develop` → `main`.
- Conventional-ish commit messages (`feat:`, `fix:`, `chore:`, `docs:`, `test:`), referencing the GitHub Project item where possible.
- Migrations backward compatible; never edit an applied migration.

### Definition of done — calculator

Meets standard requirements 1–14 (+15/16 where applicable) · five files present · ≥ 10 golden examples with sources · text 300–600 words with frontmatter passing schema · Lighthouse thresholds pass · events arrive · manually checked on a real phone.

**Cannot be postponed:** formula tests, server HTML, Docker image build in CI. **Can be postponed:** layout schemes, per-tool OG images, `report:weekly`, multi-region uptime checks.

### Working with AI agents

A calculator is the ideal agent work unit: input = contract (calc-engine doc) + norm sources + 10 golden examples; output = five files; acceptance is automatic. The root `AGENTS.md` carries the rules every session must start with. Skill and agent specs live in `docs/skills/` and `docs/agents/`.

## Cross-references

- [Architecture Overview](../architecture/overview.md)
- [Calculation Engine](../code/calc-engine.md)
- [Environments and CI/CD](../deploy/environments-and-ci.md)
- [Design System](../design/design-system.md) — accessibility rules
- Skill specs: [preflight](../skills/preflight.md), [calculator-release-check](../skills/calculator-release-check.md)
- Agent spec: [code-reviewer](../agents/code-reviewer.md)
