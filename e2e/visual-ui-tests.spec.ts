import { test, expect } from '@playwright/test'

test.describe('Visual UI Tests', () => {
  test('should render landing page correctly', async ({ page }) => {
    await page.goto('/')

    // Wait for page to load completely
    await page.waitForLoadState('networkidle')

    // Check main elements
    await expect(page.locator('h1')).toContainText('Sistema de Monitoria IC')
    await expect(page.locator('img[alt="Monitoria IC"]')).toBeVisible()

    // Check sections
    await expect(page.locator('h3:has-text("Para Professores")')).toBeVisible()
    await expect(page.locator('h3:has-text("Para Alunos")').first()).toBeVisible()
    await expect(page.locator('h3:has-text("Para Administradores")')).toBeVisible()
    await expect(page.locator('h2:has-text("Fluxo do Processo")')).toBeVisible()

    // Check login buttons are functional
    const loginButton = page.locator('button:has-text("Acessar Dashboard com Login UFBA")').first()
    await expect(loginButton).toBeVisible()
    await expect(loginButton).toBeEnabled()
  })

  test('should handle login button click', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Click login button
    await page.click('button:has-text("Acessar Dashboard com Login UFBA")')

    // Should redirect to CAS
    await page.waitForURL(/autenticacao\.ufba\.br/, { timeout: 15000 })

    // Verify CAS page loaded
    await expect(page.locator('input[name="username"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
  })

  test('should show proper page structure', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check header structure
    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('footer')).toBeVisible()

    // Check responsive elements
    await expect(page.locator('.container').first()).toBeVisible()
    await expect(page.locator('.grid').first()).toBeVisible()
  })
})
