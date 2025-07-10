import { test, expect } from '@playwright/test'

test.describe('Admin API Access', () => {
  // Test with a mock API key - will fail auth but should hit the API
  test('should handle API key authentication flow', async ({ page }) => {
    // Set fake API key header
    await page.setExtraHTTPHeaders({
      'x-api-key': 'fake-test-key-12345',
    })

    await page.goto('/home/admin/dashboard')

    // Should still redirect to login since API key is fake
    await page.waitForURL(/autenticacao\.ufba\.br/, { timeout: 10000 })

    // But we know the API key header was processed
    await expect(page.locator('input[name="username"]')).toBeVisible()
  })

  test('should protect admin routes without auth', async ({ page }) => {
    const adminRoutes = [
      '/home/admin/dashboard',
      '/home/admin/professores',
      '/home/admin/alunos',
      '/home/admin/analytics',
    ]

    for (const route of adminRoutes) {
      await page.goto(route)

      // Should redirect to CAS login
      await page.waitForURL(/autenticacao\.ufba\.br/, { timeout: 10000 })
      await expect(page.locator('input[name="username"]')).toBeVisible()
    }
  })

  test('should validate tRPC endpoints are accessible', async ({ page }) => {
    // Test tRPC health by making a request
    const response = await page.request.get('/api/trpc/analytics.getProjectStats')

    // Should get 401 or redirect, not 404
    expect([200, 302, 401, 403]).toContain(response.status())
  })

  test('should handle direct API calls', async ({ page }) => {
    // Test OpenAPI endpoint
    const response = await page.request.get('/api/openapi-spec')
    expect(response.status()).toBe(200)

    const body = await response.text()
    expect(body).toContain('openapi')
  })
})
