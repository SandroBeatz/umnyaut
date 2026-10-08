---
version: 1.0
date: 2026-10-08
category: plan
---

# Progress Log

> Version 1.0 · 2026-10-08 · [Plan](../plan/)

## Overview

A dated journal of every finished step on UmnyAut: what was done, where it landed (branch, commit, PR, deploy) and which plan task it closes. The [Development Plan](./development-plan.md) says **what** must be done; this log says **what actually happened and when**, including steps that deviated from the plan or were not in it at all.

The log exists so that anyone — the owner, a new contributor, or an AI agent starting a fresh session — can reconstruct the project's state without reading the whole git history or chat transcripts.

## Rules

1. **Every finished step gets an entry** — code, docs, infra, account setup, a decision. If it changed the project state, it is logged.
2. **Same change set as the work.** The entry is added in the same commit (or PR) as the step itself. Steps with no commit (an account created, a Vercel setting changed) get an entry in the next docs commit.
3. **Tick the plan.** If the step closes a task, tick its checkbox in [development-plan.md](./development-plan.md) in the same change. A partially done task stays unticked; the entry says what is left.
4. **Newest first.** One `###` heading per day (`YYYY-MM-DD`), entries below it in the order they happened.
5. **Deviations are explicit.** If a step was done differently from the plan or the reference docs, the entry has a **Deviation** line saying what differs and whether the docs need updating.
6. **No secrets.** Never paste keys, tokens or passwords — name the store they went into instead.
7. Entries are short: one line of what + a few labelled lines. Details belong in the commit message, PR or reference docs; link to them.

## Data Model

Each entry:

```markdown
- **<Plan ID or —>** <what was done, one line>
  - Where: <branch> · <commit/PR> · <deploy/environment, if any>
  - Notes: <what is left, follow-ups> (optional)
  - Deviation: <how it differs from plan/docs> (optional)
```

- **Plan ID** — task ID from the Development Plan (`P0.2`, `P5.4`), several separated by commas, or `—` for unplanned work.
- **Where** — short commit SHA (7 chars), PR number, and the environment it reached (`staging`, `prod`, `Vercel`).

## Log

### 2026-10-08

- **P0.1** Reset the repo for UmnyAut: removed the old crossword project, added `docs/` (reference docs, skill and agent specs, plan), `AGENTS.md`, `CLAUDE.md`; built skills and agents.
  - Where: `develop` · `1b73084`
- **—** Merged the legacy remote `develop` history into the new tree, keeping only the UmnyAut files, so no force-push is needed.
  - Where: `develop` · `1676307`
- **—** Static staging stub page: `stub/index.html` (design-system tokens, Onest, mascot `hello` in AVIF/WebP, wave-1 tool list, laminate example) served by root `vercel.json` (no build, `outputDirectory: stub`, `X-Robots-Tag: noindex`).
  - Where: `develop` · `f262dca`
  - Notes: delete `stub/` and `vercel.json` when the Next.js app lands (Phase 1–2); then set the Vercel Root Directory to `apps/web`.
- **P0.2 (partly)** Fast-forwarded `main` to `develop` (old crossword code dropped from `main`, history kept) and pushed both branches. Vercel project settings adjusted by the owner; the stub is live.
  - Where: `main` = `develop` = `f262dca` · Vercel (production branch `main`)
  - Notes: P0.2 still open — archive the old remote branch as `legacy/develop` (or decide it is unnecessary now that its history is merged).
  - Deviation: per [Environments and CI/CD](../deploy/environments-and-ci.md), Vercel serves `develop` (staging) and `main` goes to the VPS. Until the VPS exists (P0.6, Phase 2), Vercel deploys from `main`; switch the production branch to `develop` when the VPS pipeline is set up.

## Cross-references

- [Development Plan](./development-plan.md) — the task list and IDs this log references
- [Accounts and Services](./accounts-and-services.md) — account IDs (`A…`) mentioned in entries
- [Environments and CI/CD](../deploy/environments-and-ci.md) — target branch → environment mapping that deviations are measured against
- [Engineering Practices](../practices/engineering-practices.md) — git workflow and commit conventions
