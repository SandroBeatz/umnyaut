---
name: lint-fix
description: Run ESLint and Prettier to check or auto-fix code style issues
user_invocable: true
---

# /lint-fix [check|fix]

Run ESLint and Prettier for code quality and formatting.

## Arguments

- `check` (default) — Check for issues without modifying files
- `fix` — Auto-fix all fixable issues

## Instructions

### For `check` (or no argument):

Run both checks and report results:

1. **ESLint check**:

   ```bash
   npm run lint
   ```

2. **Prettier check**:

   ```bash
   npx prettier --check .
   ```

3. Report the combined results: how many files have issues, what kinds of issues

### For `fix`:

Run auto-fix for both tools:

1. **ESLint fix**:

   ```bash
   npx next lint --fix
   ```

2. **Prettier fix**:

   ```bash
   npm run format
   ```

3. After fixing, run the checks again to verify everything is clean
4. Report what was fixed and if any issues remain that need manual attention

## Notes

- ESLint config extends `next/core-web-vitals` and `prettier`
- Prettier is configured in the project root
- `npm run format` runs `prettier --write .`
- `npm run lint` runs `next lint`
