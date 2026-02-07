---
name: preflight
description: Run full CI pipeline - TypeScript, ESLint, Prettier, tests, and build check
user_invocable: true
---

# /preflight

Run the complete pre-commit/pre-push verification pipeline. Stops on first failure.

## Pipeline Steps (sequential, stop on failure)

Execute each step in order. If any step fails, stop and report the failure.

### Step 1: TypeScript Type Check

```bash
npx tsc --noEmit
```

### Step 2: ESLint

```bash
npm run lint
```

### Step 3: Prettier Format Check

```bash
npx prettier --check .
```

### Step 4: Tests

```bash
npx vitest run
```

### Step 5: Production Build

```bash
npm run build
```

## Output Format

After running (or stopping on failure), display a results table:

```
Preflight Results
─────────────────────────────
 Step          Status
─────────────────────────────
 TypeScript    PASS ✓ / FAIL ✗
 ESLint        PASS ✓ / FAIL ✗ / SKIP
 Prettier      PASS ✓ / FAIL ✗ / SKIP
 Tests         PASS ✓ / FAIL ✗ / SKIP
 Build         PASS ✓ / FAIL ✗ / SKIP
─────────────────────────────
 Result: ALL PASSED / FAILED at step N
```

- Mark steps that weren't reached as `SKIP`
- If a step fails, show the relevant error output before the table
- If all steps pass, congratulate — the code is ready to ship

## Notes

- This is the same pipeline that should pass before any push to main
- The build step is the most time-consuming (may take 30-60 seconds)
- TypeScript check runs first because it catches the most fundamental issues
