# Integration Tests

This directory contains integration tests for API routes, database operations, and multi-component interactions.

## Structure
- Test files should be named `*.integration.test.ts`
- Group tests by feature or API endpoint
- Use test database or mock database when appropriate

## Guidelines
- Test how components work together
- Include database transactions
- Test API endpoints with real HTTP requests
- Verify data flow between layers

## Running Tests
```bash
npm test                          # Run all tests including integration
npm test -- tests/integration     # Run only integration tests
```
