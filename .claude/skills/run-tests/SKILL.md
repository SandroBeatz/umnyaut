---
name: run-tests
description: Run Vitest tests for the project, optionally targeting specific files
user_invocable: true
---

# /run-tests [file] [--verbose]

Run Vitest tests for the CrossQuest project.

## Arguments

- No arguments — Run all tests
- `<file>` — Run tests for a specific file (e.g., `types.test.ts`, `crosswordApi`)
- `--verbose` — Run with verbose output

## Instructions

### Run all tests:

```bash
npx vitest run
```

### Run specific file:

```bash
npx vitest run <file>
```

### Run with verbose output:

```bash
npx vitest run --reporter=verbose
```

### Run specific file with verbose:

```bash
npx vitest run <file> --reporter=verbose
```

## After Running

1. Report the test results summary (passed/failed/skipped counts)
2. If tests failed, show the failure details with file and line numbers
3. If all tests passed, confirm with a brief summary

## Notes

- Config is in `/vitest.config.ts`
- Environment: jsdom with globals enabled
- Path alias: `@/*` maps to project root
- Setup file: `/vitest.setup.ts`
- Test files follow pattern: `*.test.ts` or `*.test.tsx`
