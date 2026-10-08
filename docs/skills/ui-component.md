---
spec_version: 1.0
date: 2026-10-08
status: built
skill_slug: ui-component
skill_name: UI Component
targets: [claude-code, codex, universal]
---

# UI Component — Skill Specification

> Spec v1.0 · 2026-10-08 · status: built · [Skills index](../README.md)

## 1. Purpose

Builds or changes a React component (base component in `packages/ui` or an FSD slice in `apps/web/src`) that matches the UmnyAut design system exactly: semantic tokens only, Onest scale, 48 px tap targets, contrast rules, motion curve, accessibility, and the “nothing above the result” principle. Replaces the old project's `scaffold-component` skill.

## 2. When to trigger

Should trigger: «сделай компонент числового поля», “build the sticky result bar”, “add `MaterialThumb`”, “create the cookie banner”, “implement the RoomBar widget”, “lay out the home hero from the mockup”.

Should NOT trigger: formula changes (`new-calculator`); page text (`tool-content`); visual mockups in Figma (use Figma skills); global token changes without a design decision (ask first).

## 3. Inputs

Component name and purpose; the relevant section of `docs/design/design-system.md` / design spec §11; the mockup screen if one exists (`docs/specs/UmnyAut — макеты ключевых экранов.html`); FSD layer target.

## 4. Outputs

- Component file(s) in the right layer (`packages/ui/src/<name>/` or `apps/web/src/<layer>/<slice>/`) with a public `index.ts`.
- Testing Library test for interactive behaviour.
- No Russian strings inside the component — props or `catalog`.

## 5. Workflow

1. Decide placement: generic primitive → `packages/ui` (imports nothing from the project); product-aware block → `apps/web/src/widgets|features|entities` respecting FSD direction.
2. Read the component's spec row (size, states, tokens). Check the mockup for spacing.
3. Implement with Tailwind classes bound to semantic tokens (`bg-[--color-surface]` / theme utilities), never raw hex. Heights: 56 px primary on phone, 48 px default, 40 px desktop-only secondary. Radius tokens. Icons from `lucide-react` per-icon import.
4. States: default, hover, pressed, focus (2 px ring + 2 px offset), disabled (40% opacity), loading (spinner replaces arrow, width fixed).
5. Accessibility: visible label, `aria-*`, keyboard path, focus trap for sheets/dialogs, `aria-live="polite"` for results, meaning not by colour alone.
6. Motion: durations from the spec, curve `cubic-bezier(0.2,0,0,1)`, respect `prefers-reduced-motion`.
7. Numbers: `tabular-nums`, formatting via shared `formatNumber`/`Intl` helpers.
8. Check orange usage (one per view; text on orange is navy), mascot rules, CLS (reserve size).
9. Write tests; run Steiger + typecheck.

## 6. Resources

`docs/design/design-system.md`, `docs/ui/calculator-shell-and-pages.md`, mockups HTML, shadcn/ui docs (via Context7), `frontend-design` skill for aesthetics.

## 7. Examples

- “Build the numeric length field” → `packages/ui/src/number-field/`: 56 px height, value 18/600, unit suffix subtle, `inputMode="decimal"`, comma/dot parsing, validate on blur, error text below; tests for comma, empty, paste.
- “Sticky result bar” → `apps/web/src/widgets/result-panel/StickyResultBar.tsx`: < 1024 px only, 56 px + safe area, `--shadow-lg`, z 40, IntersectionObserver on `ResultPanel`, tap scrolls to result, sits above cookie banner.

## 8. Acceptance criteria

- No hex colours or arbitrary font sizes outside tokens/scale.
- Interactive elements ≥ 48 × 48 px; focus ring visible.
- No Russian literals in the component.
- Steiger passes (no upward FSD imports); `packages/ui` imports nothing from the project.
- Tests cover the main interaction.

## 9. Target adaptation

### 9.1 Claude Code
`.claude/skills/ui-component/SKILL.md`; may delegate to the `frontend-builder` agent; pairs with `frontend-design` and Figma skills when a design file exists.

### 9.2 Codex / AGENTS.md
`## Skill: ui-component` with placement rules and checklist.

### 9.3 Universal
Follow the workflow and checklist using the design-system doc as the source of values.

## 10. Materialization log

| Tool | Location | Built from spec v | Date |
|---|---|---|---|
| claude-code | .claude/skills/ui-component/ | 1.0 | 2026-10-08 |
| codex | AGENTS.md#skill-ui-component | — | — |

## 11. Changelog

- v1.0 — Initial spec from design spec §3–15 and tech spec §4, §6.
