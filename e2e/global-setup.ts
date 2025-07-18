import { chromium, type FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  // Try to check if the server is running
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    // Quick check if server is responding
    await page.goto('http://localhost:3001', { timeout: 5000 })
    console.log('✅ Development server is running')
    await browser.close()
    return
  } catch (error) {
    console.log('⚠️  Development server not running on localhost:3001')
    console.log('Please start the server with: npm run dev')
    await browser.close()
    process.exit(1)
  }
}

export default globalSetup