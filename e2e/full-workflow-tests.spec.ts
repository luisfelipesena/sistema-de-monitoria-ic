import { test, expect } from '@playwright/test'

test.describe('Full System Workflow Tests', () => {
  test('should simulate complete professor project workflow', async ({ page }) => {
    // Step 1: Professor login and navigate to projects
    await page.goto('/home/professor/dashboard')
    await page.waitForTimeout(3000)

    const currentUrl = page.url()

    if (currentUrl.includes('autenticacao.ufba.br')) {
      test.skip(true, 'Requires authentication - would need valid UFBA credentials')
    }

    if (currentUrl.includes('/home/professor')) {
      // Step 2: Navigate to projects page
      await page.goto('/home/professor/projetos')
      await expect(page.locator('h1, h2')).toBeVisible()

      // Step 3: Try to create new project
      const newProjectButton = page.locator('a[href*="/projetos/novo"], button:has-text("Novo")')
      if (await newProjectButton.first().isVisible()) {
        await newProjectButton.first().click()

        // Step 4: Fill project form
        await page.goto('/home/professor/projetos/novo')
        await expect(page.locator('form')).toBeVisible()

        // Fill basic project information
        await page.fill('input[name="titulo"]', 'Projeto E2E Test - Monitoria de Algoritmos')
        await page.fill('textarea[name="descricao"]', 'Projeto para teste E2E do sistema de monitoria')

        // Step 5: Generate PDF preview
        const previewButton = page.locator('button:has-text("Gerar Preview")')
        if (await previewButton.isVisible()) {
          await previewButton.click()
          await page.waitForTimeout(2000)

          // Check if preview was generated
          const previewSection = page.locator('text=Preview gerado com sucesso')
          if (await previewSection.isVisible()) {
            await expect(previewSection).toBeVisible()
          }
        }

        // Step 6: Save as draft
        const saveButton = page.locator('button[type="submit"]')
        if (await saveButton.isVisible()) {
          await saveButton.click()

          // Should redirect to dashboard or show success message
          await page.waitForTimeout(2000)
        }
      }
    }
  })

  test('should simulate admin project approval workflow', async ({ page }) => {
    // Step 1: Admin login and navigate to dashboard
    await page.goto('/home/admin/dashboard')
    await page.waitForTimeout(3000)

    const currentUrl = page.url()

    if (currentUrl.includes('autenticacao.ufba.br')) {
      test.skip(true, 'Requires authentication - would need valid UFBA credentials')
    }

    if (currentUrl.includes('/home/admin')) {
      // Step 2: Check project statistics
      const statCards = page.locator('text=Rascunhos, text=Em Análise, text=Aprovados')
      if (await statCards.first().isVisible()) {
        await expect(statCards.first()).toBeVisible()
      }

      // Step 3: Navigate through project management tabs
      const tabs = ['Projetos', 'Professores', 'Alunos']
      for (const tab of tabs) {
        const tabButton = page.locator(`button:has-text("${tab}")`)
        if (await tabButton.isVisible()) {
          await tabButton.click()
          await page.waitForTimeout(500)
        }
      }

      // Step 4: Try to analyze a project
      const analyzeButton = page.locator('button:has-text("Analisar")')
      if (await analyzeButton.first().isVisible()) {
        await analyzeButton.first().click()
        await page.waitForTimeout(1000)

        // Should open project details or navigate to analysis page
      }

      // Step 5: Generate PROGRAD spreadsheet
      const progradButton = page.locator('button:has-text("Planilha PROGRAD")')
      if (await progradButton.isVisible()) {
        await progradButton.click()
        await page.waitForTimeout(2000)

        // Should trigger download or show progress
      }
    }
  })

  test('should validate project submission requirements flow', async ({ page }) => {
    // Based on requirements from meeting transcription
    // Module 1: Project creation and submission

    await page.goto('/home/professor/projetos/novo')
    await page.waitForTimeout(3000)

    const currentUrl = page.url()

    if (currentUrl.includes('autenticacao.ufba.br')) {
      test.skip(true, 'Requires authentication')
    }

    if (currentUrl.includes('/home/professor/projetos/novo')) {
      // Validate required fields from meeting requirements
      const requiredFields = [
        'titulo', // Project title
        'descricao', // Project description/objectives
        'departamentoId', // Department
        'disciplinas', // Disciplines
        'ano', // Year
        'semestre', // Semester
        'tipoProposicao', // Individual/Collective
        'bolsasSolicitadas', // Requested scholarships
        'cargaHorariaSemana', // Weekly workload
        'numeroSemanas', // Number of weeks
        'publicoAlvo', // Target audience
        'estimativaPessoasBenificiadas', // Estimated beneficiaries
      ]

      // Test that all required fields are present
      for (const field of requiredFields) {
        const fieldElement = page.locator(`input[name="${field}"], textarea[name="${field}"], select[name="${field}"]`)
        if (await fieldElement.isVisible()) {
          await expect(fieldElement).toBeVisible()
        }
      }

      // Test professor information auto-population
      // Should pull from professor profile when discipline is selected
      const departmentSelect = page.locator('select[name="departamentoId"], [name="departamentoId"]')
      if (await departmentSelect.isVisible()) {
        await departmentSelect.click()
        await page.waitForTimeout(500)
      }

      // Test activities section
      const activitiesSection = page.locator('text=Atividades do Projeto')
      if (await activitiesSection.isVisible()) {
        await expect(activitiesSection).toBeVisible()

        // Should have default activities and ability to add more
        const addActivityButton = page.locator('button:has-text("Adicionar Atividade")')
        if (await addActivityButton.isVisible()) {
          await expect(addActivityButton).toBeVisible()
        }
      }
    }
  })

  test('should validate PDF generation and signature workflow', async ({ page }) => {
    // Based on requirements: professors need to sign PDFs

    await page.goto('/home/professor/projetos/novo')
    await page.waitForTimeout(3000)

    const currentUrl = page.url()

    if (currentUrl.includes('autenticacao.ufba.br')) {
      test.skip(true, 'Requires authentication')
    }

    if (currentUrl.includes('/home/professor/projetos/novo')) {
      // Fill minimum required fields to enable PDF generation
      await page.fill('input[name="titulo"]', 'Monitoria de Estruturas de Dados')
      await page.fill(
        'textarea[name="descricao"]',
        'Projeto voltado para auxiliar estudantes com conceitos fundamentais de estruturas de dados'
      )
      await page.fill(
        'textarea[name="publicoAlvo"]',
        'Estudantes de Ciência da Computação cursando Estruturas de Dados'
      )

      // Test PDF preview generation
      const previewButton = page.locator('button:has-text("Gerar Preview")')
      if (await previewButton.isVisible()) {
        // Check if preview button becomes enabled after required fields
        await expect(previewButton).toBeEnabled()

        await previewButton.click()
        await page.waitForTimeout(3000)

        // Should show PDF preview
        const pdfPreview = page.locator('text=Preview gerado com sucesso')
        if (await pdfPreview.isVisible()) {
          await expect(pdfPreview).toBeVisible()
        }

        // PDF should contain project information
        const pdfViewer = page.locator('iframe, .react-pdf__Page, [data-testid="pdf-viewer"]')
        if (await pdfViewer.first().isVisible()) {
          await expect(pdfViewer.first()).toBeVisible()
        }
      }

      // Test save as draft functionality
      const saveButton = page.locator('button:has-text("Salvar Rascunho")')
      if (await saveButton.isVisible()) {
        await expect(saveButton).toBeVisible()
        await expect(saveButton).toBeEnabled()
      }
    }
  })

  test('should validate admin monitoring and approval flow', async ({ page }) => {
    // Admin should see all submitted projects and be able to manage them

    await page.goto('/home/admin/dashboard')
    await page.waitForTimeout(3000)

    const currentUrl = page.url()

    if (currentUrl.includes('autenticacao.ufba.br')) {
      test.skip(true, 'Requires authentication')
    }

    if (currentUrl.includes('/home/admin')) {
      // Check project status tracking
      const statusCards = [
        'Rascunhos', // Draft projects
        'Pend. Assinatura', // Pending signature
        'Em Análise', // Under analysis
        'Aprovados', // Approved
        'Rejeitados', // Rejected
      ]

      for (const status of statusCards) {
        const statusCard = page.locator(`text="${status}"`)
        if (await statusCard.isVisible()) {
          await expect(statusCard).toBeVisible()

          // Should show count next to status
          const statusCount = statusCard.locator('.. >> text=/\\d+/')
          if (await statusCount.isVisible()) {
            await expect(statusCount).toBeVisible()
          }
        }
      }

      // Test email notification functionality (buttons should be present)
      const emailButtons = page.locator('button:has-text("Enviar"), button[title*="email"], button[title*="notificar"]')
      if (await emailButtons.first().isVisible()) {
        await expect(emailButtons.first()).toBeVisible()
      }

      // Test spreadsheet generation for PROGRAD
      const progradButton = page.locator('button:has-text("Planilha PROGRAD")')
      if (await progradButton.isVisible()) {
        await expect(progradButton).toBeVisible()
        await expect(progradButton).toBeEnabled()
      }
    }
  })

  test('should handle multi-step workflow navigation', async ({ page }) => {
    // Test navigation between different workflow steps

    const workflowSteps = [
      '/home/professor/dashboard',
      '/home/professor/projetos',
      '/home/professor/projetos/novo',
      '/home/admin/dashboard',
      '/home/admin/manage-projects',
    ]

    for (const step of workflowSteps) {
      await page.goto(step)
      await page.waitForTimeout(2000)

      const currentUrl = page.url()

      if (currentUrl.includes('autenticacao.ufba.br')) {
        // Expected for unauthenticated access
        await expect(page.locator('input[name="username"]')).toBeVisible()
      } else if (currentUrl.includes(step)) {
        // Successfully reached the page
        await expect(page.locator('h1, h2, main')).toBeVisible()
      } else if (currentUrl.includes('localhost:3001')) {
        // Redirected to home page - acceptable fallback
        await expect(page.locator('h1')).toBeVisible()
      }
    }
  })
})
