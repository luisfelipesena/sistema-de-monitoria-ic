import { expect, test } from '@playwright/test'

test.describe('Admin Dashboard (Simple)', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Try to access admin dashboard without authentication
    await page.goto('/home/admin/dashboard')

    // Should redirect to login
    await page.waitForURL(/\/api\/cas-login/)

    // Should then redirect to CAS
    await expect(page).toHaveURL(/autenticacao\.ufba\.br/)
  })

  test('should protect admin routes', async ({ page }) => {
    const adminRoutes = [
      '/home/admin/dashboard',
      '/home/admin/professores',
      '/home/admin/alunos',
      '/home/admin/analytics',
      '/home/admin/manage-projects',
    ]

    for (const route of adminRoutes) {
      await page.goto(route)

      // Each route should redirect to login
      await page.waitForURL(/\/api\/cas-login/)
      await expect(page).toHaveURL(/autenticacao\.ufba\.br/)
    }
  })

  test.skip('should show admin dashboard when authenticated with valid API key', async ({ page }) => {
    // This test would need a valid API key
    // Skip for now until we have proper test data setup

    const apiKey = process.env.TEST_ADMIN_API_KEY
    if (!apiKey) {
      test.skip(true, 'TEST_ADMIN_API_KEY not provided')
    }

    // Set API key in headers
    await page.setExtraHTTPHeaders({
      'x-api-key': apiKey ?? '',
    })

    await page.goto('/home/admin/dashboard')

    // Should load the dashboard
    await expect(page.locator('h1')).toContainText('Dashboard')

    // Should show dashboard elements
    await expect(page.locator('text=Rascunhos')).toBeVisible()
    await expect(page.locator('text=Aprovados')).toBeVisible()
  })
})
