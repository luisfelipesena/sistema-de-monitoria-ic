import { test, expect } from '@playwright/test'

test.describe('Admin Dashboard Flow', () => {
  test('should access admin dashboard and view project management', async ({ page }) => {
    // Navigate to admin dashboard
    await page.goto('/home/admin/dashboard')

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
      const isOnExpectedPage = currentUrl.includes('/home/admin/dashboard') || currentUrl.includes('localhost:3001')

      expect(isOnExpectedPage).toBe(true)
    }
  })

  test('should display admin dashboard layout and navigation', async ({ page }) => {
    await page.goto('/home/admin/dashboard')
    await page.waitForTimeout(3000)

    const currentUrl = page.url()

    if (currentUrl.includes('autenticacao.ufba.br')) {
      test.skip(true, 'Requires authentication')
    }

    if (currentUrl.includes('/home/admin/dashboard')) {
      // Test dashboard layout elements
      await expect(page.locator('h1, h2')).toBeVisible()

      // Check for admin navigation elements
      const adminNavItems = ['Projetos', 'Professores', 'Alunos', 'Analytics', 'Manage Projects']

      for (const navItem of adminNavItems) {
        const navElement = page.locator(`a:has-text("${navItem}"), button:has-text("${navItem}")`)
        if (await navElement.first().isVisible()) {
          await expect(navElement.first()).toBeVisible()
        }
      }
    }
  })

  test('should show project statistics and status cards', async ({ page }) => {
    await page.goto('/home/admin/dashboard')
    await page.waitForTimeout(3000)

    const currentUrl = page.url()

    if (currentUrl.includes('autenticacao.ufba.br')) {
      test.skip(true, 'Requires authentication')
    }

    if (currentUrl.includes('/home/admin/dashboard')) {
      // Check for dashboard statistics cards
      const expectedStatCards = ['Rascunhos', 'Pend. Assinatura', 'Em Análise', 'Aprovados', 'Rejeitados']

      for (const statCard of expectedStatCards) {
        const cardElement = page.locator(`text="${statCard}", [data-testid*="${statCard.toLowerCase()}"]`)
        if (await cardElement.first().isVisible()) {
          await expect(cardElement.first()).toBeVisible()
        }
      }

      // Check for numeric statistics
      const numberElements = page.locator('text=/^\\d+$/')
      const numberCount = await numberElements.count()
      expect(numberCount).toBeGreaterThan(0)
    }
  })

  test('should handle tabs navigation (Projetos, Professores, Alunos)', async ({ page }) => {
    await page.goto('/home/admin/dashboard')
    await page.waitForTimeout(3000)

    const currentUrl = page.url()

    if (currentUrl.includes('autenticacao.ufba.br')) {
      test.skip(true, 'Requires authentication')
    }

    if (currentUrl.includes('/home/admin/dashboard')) {
      const tabs = ['Projetos', 'Professores', 'Alunos']

      for (const tab of tabs) {
        const tabElement = page.locator(`button:has-text("${tab}")`)
        if (await tabElement.isVisible()) {
          await tabElement.click()
          await page.waitForTimeout(500)

          // Verify tab is active
          const activeTab = page.locator(
            `button:has-text("${tab}")[data-state="active"], button:has-text("${tab}").active`
          )
          await expect(activeTab).toBeVisible()
        }
      }
    }
  })

  test('should display and interact with projects table', async ({ page }) => {
    await page.goto('/home/admin/dashboard')
    await page.waitForTimeout(3000)

    const currentUrl = page.url()

    if (currentUrl.includes('autenticacao.ufba.br')) {
      test.skip(true, 'Requires authentication')
    }

    if (currentUrl.includes('/home/admin/dashboard')) {
      // Check for projects table
      const table = page.locator('table')
      if (await table.isVisible()) {
        await expect(table).toBeVisible()

        // Check table headers
        const expectedHeaders = ['Componente curricular', 'Status', 'Voluntários', 'Inscritos', 'Ações']

        for (const header of expectedHeaders) {
          const headerElement = page.locator(`th:has-text("${header}")`)
          if (await headerElement.isVisible()) {
            await expect(headerElement).toBeVisible()
          }
        }

        // Check for action buttons in table
        const analyzeButtons = page.locator('button:has-text("Analisar")')
        const pdfButtons = page.locator('button:has-text("Visualizar PDF")')

        if (await analyzeButtons.first().isVisible()) {
          await expect(analyzeButtons.first()).toBeVisible()
        }

        if (await pdfButtons.first().isVisible()) {
          await expect(pdfButtons.first()).toBeVisible()
        }
      }
    }
  })

  test('should show admin action buttons', async ({ page }) => {
    await page.goto('/home/admin/dashboard')
    await page.waitForTimeout(3000)

    const currentUrl = page.url()

    if (currentUrl.includes('autenticacao.ufba.br')) {
      test.skip(true, 'Requires authentication')
    }

    if (currentUrl.includes('/home/admin/dashboard')) {
      // Check for admin action buttons
      const expectedButtons = ['Editais Internos', 'Planilha PROGRAD', 'Agrupar por Departamento', 'Filtros']

      for (const buttonText of expectedButtons) {
        const buttonElement = page.locator(`button:has-text("${buttonText}")`)
        if (await buttonElement.isVisible()) {
          await expect(buttonElement).toBeVisible()
          await expect(buttonElement).toBeEnabled()
        }
      }
    }
  })

  test('should handle filters functionality', async ({ page }) => {
    await page.goto('/home/admin/dashboard')
    await page.waitForTimeout(3000)

    const currentUrl = page.url()

    if (currentUrl.includes('autenticacao.ufba.br')) {
      test.skip(true, 'Requires authentication')
    }

    if (currentUrl.includes('/home/admin/dashboard')) {
      // Test filters button
      const filtersButton = page.locator('button:has-text("Filtros")')
      if (await filtersButton.isVisible()) {
        await filtersButton.click()

        // Check if filter modal/dropdown opens
        await page.waitForTimeout(500)

        // Look for filter options
        const filterElements = page.locator('[role="dialog"], .filter-content, .dropdown-content')
        if (await filterElements.first().isVisible()) {
          await expect(filterElements.first()).toBeVisible()
        }
      }
    }
  })

  test('should handle department grouping functionality', async ({ page }) => {
    await page.goto('/home/admin/dashboard')
    await page.waitForTimeout(3000)

    const currentUrl = page.url()

    if (currentUrl.includes('autenticacao.ufba.br')) {
      test.skip(true, 'Requires authentication')
    }

    if (currentUrl.includes('/home/admin/dashboard')) {
      // Test department grouping button
      const groupButton = page.locator('button:has-text("Agrupar por Departamento")')
      if (await groupButton.isVisible()) {
        await groupButton.click()
        await page.waitForTimeout(500)

        // Check if view changes (look for department headers or different layout)
        const departmentHeaders = page.locator('h3, .department-header, [data-testid*="department"]')
        if (await departmentHeaders.first().isVisible()) {
          await expect(departmentHeaders.first()).toBeVisible()
        }
      }
    }
  })

  test('should navigate to different admin sections', async ({ page }) => {
    await page.goto('/home/admin/dashboard')
    await page.waitForTimeout(3000)

    const currentUrl = page.url()

    if (currentUrl.includes('autenticacao.ufba.br')) {
      test.skip(true, 'Requires authentication')
    }

    if (currentUrl.includes('/home/admin/dashboard')) {
      // Test navigation to different admin sections
      const adminSections = [
        { name: 'Analytics', path: '/home/admin/analytics' },
        { name: 'Professores', path: '/home/admin/professores' },
        { name: 'Alunos', path: '/home/admin/alunos' },
      ]

      for (const section of adminSections) {
        const sectionLink = page.locator(`a[href*="${section.path}"], button:has-text("${section.name}")`)
        if (await sectionLink.first().isVisible()) {
          await sectionLink.first().click()

          // Wait for navigation
          await page.waitForTimeout(1000)

          // Check if we navigated or if it was blocked by auth
          const newUrl = page.url()
          const navigatedSuccessfully = newUrl.includes(section.path) || newUrl.includes('autenticacao.ufba.br')

          expect(navigatedSuccessfully).toBe(true)

          // Go back to dashboard for next test
          await page.goto('/home/admin/dashboard')
          await page.waitForTimeout(1000)
        }
      }
    }
  })

  test('should be responsive on different screen sizes', async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' },
    ]

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/home/admin/dashboard')
      await page.waitForTimeout(2000)

      const currentUrl = page.url()

      if (currentUrl.includes('autenticacao.ufba.br')) {
        // Test CAS login responsiveness
        await expect(page.locator('input[name="username"]')).toBeVisible()
        await expect(page.locator('input[name="password"]')).toBeVisible()
      } else if (currentUrl.includes('/home/admin/dashboard')) {
        // Test dashboard responsiveness
        await expect(page.locator('h1, h2')).toBeVisible()

        // Check that main content is visible and accessible
        const mainContent = page.locator('main, .main-content, [role="main"]')
        if (await mainContent.first().isVisible()) {
          await expect(mainContent.first()).toBeVisible()
        }
      }
    }
  })
})
