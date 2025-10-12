# E2E Testing Guide

Complete guide for running end-to-end tests in the Sistema de Monitoria IC.

## Quick Start

### 1. Setup Environment
```bash
mkdir -p .env.test

# Edit .env.test and set your test database URL
# IMPORTANT: Database name MUST contain '_test' for safety
```

### 2. Run Tests
```bash
# Full pipeline (recommended for first run)
npm run test:e2e:local

# Quick run (after initial setup)
npm run test:e2e

# With visible browser (debugging)
npm run test:e2e:headed
```

## Test Users

The system automatically creates three test users:

| Role | Email | Password | Details |
|------|-------|----------|---------|
| **Admin** | `admin@ufba.br` | `password123` | Administrative operations |
| **Professor** | `professor@ufba.br` | `password123` | SIAPE: 1234567 |
| **Student** | `student@ufba.br` | `password123` | Matrícula: 202301234 |

## What Gets Tested

### Authentication (8 tests)
- Login page validation
- Form validation (empty fields, invalid email)
- Login with valid/invalid credentials
- Navigation (register, forgot password)
- CAS login integration
- Protected routes access control

### Professor Workflow (6 tests)
- Dashboard navigation
- Project creation (draft mode)
- Project form filling
- Project listing
- Project signature interface
- Template navigation

### Admin Workflow (10 tests)
- Dashboard access and project approval queue
- Semester filtering
- Department management
- Discipline management
- Scholarship allocation
- Edital management
- Project import interface
- Approve/reject actions

### Student Workflow (10 tests)
- Dashboard access
- Browse available projects
- View project details
- Application form submission
- Application status tracking
- Profile management
- Project filtering

## Available Commands

```bash
# Full pipeline (linting, typecheck, build, test)
npm run test:e2e:local

# Quick test run
npm run test:e2e

# Run with visible browser
npm run test:e2e:headed

# Run specific test file
npx playwright test src/tests/e2e/auth-flow.spec.ts

# Debug mode (step through tests)
npx playwright test --debug

# View test report
npx playwright show-report
```

## Test Pipeline (npm run test:e2e:local)

The full pipeline script replicates CI and performs:

1. ✅ Install dependencies
2. ✅ Run linting
3. ✅ Run type checking
4. ✅ Build application
5. ✅ Setup test database
6. ✅ Seed test users
7. ✅ Install Playwright browsers
8. ✅ Start application
9. ✅ Run E2E tests
10. ✅ Cleanup

## Debugging

### Test Failed?
```bash
# View detailed HTML report
npx playwright show-report

# Run with visible browser
npm run test:e2e:headed

# Run specific test
npx playwright test professor-project-workflow.spec.ts

# Debug mode with Playwright Inspector
npx playwright test --debug
```

### Database Issues?
```bash
# Reset test database
npm run db:drop
npm run db:push
npm run seed:test-user
```

### Common Issues

| Problem | Solution |
|---------|----------|
| Port 3000 already in use | `lsof -ti:3000 \| xargs kill -9` |
| Database connection failed | Check `DATABASE_URL` in `.env.test` |
| Playwright not installed | `npm run test:e2e:install` |
| Tests timing out | Increase timeout in `playwright.config.ts` |

## Writing New Tests

### Test Structure

```typescript
import { test, expect, Page } from '@playwright/test'

const TEST_USER = {
  email: 'test@example.com',
  password: 'password123',
}

async function loginAsUser(page: Page) {
  await page.goto('/auth/login')
  await page.getByPlaceholder('nome@ufba.br').fill(TEST_USER.email)
  await page.getByPlaceholder('••••••••').fill(TEST_USER.password)
  await page.getByRole('button', { name: 'Entrar com e-mail' }).first().click()
  await page.waitForURL(/\/(home|dashboard)/, { timeout: 10000 })
}

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page)
  })

  test('should perform specific action', async ({ page }) => {
    await page.goto('/feature-path')
    await expect(page.locator('h1')).toBeVisible()
  })
})
```

### Best Practices

1. **Use semantic locators**: `getByRole()`, `getByLabel()`, `getByPlaceholder()`
2. **Wait for elements**: Always check visibility before interacting
3. **Handle optional elements**: Use `.catch(() => false)` for elements that may not exist
4. **Test isolation**: Each test should be independent
5. **Meaningful assertions**: Test user-visible behavior, not implementation

## Test Coverage

Tests validate completed features including:

- ✅ Import Planning (Milestone 1)
- ✅ Scholarship Workflow (Milestone 2)
- ✅ Professor Onboarding (Milestone 3)
- ✅ Project Creation Flow (Milestone 6)
- ✅ Admin Improvements (Milestone 7)

## CI/CD

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

Configuration: `.github/workflows/ci.yml`

## Security

- Test database must have `_test` suffix
- Test users have known credentials (not for production)
- CI uses isolated environment with ephemeral databases
- Sensitive data uses environment variables

## File Structure

```
sistema-de-monitoria-ic/
├── scripts/
│   ├── seed-test-user.ts          # Test user seeding
│   └── run-e2e-local.sh           # Local CI pipeline
├── src/
│   └── tests/
│       └── e2e/
│           ├── auth-flow.spec.ts
│           ├── professor-project-workflow.spec.ts
│           ├── admin-approval-workflow.spec.ts
│           └── student-application-workflow.spec.ts
├── .env.test.sample               # Test environment template
├── playwright.config.ts           # Playwright configuration
└── E2E-TESTING.md                # This file
```

## Success Indicators

When tests pass successfully:

```
✅ Linting passed
✅ Type checking passed
✅ Build succeeded
✅ Database setup completed
✅ E2E tests passed

🎉 Local E2E pipeline completed successfully!
```

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)
- [Selectors Guide](https://playwright.dev/docs/selectors)
- [CI/CD Integration](https://playwright.dev/docs/ci)
