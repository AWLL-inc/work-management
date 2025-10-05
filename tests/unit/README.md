# Unit Tests

This directory contains unit tests for utilities, components, and pure functions.

## Structure
- Test files should be named `*.test.ts` or `*.test.tsx`
- Keep unit tests close to the code they test when possible (using `__tests__` directories)
- Use this directory for shared utilities and helpers

## Guidelines
- Test one unit of functionality at a time
- Mock external dependencies
- Keep tests fast and isolated
- Aim for high code coverage (95%+)

## Running Tests
```bash
npm test                 # Run all unit tests
npm run test:watch       # Run in watch mode
npm run test:coverage    # Generate coverage report
```
