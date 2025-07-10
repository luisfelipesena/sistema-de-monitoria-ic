import { expect, test } from '@playwright/test'

test.describe('Admin Dashboard', () => {
  test('should redirect to CAS login when accessing admin dashboard', async ({ page }) => {
    // Navigate to admin dashboard
    await page.goto('/home/admin/dashboard')

    // Should redirect to CAS login since no auth
    await page.waitForURL(/autenticacao\.ufba\.br/, { timeout: 15000 })

    // Verify we're on CAS login page
    await expect(page.locator('input[name="username"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
  })

  test('admin dashboard UI elements (requires authentication)', async () => {
    // This test would need proper authentication
    // Skipping for now to focus on basic connectivity tests
    test.skip(true, 'Requires manual testing with real credentials')
  })
})
