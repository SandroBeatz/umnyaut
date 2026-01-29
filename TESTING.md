# Testing Documentation

## Overview

This project uses **Jest** and **React Testing Library** for testing React components.

## Setup

All testing dependencies are already installed. The following packages are configured:

- `jest`: Testing framework
- `@testing-library/react`: React component testing utilities
- `@testing-library/jest-dom`: Custom Jest matchers for DOM testing
- `@testing-library/user-event`: User event simulation
- `jest-environment-jsdom`: DOM environment for Jest

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

Tests are located in `__tests__` directories next to the components they test:

```
src/
  components/
    __tests__/
      BottomNav.test.tsx
    BottomNav.tsx
```

## Example Test

See `src/components/__tests__/BottomNav.test.tsx` for a reference implementation. This test demonstrates:

- Basic component rendering
- User interaction simulation (button clicks)
- Prop validation
- Class name assertions for styling

## Writing New Tests

1. Create a test file with `.test.tsx` extension
2. Import the component to test
3. Use `describe` blocks to group related tests
4. Use `it` or `test` for individual test cases
5. Use `render` from `@testing-library/react` to render components
6. Use `screen` queries to find elements
7. Use `fireEvent` or `userEvent` to simulate interactions
8. Use `expect` assertions to verify behavior

### Example Template

```typescript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interaction', () => {
    const mockHandler = jest.fn();
    render(<MyComponent onClick={mockHandler} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(mockHandler).toHaveBeenCalledTimes(1);
  });
});
```

## Best Practices

1. **Test behavior, not implementation**: Focus on what the component does, not how it does it
2. **Use semantic queries**: Prefer `getByRole`, `getByLabelText`, `getByText` over `getByTestId`
3. **Mock external dependencies**: Mock API calls, localStorage, and other browser APIs
4. **Keep tests isolated**: Each test should be independent and not rely on others
5. **Test user flows**: Simulate real user interactions rather than testing internal state

## Coverage Goals

Aim for:
- Critical components: 80%+ coverage
- Utility functions: 90%+ coverage
- Overall project: 70%+ coverage

Run `npm run test:coverage` to see current coverage reports.

## Continuous Integration

Tests are automatically run in CI/CD pipelines. All tests must pass before merging to main branch.
