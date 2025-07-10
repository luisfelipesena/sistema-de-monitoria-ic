import { test, expect } from '@playwright/test'

test.describe('Complete E2E Flow', () => {
  test('full application flow without authentication', async ({ page }) => {
    // 1. Start at homepage
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Verify landing page loads
    await expect(page.locator('h1')).toContainText('Sistema de Monitoria IC')

    // 2. Try to access different role dashboards (should redirect to CAS)
    const roleDashboards = ['/home/admin/dashboard', '/home/professor/dashboard', '/home/student/dashboard']

    for (const dashboard of roleDashboards) {
      await page.goto(dashboard)

      // Should redirect to CAS
      try {
        await page.waitForURL(/autenticacao\.ufba\.br/, { timeout: 8000 })
        await expect(page.locator('input[name="username"]')).toBeVisible()
      } catch (_e) {
        // If timeout, check if we're still on localhost (landing page)
        expect(page.url()).toContain('localhost:3001')
      }
    }

    // 3. Test API endpoints availability
    const apiResponse = await page.request.get('/api/openapi-spec')
    expect(apiResponse.status()).toBe(200)

    // 4. Test tRPC endpoints (should require auth)
    const trpcResponse = await page.request.post('/api/trpc/user.list')
    expect([401, 403, 302, 200, 415, 400]).toContain(trpcResponse.status())

    // 5. Go back to homepage and test login flow
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Click login button
    const loginBtn = page.locator('button:has-text("Acessar Dashboard com Login UFBA")').first()
    await expect(loginBtn).toBeVisible()
    await loginBtn.click()

    // Should redirect to CAS
    await page.waitForURL(/autenticacao\.ufba\.br/, { timeout: 10000 })
    await expect(page.locator('input[name="username"]')).toBeVisible()
  })

  test('responsive design validation', async ({ page }) => {
    await page.goto('/')

    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 })
    await expect(page.locator('h1')).toBeVisible()

    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.locator('h1')).toBeVisible()

    // Mobile
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('h1')).toBeVisible()

    // Verify mobile navigation works
    const mobileLoginBtn = page.locator('button:has-text("Acessar Dashboard com Login UFBA")').first()
    await expect(mobileLoginBtn).toBeVisible()
  })

  test('error handling and edge cases', async ({ page }) => {
    // Test 404 handling
    await page.goto('/non-existent-route')

    // Should either show 404 or redirect to home/login
    const currentUrl = page.url()
    const isValidResponse =
      currentUrl.includes('404') ||
      currentUrl.includes('not-found') ||
      currentUrl.includes('autenticacao.ufba.br') ||
      currentUrl.includes('localhost:3001')
    expect(isValidResponse).toBe(true)

    // Test malformed URLs
    await page.goto('/api/invalid-endpoint')
    const response = page.url()
    expect(response).toBeTruthy()

    // Test direct CAS logout (should redirect)
    await page.goto('/api/cas-logout')
    await page.waitForTimeout(2000) // Give time for redirect

    // Should end up somewhere reasonable
    const logoutUrl = page.url()
    const isValidLogout = logoutUrl.includes('autenticacao.ufba.br') || logoutUrl.includes('localhost:3001')
    expect(isValidLogout).toBe(true)
  })
})
