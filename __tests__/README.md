# SwamIDesk Testing Structure

This directory contains all tests for the SwamIDesk clinic management system.

## Directory Structure

```
__tests__/
├── components/           # Component tests
│   ├── ui/              # UI component tests
│   └── layout/          # Layout component tests
├── pages/               # Page component tests
│   ├── admin/           # Admin page tests
│   ├── doctor/          # Doctor page tests
│   ├── receptionist/    # Receptionist page tests
│   ├── attendant/       # Attendant page tests
│   └── pharmacy/        # Pharmacy page tests
├── lib/                 # Library and utility tests
│   ├── auth/            # Authentication tests
│   ├── supabase/        # Database client tests
│   └── utils/           # Utility function tests
├── hooks/               # Custom hook tests
├── integration/         # Integration tests
│   ├── auth/            # Authentication flow tests
│   ├── realtime/        # Real-time feature tests
│   └── workflows/       # Multi-step workflow tests
└── e2e/                # End-to-end tests
    ├── auth/            # Authentication E2E tests
    ├── roles/           # Role-based access tests
    └── realtime/        # Real-time E2E tests
```

## Test Naming Conventions

- **Unit Tests**: `ComponentName.test.tsx`
- **Integration Tests**: `feature-name.integration.test.ts`
- **E2E Tests**: `workflow-name.e2e.test.ts`
- **Hook Tests**: `useHookName.test.ts`

## Test Categories

### 1. Component Tests
- Test individual React components
- Test component props and state
- Test user interactions
- Test accessibility

### 2. Integration Tests
- Test feature combinations
- Test API integrations
- Test database interactions
- Test authentication flows

### 3. Real-time Tests
- Test Supabase subscriptions
- Test multi-user scenarios
- Test data synchronization
- Test connection stability

### 4. E2E Tests
- Test complete user workflows
- Test role-based access
- Test multi-tab scenarios
- Test production-like conditions

## Test Utilities

### Authentication Helpers
```typescript
import { setupAuthenticatedTest, TEST_USERS } from '@/lib/test/auth-helpers'

// Setup test with specific role
const { user, session } = setupAuthenticatedTest('doctor')
```

### Supabase Mocking
```typescript
import { createMockSupabaseClient } from '@/lib/test/supabase-mock'

// Mock Supabase client with custom responses
const mockClient = createMockSupabaseClient({
  from: () => ({
    select: () => ({ data: mockPatients, error: null })
  })
})
```

### Real-time Testing
```typescript
import { realtimeTestUtils, createRealtimeHookMock } from '@/lib/test/realtime-mock'

// Simulate real-time database changes
realtimeTestUtils.simulateInsert('patients', newPatient)
```

## Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run specific test file
npm run test ComponentName.test.tsx

# Run tests with coverage
npm run test:coverage
```

## Writing Tests

### Basic Component Test
```typescript
import { render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import Button from '@/components/ui/button'

test('renders button with correct text', () => {
  render(<Button>Click me</Button>)
  expect(screen.getByRole('button')).toHaveTextContent('Click me')
})
```

### Real-time Hook Test
```typescript
import { renderHook, act } from '@testing-library/react'
import { expect, test } from 'vitest'
import { useRealtimeData } from '@/hooks/useRealtimeData'
import { realtimeTestUtils } from '@/lib/test/realtime-mock'

test('updates data on real-time changes', async () => {
  const { result } = renderHook(() => useRealtimeData('patients'))
  
  act(() => {
    realtimeTestUtils.simulateInsert('patients', { id: '1', name: 'John' })
  })
  
  expect(result.current.data).toContainEqual({ id: '1', name: 'John' })
})
```

### Authentication Test
```typescript
import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { setupAuthenticatedTest } from '@/lib/test/auth-helpers'
import DoctorDashboard from '@/app/doctor/dashboard/page'

test('doctor dashboard shows correct content', () => {
  setupAuthenticatedTest('doctor')
  
  render(<DoctorDashboard />)
  
  expect(screen.getByText('Doctor Dashboard')).toBeInTheDocument()
  expect(screen.getByText('Today\'s Consultations')).toBeInTheDocument()
})
```

## Best Practices

1. **Test Behavior, Not Implementation**
   - Test what users see and do
   - Avoid testing internal state directly

2. **Use Realistic Data**
   - Use mock data that resembles production data
   - Test edge cases and error conditions

3. **Clean Up After Tests**
   - Clean up subscriptions and timers
   - Reset mocks between tests

4. **Test Accessibility**
   - Use semantic queries (getByRole, getByLabelText)
   - Test keyboard navigation
   - Test screen reader compatibility

5. **Mock External Dependencies**
   - Mock Supabase client for predictable tests
   - Mock Next.js router for navigation tests
   - Mock timers for real-time testing

## Continuous Integration

Tests are automatically run on:
- Every pull request
- Every push to main branch
- Before deployment to production

The build will fail if:
- Any test fails
- Code coverage drops below threshold
- Linting errors are present