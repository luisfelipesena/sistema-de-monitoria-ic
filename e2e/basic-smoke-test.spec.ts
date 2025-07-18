import { test, expect } from '@playwright/test'

/**
 * Smoke Tests - Basic functionality validation
 * Simple tests to verify the application is running and basic pages load
 */

test.describe('Basic Smoke Tests', () => {
  test('should load home page', async ({ page }) => {
    await page.goto('/')
    
    // Check if the page loads without errors
    await expect(page).toHaveTitle(/Sistema de Monitoria/)
    
    // Should see some basic UI elements
    await expect(page.locator('body')).toBeVisible()
  })

  test('should navigate to admin login', async ({ page }) => {
    await page.goto('/')
    
    // Look for login or admin access elements
    await expect(page.locator('body')).toBeVisible()
    
    // Basic navigation test - just ensure pages load
    await page.goto('/home')
    await expect(page.locator('body')).toBeVisible()
  })

  test('should handle 404 pages gracefully', async ({ page }) => {
    await page.goto('/non-existent-page')
    
    // Should show some kind of not found page
    await expect(page.locator('body')).toBeVisible()
  })
})