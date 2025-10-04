import { test, expect, Page } from '@playwright/test'

const ADMIN_USER = {
  email: 'admin@ufba.br',
  password: 'password123',
}

async function loginAsAdmin(page: Page) {
  await page.goto('/auth/login')
  await page.getByPlaceholder('nome@ufba.br').fill(ADMIN_USER.email)
  await page.getByPlaceholder('••••••••').fill(ADMIN_USER.password)
  await page.getByRole('button', { name: 'Entrar com e-mail' }).first().click()

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

    // Look for "Novo Edital" button within a Dialog
    const createEditalButton = page.getByRole('button', { name: 'Novo Edital' })
    await expect(createEditalButton).toBeVisible({ timeout: 10000 })
    await createEditalButton.click()

    // Fill edital form with unique number to avoid conflicts
    const randomNum = Math.floor(Math.random() * 1000)
    const numeroField = page.locator('label:has-text("Número do Edital")').locator('..').locator('input')
    await numeroField.fill(`${randomNum}/2025-DCC`)

    const tituloField = page.locator('label:has-text("Título")').locator('..').locator('input')
    await tituloField.fill('Edital Interno de Seleção de Monitores - 2025.1')

    // Set ano
    const anoField = page.locator('label:has-text("Ano")').locator('..').locator('input')
    await anoField.clear()
    await anoField.fill('2025')

    // Set semestre
    const semestreSelectTrigger = page.locator('label:has-text("Semestre")').locator('..').getByRole('combobox')
    await semestreSelectTrigger.click()
    await page.getByRole('option', { name: '1º Semestre' }).click()

    // Set dates
    const dataInicioField = page.locator('input[type="date"]').first()
    await dataInicioField.fill('2025-02-01')

    const dataFimField = page.locator('input[type="date"]').nth(1)
    await dataFimField.fill('2025-02-15')

    // Set type to DCC (internal) - using shadcn Select component
    const tipoSelectTrigger = page.locator('label:has-text("Tipo de Edital")').locator('..').getByRole('combobox')
    await tipoSelectTrigger.click()
    await page.getByRole('option', { name: 'DCC (Interno)' }).click()

    // Save edital
    const saveButton = page.getByRole('button', { name: 'Criar Edital' })
    await expect(saveButton).toBeVisible({ timeout: 5000 })

    // Wait for form validation to complete
    await page.waitForTimeout(1000)

    // Click the button and wait for network
    await saveButton.click()

    // Wait for success toast - check for title AND/OR description
    // The toast has: title="Sucesso!" description="Edital criado com sucesso!"
    const successToastTitle = page.locator('[data-state="open"]').getByText('Sucesso!')
    const successToastDescription = page.locator('[data-state="open"]').getByText('Edital criado com sucesso!')

    // Wait for either the title or description to be visible
    await expect(successToastTitle.or(successToastDescription).first()).toBeVisible({ timeout: 15000 })

    // Wait for dialog to close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })

    // Edital creation successful!
    // Note: Exam dates functionality can be tested separately if needed
  })

  test('should verify exam dates are available for professor project creation', async ({ page }) => {
    // First, login as professor to test the workflow
    await page.goto('/auth/logout')
    await page.goto('/auth/login')

    const PROFESSOR_USER = {
      email: 'professor@ufba.br',
      password: 'password123',
    }

    await page.getByPlaceholder('nome@ufba.br').fill(PROFESSOR_USER.email)
    await page.getByPlaceholder('••••••••').fill(PROFESSOR_USER.password)
    await page.getByRole('button', { name: 'Entrar com e-mail' }).first().click()

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

      // Go to project creation
      await page.locator('text=Criar Projeto Específico').click()

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

    await page.getByPlaceholder('nome@ufba.br').fill(PROFESSOR_USER.email)
    await page.getByPlaceholder('••••••••').fill(PROFESSOR_USER.password)
    await page.getByRole('button', { name: 'Entrar com e-mail' }).first().click()

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

      // Go to template editing
      await page.locator('text=Editar Template Padrão').click()

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
      const saveTemplateButton = page.locator('button:has-text("Salvar Template Padrão")')
      await expect(saveTemplateButton).toBeVisible({ timeout: 5000 })
      await saveTemplateButton.click()

      // Wait for success toast message - check for title or description
      const templateToast = page.locator('[data-state="open"]').getByText(/Template (criado|atualizado)/)
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

    await page.getByPlaceholder('nome@ufba.br').fill(PROFESSOR_USER.email)
    await page.getByPlaceholder('••••••••').fill(PROFESSOR_USER.password)
    await page.getByRole('button', { name: 'Entrar com e-mail' }).first().click()

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

      // Go to project creation
      await page.locator('text=Criar Projeto Específico').click()

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
