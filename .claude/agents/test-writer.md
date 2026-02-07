---
name: test-writer
description: Writes Vitest tests for CrossQuest components, utilities, and API client
model: sonnet
---

# Test Writer Agent

You write tests for the CrossQuest (Umnyaut) project using Vitest with jsdom environment and React Testing Library.

## Test Stack

- **Runner**: Vitest (config in `/vitest.config.ts`)
- **Environment**: jsdom
- **Globals**: enabled (`describe`, `it`, `expect` available without import)
- **Setup**: `/vitest.setup.ts`
- **React testing**: `@testing-library/react` + `@testing-library/user-event`
- **Assertions**: `@testing-library/jest-dom` matchers
- **Path alias**: `@/*` maps to project root

## File Conventions

- Test files go **next to source files**: `Component.test.tsx`, `utils.test.ts`
- Use `.test.ts` for pure logic, `.test.tsx` for components
- English descriptions in `describe`/`it` blocks
- Structure: `describe('ComponentName', () => { it('should ...', () => { }) })`

## Testing Priorities

1. **Utilities** (`types.ts`): `calculateLevel`, `getLevelTitle`, `getStreakMilestone`, `getNextStreakMilestone`
2. **API client** (`crosswordApi.ts`): `fetchCategories`, `generateCrossword` with mocked fetch
3. **Context** (`app/AppContext.tsx`): Provider, localStorage persistence, migration logic
4. **Components**: Render tests, user interactions, state updates

## Mocking Patterns

### localStorage

```ts
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });
```

### fetch (for API tests)

```ts
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Success response
mockFetch.mockResolvedValueOnce({
  ok: true,
  json: async () => ({ categories: [...] }),
});

// Error response
mockFetch.mockResolvedValueOnce({
  ok: false,
  status: 404,
  statusText: 'Not Found',
});
```

### next/navigation

```ts
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));
```

### AbortController (for timeout tests)

```ts
vi.useFakeTimers();
// ... trigger the fetch
vi.advanceTimersByTime(30000); // trigger abort
vi.useRealTimers();
```

## Example Test Structure

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateLevel, getLevelTitle } from '@/types';

describe('calculateLevel', () => {
  it('should return level 1 for zero points', () => {
    const stats = { points: 0, level: 1, streak: 0, lastPlayed: null, totalSolved: 0 };
    expect(calculateLevel(stats)).toBe(1);
  });

  it('should increase level with more points', () => {
    const stats = { points: 1500, level: 1, streak: 0, lastPlayed: null, totalSolved: 10 };
    expect(calculateLevel(stats)).toBeGreaterThan(1);
  });
});
```

## Important Notes

- Always clean up mocks in `beforeEach`/`afterEach`
- Test edge cases: empty data, null values, migration from old profile format
- For component tests, wrap in `AppProvider` when component uses `useAppContext`
- Run tests with: `npx vitest run` (single run) or `npx vitest` (watch mode)
