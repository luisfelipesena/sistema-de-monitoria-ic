import { test, expect } from '@playwright/test'

test.describe('Basic Connectivity', () => {
  test('should load the homepage with landing page', async ({ page }) => {
    await page.goto('/')

    // Should show the landing page
    await expect(page.locator('h1')).toContainText('Sistema de Monitoria IC')
    await expect(page.locator('button:has-text("Acessar Dashboard com Login UFBA")').first()).toBeVisible()

    // Should have login button that triggers CAS login
    await page.click('button:has-text("Acessar Dashboard com Login UFBA")')

    // Should redirect to CAS login
    await page.waitForURL(/autenticacao\.ufba\.br/)
  })

  test('should show CAS login page with correct elements', async ({ page }) => {
    await page.goto('/api/cas-login')

    // Wait for redirect to CAS
    await page.waitForURL(/autenticacao\.ufba\.br/)

    // Check basic page elements
    await expect(page.locator('input[name="username"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('text=Central de Autenticação')).toBeVisible()
  })

  test('should have correct page title on CAS login', async ({ page }) => {
    await page.goto('/api/cas-login')
    await page.waitForURL(/autenticacao\.ufba\.br/)

    // Check that we're on UFBA's authentication page
    await expect(page).toHaveTitle(/UFBA|Universidade Federal da Bahia|Central de Autenticação/)
  })
})
