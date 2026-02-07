---
name: fsd-check
description: Check project structure for FSD (Feature-Sliced Design) compliance — layers, imports, public API
user_invocable: true
---

# /fsd-check [scope]

Audit the project structure for Feature-Sliced Design compliance.

## Arguments

- `structure` — Check that FSD layers exist in `src/` with correct segments
- `imports` — Check import dependencies between layers (no upward/sideways imports)
- `all` (default) — Run both structure and import checks

## Instructions

### 1. Structure Check (`structure` or `all`)

Verify the FSD directory structure under `src/`:

**Required layers** (check existence):
```
src/
├── app/           # Providers, global styles
├── pages/         # Page compositions
├── widgets/       # Self-contained UI blocks
├── features/      # Business logic / use cases
├── entities/      # Domain models
└── shared/        # Cross-cutting: api, ui, lib, config
```

**For each layer, check slices:**

Use `Glob` to find directories under each layer. For each slice, verify:
- [ ] Has `index.ts` or `index.tsx` (public API / barrel export)
- [ ] Uses standard segments: `ui/`, `model/`, `lib/`, `api/`, `config/` (not all required)
- [ ] No unexpected files at slice root (everything should be in a segment or `index.ts`)

**Expected slices** (from CrossQuest mapping):

| Layer | Expected slices |
|-------|----------------|
| `entities` | `user`, `crossword`, `category`, `game-session` |
| `features` | `auth`, `crossword-solver`, `onboarding-flow`, `game-history` |
| `widgets` | `public-header`, `public-footer`, `dashboard-footer`, `sidebar`, `dashboard-layout`, `bottom-nav` |
| `shared` | segments only: `api/`, `ui/`, `lib/`, `config/` |

Report missing layers and slices as warnings.

### 2. Import Check (`imports` or `all`)

Scan `src/` for TypeScript imports and validate the FSD layer dependency rule.

**Layer hierarchy** (index = priority, lower imports from higher index only):
```
0: app
1: pages
2: widgets
3: features
4: entities
5: shared
```

**Rules to check:**
1. A file in layer N may only import from layers with index > N
2. No cross-slice imports within the same layer (e.g., `features/auth` must not import from `features/crossword-solver`)
3. Imports from a slice must go through its `index.ts` public API, not deep into segments
4. `app/` (Next.js root) pages may import from `src/pages/` (this is the re-export pattern, allowed)

**How to check:**

Use `Grep` to search for import statements in `src/`:
```
pattern: ^import .+ from ['"]@/src/
```

For each import:
- Determine the source file's layer
- Determine the target's layer
- Flag violations (upward or sideways imports)

### 3. Output Report

Format results as:

```
## FSD Compliance Report

### Structure
✅ Layer: entities (4 slices)
⚠️ Layer: widgets (missing: bottom-nav)
❌ Layer: pages (not found)

### Slice Details
✅ entities/user — index.ts ✓, segments: model/, ui/
⚠️ entities/crossword — missing index.ts

### Import Violations
❌ src/features/auth/model/store.ts:5
   imports from src/features/crossword-solver/model/types.ts
   Rule: no cross-slice imports within same layer

❌ src/widgets/sidebar/ui/Sidebar.tsx:12
   imports from src/pages/dashboard/model/hooks.ts
   Rule: widgets cannot import from pages (upward dependency)

### Summary
- Structure: X/6 layers present, Y/Z slices valid
- Imports: N violations found
- Overall: [PASS | WARN | FAIL]
```

### Notes

- If `src/` directory doesn't exist yet, report that FSD migration hasn't started and list what needs to be created
- If the project is partially migrated, report progress percentage
- Suggest next migration steps based on findings
