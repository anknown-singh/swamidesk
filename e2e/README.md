# SwamIDesk E2E Testing with Playwright

This directory contains end-to-end tests for the SwamIDesk clinic management system using [Playwright](https://playwright.dev/).

## Overview

The E2E tests cover the complete user workflows across different roles in the clinic management system:

- **Authentication flows** for all 5 user roles
- **Queue management** workflows between receptionists and doctors
- **Navigation** and routing across the application
- **Multi-user scenarios** with real-time updates
- **Mobile responsiveness** testing

## Test Structure

```
e2e/
├── fixtures/
│   └── auth.ts           # Authentication fixtures for different user roles
├── tests/
│   ├── auth.spec.ts      # Authentication flow tests
│   ├── queue-management.spec.ts  # Queue management workflow tests
│   └── navigation.spec.ts        # Navigation and routing tests
├── global-setup.ts       # Global test setup
├── global-teardown.ts    # Global test cleanup
└── README.md            # This file
```

## User Roles Tested

The tests cover all 5 user roles in the SwamIDesk system:

1. **Admin** - Full system access and user management
2. **Doctor** - Patient consultations and medical records
3. **Receptionist** - Patient registration and queue management
4. **Attendant** - Service queue and procedure management
5. **Pharmacist** - Medicine inventory and prescription dispensing

## Running Tests

### Prerequisites

1. Ensure the development server is running:
   ```bash
   npm run dev
   ```

2. Install Playwright browsers (if not already installed):
   ```bash
   npx playwright install
   ```

### Available Test Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug tests step by step
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

### Running Specific Tests

```bash
# Run only authentication tests
npx playwright test auth.spec.ts

# Run only queue management tests
npx playwright test queue-management.spec.ts

# Run tests for specific browser
npx playwright test --project=chromium

# Run tests for mobile
npx playwright test --project="Mobile Chrome"
```

## Test Configuration

The tests are configured in `playwright.config.ts` with:

- **Cross-browser testing**: Chrome, Firefox, Safari, Edge
- **Mobile testing**: iPhone and Android viewports
- **Automatic retries** on CI environments
- **Screenshots and videos** on test failures
- **Trace collection** for debugging

## Authentication Testing

The authentication fixtures in `fixtures/auth.ts` provide pre-authenticated page contexts for each user role:

```typescript
test('receptionist workflow', async ({ receptionistPage }) => {
  // receptionistPage is already authenticated as a receptionist
  await receptionistPage.goto('/receptionist/queue')
  // ... test receptionist-specific functionality
})
```

## Multi-User Testing

The E2E tests can simulate multiple users interacting with the system simultaneously:

```typescript
test('queue updates across roles', async ({ receptionistPage, doctorPage }) => {
  // Test real-time updates between receptionist and doctor views
  // Both pages are authenticated and can interact with the system
})
```

## Best Practices

1. **Page Objects**: Consider creating page object models for complex workflows
2. **Test Data**: Use consistent test data that matches the database seeding utilities
3. **Waiting**: Use `waitForLoadState('networkidle')` to ensure pages are fully loaded
4. **Assertions**: Use Playwright's built-in expect assertions for better error messages
5. **Screenshots**: Tests automatically capture screenshots on failures for debugging

## Debugging Tests

### Visual Debugging
```bash
# Run with UI mode to see tests execute in real-time
npm run test:e2e:ui

# Run in headed mode to see the browser
npm run test:e2e:headed
```

### Step-by-Step Debugging
```bash
# Debug specific test with breakpoints
npm run test:e2e:debug -- auth.spec.ts
```

### Trace Viewer
After test failures, view traces for detailed debugging:
```bash
# View trace for failed test
npx playwright show-trace test-results/.../trace.zip
```

## CI/CD Integration

The tests are configured for CI environments with:
- Reduced parallelism for stability
- Automatic retries on failures
- GitHub Actions reporter
- Artifact collection for failed tests

## Real-Time Testing

The E2E tests are designed to work with the real-time features of SwamIDesk:
- Queue updates between users
- Live status changes
- Multi-user concurrent workflows

## Mobile Testing

Tests include mobile-specific scenarios:
- Responsive navigation
- Touch interactions
- Mobile-specific UI elements
- Different viewport sizes

## Troubleshooting

### Common Issues

1. **Development server not running**
   ```bash
   npm run dev
   ```

2. **Playwright browsers not installed**
   ```bash
   npx playwright install
   ```

3. **Port conflicts**
   - Ensure port 3000 is available
   - Or update the `baseURL` in `playwright.config.ts`

4. **Test timeouts**
   - Increase timeout in `playwright.config.ts`
   - Check for slow network requests
   - Ensure proper `waitForLoadState` usage

### Getting Help

- Check the [Playwright documentation](https://playwright.dev/docs/intro)
- Review test reports with `npm run test:e2e:report`
- Use trace viewer for detailed debugging
- Check console logs in browser dev tools during headed runs