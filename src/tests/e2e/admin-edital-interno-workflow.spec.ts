import { test, expect, Page } from '@playwright/test'

const ADMIN_USER = {
  email: 'admin@ufba.br',
  password: 'password123',
}

async function loginAsAdmin(page: Page) {
  await page.goto('/auth/login')
  await page.getByPlaceholder('seu.email@exemplo.com').fill(ADMIN_USER.email)
  await page.getByPlaceholder('••••••••••').fill(ADMIN_USER.password)
  await page.getByRole('button', { name: 'Entrar' }).click()

  // Wait for navigation to dashboard or home
  await page.waitForURL(/\/(home|dashboard)/, { timeout: 10000 })
}

test.describe('Admin Edital Interno DCC Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('should create edital interno with available exam dates', async ({ page }) => {
    // Navigate to edital management
    await page.goto('/home/admin/edital-management')
    await page.waitForLoadState('networkidle')

    // Check if we're on the correct page
    await expect(page.locator('h1, h2').filter({ hasText: /Gerenciar Editais/i })).toBeVisible({ timeout: 5000 })

    // Look for "Novo Edital" button and verify it exists
    const createEditalButton = page.getByRole('button', { name: 'Novo Edital' })
    await expect(createEditalButton).toBeVisible({ timeout: 10000 })

    // Click to open dialog
    await createEditalButton.click()

    // Verify dialog opened
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })

    // Wait for form fields to be ready
    await page.waitForTimeout(1000)

    // Fill edital form with exam dates
    const numeroField = page.locator('input[name="numero"]')
    if (await numeroField.isVisible({ timeout: 3000 })) {
      await numeroField.fill('01/2025')
    }

    const tituloField = page.locator('input[name="titulo"]')
    if (await tituloField.isVisible({ timeout: 3000 })) {
      await tituloField.fill('Edital Interno DCC - Monitoria 2025.1')
    }

    // Add exam dates for internal edital
    const addDateButton = page.locator('button:has-text("Adicionar Data")')
    if (await addDateButton.isVisible({ timeout: 3000 })) {
      await addDateButton.click()

      // Fill first exam date
      const dateInput = page.locator('input[type="date"]').first()
      if (await dateInput.isVisible({ timeout: 3000 })) {
        await dateInput.fill('2025-03-15')
      }

      // Add another date
      await addDateButton.click()
      const secondDateInput = page.locator('input[type="date"]').nth(1)
      if (await secondDateInput.isVisible({ timeout: 3000 })) {
        await secondDateInput.fill('2025-03-22')
      }
    }

    // Fill other edital fields
    const descricaoField = page.locator('textarea[name="descricao"]')
    if (await descricaoField.isVisible({ timeout: 3000 })) {
      await descricaoField.fill('Edital interno para seleção de monitores do DCC')
    }

    // Save edital
    const saveButton = page.locator('button:has-text("Salvar")')
    if (await saveButton.isVisible({ timeout: 3000 })) {
      await saveButton.click()

      // Verify success message
      const successToast = page.locator('[data-state="open"]').getByText(/Edital (criado|salvo)/)
      await expect(successToast).toBeVisible({ timeout: 10000 })
    }
  })

  test('should verify exam dates are available for professor project creation', async ({ page }) => {
    // First, login as professor to test the workflow
    await page.goto('/auth/logout')
    await page.goto('/auth/login')

    const PROFESSOR_USER = {
      email: 'professor@ufba.br',
      password: 'password123',
    }

    await page.getByPlaceholder('seu.email@exemplo.com').fill(PROFESSOR_USER.email)
    await page.getByPlaceholder('••••••••••').fill(PROFESSOR_USER.password)
    await page.getByRole('button', { name: 'Entrar' }).click()

    await page.waitForURL(/\/(home|dashboard)/, { timeout: 10000 })

    // Navigate to project creation with internal edital fields
    await page.goto('/home/professor/projetos/novo')
    await page.waitForLoadState('networkidle')

    // Select a discipline
    const disciplineSelect = page.getByRole('combobox')
    if (await disciplineSelect.isVisible({ timeout: 3000 })) {
      await disciplineSelect.click()
      await page.waitForTimeout(1000) // Give dropdown time to populate
      const disciplineOption = page.getByRole('option').first()
      await expect(disciplineOption).toBeVisible({ timeout: 10000 })
      await disciplineOption.click()
      await page.waitForLoadState('networkidle')

      // Check if template exists, create if needed
      const hasNoTemplate = await page.locator('text=Criar Template Padrão Primeiro').isVisible({ timeout: 3000 })

      if (hasNoTemplate) {
        // Create template first
        await page.waitForTimeout(500)
        await page.getByRole('button', { name: /Criar Template Padrão/i }).click({ timeout: 15000 })
        await page.waitForLoadState('networkidle')

        const titleField = page.locator('label:has-text("Título Padrão")').locator('..').locator('input')
        await titleField.fill('Template DCC')

        await page.locator('button:has-text("Salvar Template")').click()
        await expect(page.locator('[data-state="open"]').getByText(/Template/).first()).toBeVisible({ timeout: 10000 })
        await page.waitForTimeout(2000)
      }

      // Should now be on project creation form
      await expect(page.locator('h1')).toContainText('Criar Projeto de Monitoria')

      // Look for internal edital fields
      const examDateSelect = page
        .locator('select[name*="data"]')
        .or(page.locator('label:has-text("Data da Seleção")').locator('..').locator('select'))
        .first()

      if (await examDateSelect.isVisible({ timeout: 3000 })) {
        // Should have available dates from admin
        const options = await examDateSelect.locator('option').count()
        expect(options).toBeGreaterThan(1) // Should have options beyond the default
      }

      // Look for time selection
      const timeField = page
        .locator('input[name*="horario"]')
        .or(page.locator('label:has-text("Horário")').locator('..').locator('input'))
        .first()

      if (await timeField.isVisible({ timeout: 3000 })) {
        await timeField.fill('14:00-16:00')
      }
    }
  })

  test('should handle exam points and bibliography in templates', async ({ page }) => {
    // Login as professor again
    await page.goto('/auth/logout')
    await page.goto('/auth/login')

    const PROFESSOR_USER = {
      email: 'professor@ufba.br',
      password: 'password123',
    }

    await page.getByPlaceholder('seu.email@exemplo.com').fill(PROFESSOR_USER.email)
    await page.getByPlaceholder('••••••••••').fill(PROFESSOR_USER.password)
    await page.getByRole('button', { name: 'Entrar' }).click()

    await page.waitForURL(/\/(home|dashboard)/, { timeout: 10000 })

    // Navigate to template editing
    await page.goto('/home/professor/projetos/novo')
    await page.waitForLoadState('networkidle')

    // Select discipline and go to template editing
    const disciplineSelect = page.getByRole('combobox')
    if (await disciplineSelect.isVisible({ timeout: 3000 })) {
      await disciplineSelect.click()
      await page.waitForTimeout(1000) // Give dropdown time to populate
      const disciplineOption = page.getByRole('option').first()
      await expect(disciplineOption).toBeVisible({ timeout: 10000 })
      await disciplineOption.click()
      await page.waitForLoadState('networkidle')

      // Check if template exists
      const hasNoTemplate = await page.locator('text=Criar Template Padrão Primeiro').isVisible({ timeout: 3000 })

      if (hasNoTemplate) {
        // Create template
        await page.waitForTimeout(500)
        await page.getByRole('button', { name: /Criar Template Padrão/i }).click({ timeout: 15000 })
      } else {
        // Edit template
        await page.getByRole('button', { name: /Editar Template/i }).click()
      }

      await page.waitForLoadState('networkidle')

      // Fill template with exam-specific fields
      const titleField = page.locator('label:has-text("Título Padrão")').locator('..').locator('input')
      await titleField.fill('Template com Pontos de Prova')

      // Look for exam points field
      const examPointsField = page
        .locator('textarea[name*="pontos"]')
        .or(page.locator('label:has-text("Pontos da Prova")').locator('..').locator('textarea'))
        .first()

      if (await examPointsField.isVisible({ timeout: 3000 })) {
        await examPointsField.fill(
          '1. Conceitos fundamentais de estruturas de dados\n2. Implementação de listas e árvores\n3. Algoritmos de ordenação e busca'
        )
      }

      // Look for bibliography field
      const bibliographyField = page
        .locator('textarea[name*="bibliografia"]')
        .or(page.locator('label:has-text("Bibliografia")').locator('..').locator('textarea'))
        .first()

      if (await bibliographyField.isVisible({ timeout: 3000 })) {
        await bibliographyField.fill(
          '1. Cormen, T. H. - Introduction to Algorithms\n2. Sedgewick, R. - Algorithms in C++\n3. Tanenbaum, A. S. - Data Structures Using C and C++'
        )
      }

      // Save template
      const saveTemplateButton = page.locator('button:has-text("Salvar Template")')
      await expect(saveTemplateButton).toBeVisible({ timeout: 5000 })
      await saveTemplateButton.click()

      // Wait for success toast message
      const templateToast = page.locator('[data-state="open"]').getByText(/Template (criado|atualizado)/).first()
      await expect(templateToast).toBeVisible({ timeout: 10000 })
    }
  })

  test('should validate editable exam info in project creation', async ({ page }) => {
    // Login as professor
    await page.goto('/auth/logout')
    await page.goto('/auth/login')

    const PROFESSOR_USER = {
      email: 'professor@ufba.br',
      password: 'password123',
    }

    await page.getByPlaceholder('seu.email@exemplo.com').fill(PROFESSOR_USER.email)
    await page.getByPlaceholder('••••••••••').fill(PROFESSOR_USER.password)
    await page.getByRole('button', { name: 'Entrar' }).click()

    await page.waitForURL(/\/(home|dashboard)/, { timeout: 10000 })

    // Navigate to project creation
    await page.goto('/home/professor/projetos/novo')
    await page.waitForLoadState('networkidle')

    // Select discipline and go to project creation
    const disciplineSelect = page.locator('button[role="combobox"]').first()
    if (await disciplineSelect.isVisible({ timeout: 3000 })) {
      await disciplineSelect.click()
      const disciplineOption = page.locator('[role="option"]').first()
      await disciplineOption.click()
      await page.waitForLoadState('networkidle')

      // Ensure template exists
      const hasNoTemplate = await page.locator('text=Criar Template Padrão Primeiro').isVisible({ timeout: 3000 })

      if (hasNoTemplate) {
        await page.waitForTimeout(500)
        await page.getByRole('button', { name: /Criar Template Padrão/i }).click({ timeout: 15000 })
        await page.waitForLoadState('networkidle')

        const titleField = page.locator('label:has-text("Título Padrão")').locator('..').locator('input')
        await titleField.fill('Template Edital')

        await page.locator('button:has-text("Salvar Template")').click()
        await expect(page.locator('[data-state="open"]').getByText(/Template/).first()).toBeVisible({ timeout: 10000 })
        await page.waitForTimeout(2000)
      }

      // Should be on project creation
      await expect(page.locator('h1')).toContainText('Criar Projeto de Monitoria')

      // Check if exam-related fields are pre-filled from template but editable
      const examPointsField = page
        .locator('textarea[name*="pontos"]')
        .or(page.locator('label:has-text("Pontos")').locator('..').locator('textarea'))
        .first()

      if (await examPointsField.isVisible({ timeout: 3000 })) {
        // Should have default content from template
        const currentContent = await examPointsField.inputValue()
        expect(currentContent).toBeTruthy()

        // Should be editable - modify the content
        await examPointsField.clear()
        await examPointsField.fill('Pontos customizados para este projeto específico')

        // Verify it was changed
        const newContent = await examPointsField.inputValue()
        expect(newContent).toContain('customizados')
      }

      const bibliographyField = page
        .locator('textarea[name*="bibliografia"]')
        .or(page.locator('label:has-text("Bibliografia")').locator('..').locator('textarea'))
        .first()

      if (await bibliographyField.isVisible({ timeout: 3000 })) {
        // Should be editable
        await bibliographyField.clear()
        await bibliographyField.fill('Bibliografia específica para este projeto')

        // Verify it was changed
        const newContent = await bibliographyField.inputValue()
        expect(newContent).toContain('específica')
      }
    }
  })
})
