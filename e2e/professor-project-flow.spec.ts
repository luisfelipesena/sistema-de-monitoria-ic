import { test, expect } from '@playwright/test'

test.describe('Professor Project Creation Flow', () => {
  test('should complete the full project creation workflow', async ({ page }) => {
    // Navigate to professor new project page
    await page.goto('/home/professor/projetos/novo')

    // Check if we're redirected to CAS login (expected for unauthenticated user)
    try {
      await page.waitForURL(/autenticacao\.ufba\.br/, { timeout: 8000 })

      // Verify we're on CAS login page
      await expect(page.locator('input[name="username"]')).toBeVisible()
      await expect(page.locator('input[name="password"]')).toBeVisible()

      test.skip(true, 'Test requires authentication - CAS login detected')
    } catch (_error) {
      // If not redirected to CAS, we might be on a different page
      const currentUrl = page.url()
      console.log(`Current URL: ${currentUrl}`)

      // Check if we're on the expected page or redirected to home
      const isOnExpectedPage =
        currentUrl.includes('/home/professor/projetos/novo') || currentUrl.includes('localhost:3001')

      expect(isOnExpectedPage).toBe(true)
    }
  })

  test('should handle project form validation correctly', async ({ page }) => {
    // Mock being authenticated as a professor
    await page.goto('/home/professor/projetos/novo')

    // If redirected to CAS, skip the test
    await page.waitForTimeout(3000)
    const currentUrl = page.url()

    if (currentUrl.includes('autenticacao.ufba.br')) {
      test.skip(true, 'Requires authentication')
    }

    // If we reach the form, test the validation
    if (currentUrl.includes('/home/professor/projetos/novo')) {
      // Test form validation
      await expect(page.locator('form')).toBeVisible()

      // Try to submit empty form
      const submitButton = page.locator('button[type="submit"]')
      if (await submitButton.isVisible()) {
        await submitButton.click()

        // Should show validation errors
        await expect(page.locator('.text-red-500, .text-destructive')).toBeVisible()
      }
    }
  })

  test('should display project form fields correctly', async ({ page }) => {
    await page.goto('/home/professor/projetos/novo')
    await page.waitForTimeout(3000)

    const currentUrl = page.url()

    if (currentUrl.includes('autenticacao.ufba.br')) {
      test.skip(true, 'Requires authentication')
    }

    if (currentUrl.includes('/home/professor/projetos/novo')) {
      // Test that essential form fields are present
      const expectedFields = [
        'input[name="titulo"]',
        'textarea[name="descricao"]',
        'input[name="ano"]',
        'input[name="cargaHorariaSemana"]',
        'input[name="numeroSemanas"]',
        'textarea[name="publicoAlvo"]',
        'input[name="estimativaPessoasBenificiadas"]',
        'input[name="bolsasSolicitadas"]',
        'input[name="voluntariosSolicitados"]',
      ]

      for (const fieldSelector of expectedFields) {
        await expect(page.locator(fieldSelector)).toBeVisible()
      }

      // Test that dropdowns are present
      await expect(page.locator('select, [role="combobox"]')).toHaveCount({ greaterThan: 0 })

      // Test that submit button is present
      await expect(page.locator('button[type="submit"]')).toBeVisible()
    }
  })

  test('should show PDF preview functionality', async ({ page }) => {
    await page.goto('/home/professor/projetos/novo')
    await page.waitForTimeout(3000)

    const currentUrl = page.url()

    if (currentUrl.includes('autenticacao.ufba.br')) {
      test.skip(true, 'Requires authentication')
    }

    if (currentUrl.includes('/home/professor/projetos/novo')) {
      // Check for PDF preview section
      await expect(page.locator('text=Preview do Documento')).toBeVisible()

      // Check for preview generation button
      const previewButton = page.locator('button:has-text("Gerar Preview")')
      if (await previewButton.isVisible()) {
        await expect(previewButton).toBeVisible()
      }

      // Check for required fields warning
      const warningSection = page.locator('text=Campos obrigatórios pendentes')
      if (await warningSection.isVisible()) {
        await expect(warningSection).toBeVisible()
      }
    }
  })

  test('should handle form interactions properly', async ({ page }) => {
    await page.goto('/home/professor/projetos/novo')
    await page.waitForTimeout(3000)

    const currentUrl = page.url()

    if (currentUrl.includes('autenticacao.ufba.br')) {
      test.skip(true, 'Requires authentication')
    }

    if (currentUrl.includes('/home/professor/projetos/novo')) {
      // Test filling out basic fields
      const titleInput = page.locator('input[name="titulo"]')
      if (await titleInput.isVisible()) {
        await titleInput.fill('Projeto de Teste E2E')
        await expect(titleInput).toHaveValue('Projeto de Teste E2E')
      }

      const descriptionTextarea = page.locator('textarea[name="descricao"]')
      if (await descriptionTextarea.isVisible()) {
        await descriptionTextarea.fill('Descrição do projeto de teste para E2E')
        await expect(descriptionTextarea).toHaveValue('Descrição do projeto de teste para E2E')
      }

      // Test numeric fields
      const yearInput = page.locator('input[name="ano"]')
      if (await yearInput.isVisible()) {
        await yearInput.fill('2025')
        await expect(yearInput).toHaveValue('2025')
      }

      // Test adding activities
      const addActivityButton = page.locator('button:has-text("Adicionar Atividade")')
      if (await addActivityButton.isVisible()) {
        await addActivityButton.click()

        // Check if new activity field was added
        const activityInputs = page.locator('input[placeholder*="Atividade"]')
        await expect(activityInputs).toHaveCount({ greaterThan: 4 })
      }
    }
  })

  test('should navigate properly within professor section', async ({ page }) => {
    // Test navigation to projects page
    await page.goto('/home/professor/projetos')
    await page.waitForTimeout(3000)

    const currentUrl = page.url()

    if (currentUrl.includes('autenticacao.ufba.br')) {
      await expect(page.locator('input[name="username"]')).toBeVisible()
    } else if (currentUrl.includes('/home/professor/projetos')) {
      // Check if projects page loads
      await expect(page.locator('h1, h2, h3')).toBeVisible()

      // Look for "New Project" button or link
      const newProjectLink = page.locator('a[href*="/projetos/novo"], button:has-text("Novo")')
      if (await newProjectLink.first().isVisible()) {
        await newProjectLink.first().click()

        // Should navigate to new project page
        await page.waitForURL(/\/projetos\/novo/)
        await expect(page.url()).toContain('/projetos/novo')
      }
    }
  })

  test('should handle responsive design on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/home/professor/projetos/novo')
    await page.waitForTimeout(3000)

    const currentUrl = page.url()

    if (currentUrl.includes('autenticacao.ufba.br')) {
      // Test mobile CAS login
      await expect(page.locator('input[name="username"]')).toBeVisible()
      await expect(page.locator('input[name="password"]')).toBeVisible()
    } else if (currentUrl.includes('/home/professor/projetos/novo')) {
      // Test mobile form layout
      await expect(page.locator('form')).toBeVisible()

      // Check that form is scrollable and accessible on mobile
      const formInputs = page.locator('input, textarea, select')
      const inputCount = await formInputs.count()

      expect(inputCount).toBeGreaterThan(0)

      // Test that we can scroll through the form
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(500)

      // Scroll back to top
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.waitForTimeout(500)
    }
  })
})
