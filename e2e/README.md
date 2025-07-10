# E2E Tests for Sistema de Monitoria IC

## Overview

This directory contains end-to-end tests for the university monitoring system using Playwright.

## Test Structure

### Test Files

- **basic-connectivity.spec.ts** - Basic application connectivity and CAS integration
- **visual-ui-tests.spec.ts** - UI component rendering and visual elements
- **complete-e2e-flow.spec.ts** - Full application flow testing
- **performance-tests.spec.ts** - Page load and performance validation
- **accessibility-tests.spec.ts** - Accessibility compliance testing
- **smoke-tests.spec.ts** - Essential functionality smoke tests

### Utility Files

- **utils/auth.ts** - Authentication helpers and test user data
- **utils/db-setup.ts** - Database setup utilities (currently unused)

## Running Tests

### All Tests
```bash
npm run test:e2e
```

### Specific Browser
```bash
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=firefox
npm run test:e2e -- --project=webkit
```

### Mobile Tests
```bash
npm run test:e2e -- --project=mobile-chrome
npm run test:e2e -- --project=mobile-safari
```

### Interactive Mode
```bash
npm run test:e2e:ui
```

### Debug Mode
```bash
npm run test:e2e:debug
```

### Headed Mode (See Browser)
```bash
npm run test:e2e:headed
```

## Test Coverage

### ✅ Currently Working
- Landing page rendering
- CAS login integration
- Basic navigation flows
- API endpoint availability
- Responsive design
- Performance testing
- Accessibility validation

### 🚧 Requires Authentication
- Admin dashboard functionality
- Professor workflow
- Student workflow
- Full CRUD operations

### 📝 Test Scenarios

1. **Landing Page Flow**
   - Page loads correctly
   - Login button redirects to CAS
   - Responsive design works

2. **Authentication Flow**
   - Unauthenticated users redirect to CAS
   - Protected routes are properly secured
   - API endpoints require authentication

3. **Cross-Browser Compatibility**
   - Chrome, Firefox, Safari (desktop)
   - Mobile Chrome and Safari
   - Different viewport sizes

4. **Performance**
   - Page load times < 5 seconds
   - API response times < 2 seconds
   - Smooth navigation

5. **Accessibility**
   - Proper heading structure
   - Keyboard navigation
   - Alt text on images
   - Form labels

## Configuration

### Environment Variables
- `TEST_ADMIN_API_KEY` - API key for admin testing (optional)
- `UFBA_USERNAME` - UFBA username for manual testing (optional)
- `UFBA_PASSWORD` - UFBA password for manual testing (optional)

### Playwright Config
- **Base URL**: http://localhost:3001
- **Timeout**: 30 seconds
- **Retries**: 1 (local), 2 (CI)
- **Workers**: 2 (local), 1 (CI)

## Development Notes

### Adding New Tests

1. Create a new `.spec.ts` file in the `e2e` directory
2. Follow the existing pattern for test structure
3. Use descriptive test names
4. Include proper error handling for CAS redirects

### Test Patterns

```typescript
import { test, expect } from '@playwright/test'

test.describe('Feature Name', () => {
  test('should do something specific', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    await expect(page.locator('selector')).toBeVisible()
  })
})
```

### Handling CAS Redirects

Since most routes redirect to UFBA's CAS system, tests should handle this gracefully:

```typescript
try {
  await page.waitForURL(/autenticacao\.ufba\.br/, { timeout: 8000 })
  await expect(page.locator('input[name="username"]')).toBeVisible()
} catch (e) {
  // Handle timeout or alternative flow
  expect(page.url()).toContain('localhost:3001')
}
```

### Performance Considerations

- Tests run with automatic dev server startup
- Use `waitForLoadState('networkidle')` for dynamic content
- Set appropriate timeouts for external redirects

## CI/CD Integration

Tests are configured to run in CI environments with:
- Increased retries (2)
- Single worker for stability
- Video capture on failure
- HTML report generation

## Troubleshooting

### Common Issues

1. **CAS Timeout**: UFBA's CAS system may be slow or unavailable
2. **Dev Server**: Ensure port 3001 is available
3. **Browser Installation**: Run `npm run test:e2e:install` if browsers are missing

### Debug Commands

```bash
# View HTML report
npx playwright show-report

# Show specific trace
npx playwright show-trace test-results/trace.zip

# Run single test in debug mode
npx playwright test --debug e2e/basic-connectivity.spec.ts
```