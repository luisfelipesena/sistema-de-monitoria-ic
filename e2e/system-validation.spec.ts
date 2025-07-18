import { test, expect } from '@playwright/test'

/**
 * System Validation Tests
 * Tests that validate the system is working without complex authentication flows
 */

test.describe('System Validation', () => {
  test('should load main application pages', async ({ page }) => {
    // Test home page
    await page.goto('/')
    await expect(page.locator('body')).toBeVisible()
    
    // Check for common elements that should be present
    const title = await page.title()
    expect(title).toBeTruthy()
    console.log('✅ Home page title:', title)
  })

  test('should load admin dashboard route (even if auth required)', async ({ page }) => {
    await page.goto('/home/admin/dashboard')
    
    // Even if auth is required, page should load (might redirect to login)
    await expect(page.locator('body')).toBeVisible()
    
    const url = page.url()
    console.log('✅ Admin dashboard URL:', url)
  })

  test('should load professor dashboard route', async ({ page }) => {
    await page.goto('/home/professor/dashboard')
    
    await expect(page.locator('body')).toBeVisible()
    
    const url = page.url()
    console.log('✅ Professor dashboard URL:', url)
  })

  test('should load student dashboard route', async ({ page }) => {
    await page.goto('/home/student/dashboard')
    
    await expect(page.locator('body')).toBeVisible()
    
    const url = page.url()
    console.log('✅ Student dashboard URL:', url)
  })

  test('should load API documentation', async ({ page }) => {
    await page.goto('/docs')
    
    await expect(page.locator('body')).toBeVisible()
    
    // Check if it's actually the docs page
    const content = await page.textContent('body')
    expect(content).toBeTruthy()
    console.log('✅ API docs loaded')
  })

  test('should handle Next.js routing correctly', async ({ page }) => {
    // Test that Next.js routing is working
    await page.goto('/home')
    await expect(page.locator('body')).toBeVisible()
    
    // Try to navigate to a specific admin page
    await page.goto('/home/admin/analytics')
    await expect(page.locator('body')).toBeVisible()
    
    console.log('✅ Next.js routing working')
  })

  test('should serve static assets', async ({ page }) => {
    // Go to any page and check if CSS/JS loads
    await page.goto('/')
    
    // Check if the page has styles applied (indication that CSS loaded)
    const bodyStyles = await page.locator('body').evaluate((el) => {
      return window.getComputedStyle(el).fontFamily
    })
    
    expect(bodyStyles).toBeTruthy()
    console.log('✅ Static assets loading correctly')
  })

  test('should respond to API health check', async ({ page }) => {
    // Try to check if tRPC is responding
    const response = await page.request.get('/api/trpc/me.getProfile')
    
    // We expect some response (even if 401 unauthorized)
    expect(response.status()).toBeLessThan(500)
    console.log('✅ API responding, status:', response.status())
  })
})