import { test, expect } from '@playwright/test'

test.describe('Performance Tests', () => {
  test('page load performance', async ({ page }) => {
    // Track timing
    const startTime = Date.now()

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const endTime = Date.now()
    const loadTime = endTime - startTime

    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000)

    // Check that critical resources loaded
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('img[alt="Monitoria IC"]')).toBeVisible()
  })

  test('API response times', async ({ page }) => {
    // Test OpenAPI spec endpoint
    const startTime = Date.now()
    const response = await page.request.get('/api/openapi-spec')
    const endTime = Date.now()

    expect(response.status()).toBe(200)
    expect(endTime - startTime).toBeLessThan(2000) // Should respond within 2 seconds
  })

  test('large page interactions', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Test scrolling performance
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight)
    })

    await page.waitForTimeout(500)

    // Elements should still be responsive
    await expect(page.locator('footer')).toBeVisible()

    // Scroll back to top
    await page.evaluate(() => {
      window.scrollTo(0, 0)
    })

    await expect(page.locator('h1')).toBeVisible()
  })

  test('concurrent navigation', async ({ page }) => {
    // Rapidly navigate between pages
    const pages = ['/', '/api/cas-login', '/']

    for (let i = 0; i < 3; i++) {
      for (const pagePath of pages) {
        await page.goto(pagePath, { waitUntil: 'domcontentloaded' })
        await page.waitForTimeout(100)
      }
    }

    // Should end up functional
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1')).toBeVisible()
  })
})
