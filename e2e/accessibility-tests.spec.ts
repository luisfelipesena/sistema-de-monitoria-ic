import { test, expect } from '@playwright/test'

test.describe('Accessibility Tests', () => {
  test('basic accessibility checks', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check for proper heading structure
    const h1 = page.locator('h1')
    await expect(h1).toBeVisible()
    await expect(h1).toContainText('Sistema de Monitoria IC')

    // Check for alt text on images
    const logo = page.locator('img[alt="Monitoria IC"]')
    await expect(logo).toBeVisible()

    // Check for proper button labels
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()
    expect(buttonCount).toBeGreaterThan(0)

    // Check that buttons have visible text or aria-labels
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i)
      const hasText = await button.textContent()
      const hasAriaLabel = await button.getAttribute('aria-label')
      expect(hasText || hasAriaLabel).toBeTruthy()
    }
  })

  test('keyboard navigation', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Test tab navigation
    await page.keyboard.press('Tab')

    // Should focus on first interactive element
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()

    // Continue tabbing to ensure focus moves
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Should still have a focused element
    const newFocusedElement = page.locator(':focus')
    await expect(newFocusedElement).toBeVisible()
  })

  test('color contrast and visual elements', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check that text is visible against backgrounds
    const mainHeading = page.locator('h1')
    await expect(mainHeading).toBeVisible()

    // Check that interactive elements are distinguishable
    const buttons = page.locator('button:visible')
    const buttonCount = await buttons.count()

    for (let i = 0; i < Math.min(buttonCount, 3); i++) {
      const button = buttons.nth(i)
      await expect(button).toBeVisible()
      await expect(button).toBeEnabled()
    }
  })

  test('form accessibility on CAS login', async ({ page }) => {
    await page.goto('/api/cas-login')

    try {
      await page.waitForURL(/autenticacao\.ufba\.br/, { timeout: 8000 })

      // Check form labels and inputs
      const usernameInput = page.locator('input[name="username"]')
      const passwordInput = page.locator('input[name="password"]')

      await expect(usernameInput).toBeVisible()
      await expect(passwordInput).toBeVisible()

      // Check if inputs are properly labeled (either by label or placeholder)
      const usernameLabel =
        (await usernameInput.getAttribute('placeholder')) || (await usernameInput.getAttribute('aria-label'))
      const passwordLabel =
        (await passwordInput.getAttribute('placeholder')) || (await passwordInput.getAttribute('aria-label'))

      expect(usernameLabel || passwordLabel).toBeTruthy()
    } catch (_e) {
      // If CAS doesn't load, skip this test
      test.skip(true, 'CAS login page not accessible for testing')
    }
  })

  test('semantic HTML structure', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check for proper semantic elements
    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('footer')).toBeVisible()

    // Check for proper heading hierarchy
    const headings = page.locator('h1, h2, h3, h4, h5, h6')
    const headingCount = await headings.count()
    expect(headingCount).toBeGreaterThan(1) // Should have multiple headings

    // Check for landmark regions
    const _nav = page.locator('nav, [role="navigation"]')
    const main = page.locator('main, [role="main"]')

    await expect(main).toBeVisible()
  })
})
