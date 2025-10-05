# End-to-End Tests

This directory contains E2E tests using Playwright.

## Structure
- Test files should be named `*.spec.ts`
- Organize by user flows or features
- Use Page Object Model pattern for complex pages

## Guidelines
- Test complete user workflows
- Test from the user's perspective
- Cover critical paths and happy paths
- Test across different browsers

## Running Tests
```bash
npm run test:e2e          # Run all E2E tests
npm run test:e2e:ui       # Run with Playwright UI
npm run test:e2e:debug    # Run in debug mode
```

## Browser Configuration
Tests run on:
- Chromium (Desktop Chrome)
- Firefox (Desktop Firefox)
- WebKit (Desktop Safari)
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

See `playwright.config.ts` for full configuration.
