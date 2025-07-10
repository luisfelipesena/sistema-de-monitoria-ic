import { test, expect } from '@playwright/test'

test.describe('Smoke Tests', () => {
  test('application loads and basic navigation works', async ({ page }) => {
    // Test homepage loads
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('Sistema de Monitoria IC')

    // Test that static assets load
    await expect(page.locator('img[alt="Monitoria IC"]')).toBeVisible()

    // Test footer is present
    await expect(page.locator('footer')).toBeVisible()
  })

  test('CAS integration is working', async ({ page }) => {
    await page.goto('/api/cas-login')

    // Should redirect to UFBA CAS
    await page.waitForURL(/autenticacao\.ufba\.br/, { timeout: 15000 })

    // CAS page should load properly
    await expect(page.locator('input[name="username"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('text=Central de Autenticação')).toBeVisible()
  })

  test('protected routes redirect correctly', async ({ page }) => {
    const protectedRoutes = [
      '/home/admin/dashboard',
      '/home/professor/dashboard',
      '/home/student/dashboard',
      '/home/profile',
    ]

    for (const route of protectedRoutes) {
      await page.goto(route)

      // All should redirect to CAS login
      await page.waitForURL(/autenticacao\.ufba\.br/, { timeout: 10000 })

      // Verify we're on CAS login
      const usernameInput = page.locator('input[name="username"]')
      await expect(usernameInput).toBeVisible()
    }
  })

  test('API endpoints respond correctly', async ({ page }) => {
    // Test OpenAPI spec
    const openApiResponse = await page.request.get('/api/openapi-spec')
    expect(openApiResponse.status()).toBe(200)

    // Test tRPC endpoint (should require auth)
    const trpcResponse = await page.request.post('/api/trpc/user.list')
    expect([401, 403, 302]).toContain(trpcResponse.status())
  })

  test('app handles invalid routes gracefully', async ({ page }) => {
    // Test 404 handling
    await page.goto('/non-existent-route')

    // Should either show 404 page or redirect to home/login
    const currentUrl = page.url()
    const is404 = currentUrl.includes('404') || currentUrl.includes('not-found')
    const isRedirect = currentUrl.includes('autenticacao.ufba.br') || currentUrl.includes('localhost:3001')

    expect(is404 || isRedirect).toBe(true)
  })

  test('application is responsive', async ({ page }) => {
    await page.goto('/')

    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 })
    await expect(page.locator('h1')).toBeVisible()

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('h1')).toBeVisible()

    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.locator('h1')).toBeVisible()
  })
})
