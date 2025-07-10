import { expect, test } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should redirect to CAS login when not authenticated', async ({ page }) => {
    // Try to access a protected route
    await page.goto('/home/admin/dashboard')

    // Should redirect to login
    await page.waitForURL(/\/api\/cas-login/)

    // Check that we're redirected to CAS
    await expect(page).toHaveURL(/autenticacao\.ufba\.br/)

    // Verify CAS login form elements
    await expect(page.locator('input[name="username"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('input[type="submit"]')).toBeVisible()
  })

  test('should show login page elements correctly', async ({ page }) => {
    await page.goto('/api/cas-login')

    // Wait for redirect to CAS
    await page.waitForURL(/autenticacao\.ufba\.br/)

    // Verify UFBA branding
    await expect(page.locator('img')).toBeVisible() // UFBA logo
    await expect(page.locator('text=Central de Autenticação')).toBeVisible()

    // Verify form elements
    await expect(page.locator('input[name="username"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('text=Esqueci meu login ou senha')).toBeVisible()
    await expect(page.locator('text=Primeiro Acesso')).toBeVisible()
  })

  test('should handle invalid credentials gracefully', async ({ page }) => {
    await page.goto('/api/cas-login')
    await page.waitForURL(/autenticacao\.ufba\.br/)

    // Fill invalid credentials
    await page.fill('input[name="username"]', 'invalid.user')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('input[type="submit"]')

    // Should show error or stay on login page
    // Note: Exact error handling depends on UFBA's CAS implementation
    await page.waitForTimeout(2000) // Wait for potential error message

    // Should still be on the CAS login page or show error
    const currentUrl = page.url()
    expect(currentUrl).toMatch(/autenticacao\.ufba\.br/)
  })
})
