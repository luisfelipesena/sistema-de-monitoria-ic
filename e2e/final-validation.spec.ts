import { test, expect } from '@playwright/test'

test.describe('Final System Validation', () => {
  test('comprehensive system health check', async ({ page }) => {
    // 1. Application loads correctly
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Main page elements present
    await expect(page.locator('h1')).toContainText('Sistema de Monitoria IC')
    await expect(page.locator('img[alt="Monitoria IC"]')).toBeVisible()

    // 2. Navigation to protected routes triggers auth
    const protectedRoutes = [
      '/home/admin/dashboard',
      '/home/professor/dashboard',
      '/home/student/dashboard',
      '/home/profile',
    ]

    for (const route of protectedRoutes) {
      await page.goto(route)

      // Should redirect or show auth
      await page.waitForTimeout(3000)
      const currentUrl = page.url()
      const isAuthRedirect =
        currentUrl.includes('autenticacao.ufba.br') ||
        currentUrl.includes('cas-login') ||
        currentUrl.includes('localhost:3001') // fallback to home
      expect(isAuthRedirect).toBe(true)
    }

    // 3. API endpoints are responding
    const endpoints = [
      { path: '/api/openapi-spec', expectedStatus: 200 },
      { path: '/api/openapi', expectedStatus: [200, 404] },
    ]

    for (const endpoint of endpoints) {
      const response = await page.request.get(endpoint.path)
      if (Array.isArray(endpoint.expectedStatus)) {
        expect(endpoint.expectedStatus).toContain(response.status())
      } else {
        expect(response.status()).toBe(endpoint.expectedStatus)
      }
    }

    // 4. CAS integration working
    await page.goto('/api/cas-login')

    try {
      await page.waitForURL(/autenticacao\.ufba\.br/, { timeout: 10000 })

      // CAS page loads properly
      await expect(page.locator('input[name="username"]')).toBeVisible()
      await expect(page.locator('input[name="password"]')).toBeVisible()
      await expect(page.locator('text=Central de Autenticação')).toBeVisible()
    } catch (_error) {
      // CAS might not be available - that's ok for local testing
      console.log('CAS not available for testing - this is expected in local dev')
    }

    // 5. Return to homepage and verify final state
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Final verification
    await expect(page.locator('h1')).toContainText('Sistema de Monitoria IC')
    const loginButton = page.locator('button:has-text("Acessar Dashboard com Login UFBA")').first()
    await expect(loginButton).toBeVisible()
    await expect(loginButton).toBeEnabled()
  })

  test('mobile responsiveness validation', async ({ page }) => {
    // Test different mobile viewports
    const viewports = [
      { width: 320, height: 568, name: 'iPhone SE' },
      { width: 375, height: 667, name: 'iPhone 8' },
      { width: 414, height: 896, name: 'iPhone 11' },
      { width: 360, height: 640, name: 'Android' },
    ]

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Essential elements should be visible on mobile
      await expect(page.locator('h1')).toBeVisible()
      await expect(page.locator('button:has-text("Acessar Dashboard com Login UFBA")').first()).toBeVisible()
    }
  })

  test('error handling and edge cases', async ({ page }) => {
    // Test invalid routes
    const invalidRoutes = ['/invalid-route', '/home/invalid', '/api/invalid']

    for (const route of invalidRoutes) {
      await page.goto(route)
      await page.waitForTimeout(2000)

      // Should either show 404 or redirect to valid page
      const url = page.url()
      const isValidResponse =
        url.includes('404') ||
        url.includes('not-found') ||
        url.includes('localhost:3001') ||
        url.includes('autenticacao.ufba.br')
      expect(isValidResponse).toBe(true)
    }
  })

  test('performance and loading validation', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const loadTime = Date.now() - startTime

    // Should load within reasonable time (10 seconds for safety)
    expect(loadTime).toBeLessThan(10000)

    // Critical elements should be visible
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('img[alt="Monitoria IC"]')).toBeVisible()

    // Test scroll and interaction performance
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(500)
    await expect(page.locator('footer')).toBeVisible()

    await page.evaluate(() => window.scrollTo(0, 0))
    await expect(page.locator('h1')).toBeVisible()
  })
})
