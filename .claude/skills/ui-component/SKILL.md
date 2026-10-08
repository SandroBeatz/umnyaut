---
name: ui-component
description: Build or change an UmnyAut React component — a base component in packages/ui or an FSD slice in apps/web/src — exactly per the design system (semantic tokens, Onest scale, 48 px tap targets, one orange element, a11y, motion, "nothing above the result"). Use when the user asks «сделай компонент числового поля», "build the sticky result bar", "add MaterialThumb", "create the cookie banner", "implement the RoomBar widget", "lay out the home hero from the mockup", or any shell block / page section. Do NOT use for formula changes (new-calculator), page text (tool-content), Figma mockups (Figma skills), or global token changes without a design decision (ask first).
---

# UI Component

Source spec: `docs/skills/ui-component.md` (v1.0). Values: `docs/design/design-system.md`; blocks and routes: `docs/ui/calculator-shell-and-pages.md`; full detail: design spec §11–15 in `docs/specs/`; mockups: `docs/specs/UmnyAut — макеты ключевых экранов.html` (self-unpacking bundle, open in a browser). For larger screens delegate to the `frontend-builder` agent if available; pair with `frontend-design` for aesthetics.

## Workflow

1. **Placement.**
   - Generic primitive → `packages/ui/src/<name>/` (imports nothing from the project).
   - Product-aware → `apps/web/src/{widgets|features|entities|shared}/<slice>/` with a public `index.ts`. FSD imports only downward: views → widgets → features → entities → shared. `src/` never imports `server/`.
2. **Spec + mockup.** Read the component's row (size, states, tokens) and match mockup spacing. Where mockup and spec differ, the spec wins — mention it.
3. **Implement** with Tailwind bound to semantic tokens (`--color-*`, `--radius-*`, `--shadow-*`) — never raw hex or off-scale font sizes.
   - Heights: 56 px primary on phone (full width), 48 px default, 40 px desktop-only secondary.
   - Inputs: 56 px, value 18/600, `inputMode="decimal"`, comma and dot, unit suffix in `--color-text-subtle`, validate on blur, error text below (result stays with “по прошлым значениям”).
   - Icons: `lucide-react`, per-icon imports, 16/20/24, `currentColor`.
4. **States**: default, hover, pressed, focus (2 px ring + 2 px offset), disabled (40% opacity), loading (spinner replaces arrow, width fixed).
5. **Colour rules**: teal = actions/selected; one orange element per view, text on orange is navy `--color-on-accent`; orange 500 never as text on white; on mint use teal 700.
6. **Accessibility**: visible label, `aria-*`, keyboard path, focus trap + Esc in sheets/dialogs, `aria-live="polite"` on results, meaning never by colour alone, `rem` units.
7. **Motion**: 120 (hover) / 150 (result number) / 200 (accordion, sticky, toast) / 320 ms (sheet), `cubic-bezier(0.2,0,0,1)`, respect `prefers-reduced-motion`.
8. **Numbers**: `tabular-nums`; shared formatting helpers (`Intl`), decimal comma, NBSP thousands, «4,6 × 4,3 м».
9. **Layout rules**: nothing above the result; reserve size for async content (CLS ≤ 0.05); mascot never adds height on tool pages; z-index: header 30, sticky result 40, cookie 50, sheets 60, toasts 70.
10. **Strings**: no Russian literals in components — props or `catalog`/`content`.
11. **Test** main interaction with Testing Library; run Steiger + `tsc`. Visually check 390 px and 1440 px when a dev server exists.

## Acceptance checklist

- [ ] No hex colours / off-scale sizes outside tokens
- [ ] Interactive elements ≥ 48 × 48 px, focus ring visible
- [ ] No Russian literals in the component
- [ ] Steiger passes; `packages/ui` imports nothing from the project
- [ ] Tests cover the main interaction
