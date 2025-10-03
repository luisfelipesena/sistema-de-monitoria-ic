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

    // Look for "Novo Edital" button
    const createEditalButton = page.getByRole('button', { name: 'Novo Edital' })

    if (await createEditalButton.isVisible({ timeout: 3000 })) {
      await createEditalButton.click()

      // Fill edital form
      const numeroField = page
        .locator('input[name*="numero"]')
        .or(page.locator('label:has-text("Número")').locator('..').locator('input'))
        .first()
      await numeroField.fill('001/2025-DCC')

      const tituloField = page
        .locator('input[name*="titulo"]')
        .or(page.locator('label:has-text("Título")').locator('..').locator('input'))
        .first()
      await tituloField.fill('Edital Interno de Seleção de Monitores - 2025.1')

      // Set dates
      const dataInicioField = page.locator('input[type="date"]').first()
      await dataInicioField.fill('2025-02-01')

      const dataFimField = page.locator('input[type="date"]').nth(1)
      await dataFimField.fill('2025-02-15')

      // Set type to DCC (internal)
      const tipoSelect = page
        .locator('select[name*="tipo"]')
        .or(page.locator('label:has-text("Tipo")').locator('..').locator('select'))
        .first()
      if (await tipoSelect.isVisible({ timeout: 3000 })) {
        await tipoSelect.selectOption('DCC')
      }

      // Save edital
      const saveButton = page.getByRole('button', { name: 'Criar Edital' })
      await saveButton.click()

      // Wait for success message
      await expect(page.getByText('Edital criado com sucesso!')).toBeVisible({
        timeout: 5000,
      })

      // Now define available exam dates
      // Look for "Definir Datas de Prova" or similar button
      const definirDatasButton = page
        .locator('text=Definir Datas')
        .or(page.locator('text=Datas de Prova').or(page.locator('button').filter({ hasText: /data.*prova/i })))
        .first()

      if (await definirDatasButton.isVisible({ timeout: 3000 })) {
        await definirDatasButton.click()

        // Add exam dates
        const addDateButton = page.locator('button:has-text("Adicionar Data")')
        if (await addDateButton.isVisible({ timeout: 3000 })) {
          // Add first date
          await addDateButton.click()
          const firstDateField = page.locator('input[type="date"]').last()
          await firstDateField.fill('2025-02-20')

          // Add second date
          await addDateButton.click()
          const secondDateField = page.locator('input[type="date"]').last()
          await secondDateField.fill('2025-02-21')

          // Set result publication date
          const resultDateField = page
            .locator('label:has-text("Divulgação")')
            .locator('..')
            .locator('input[type="date"]')
          if (await resultDateField.isVisible({ timeout: 3000 })) {
            await resultDateField.fill('2025-02-25')
          }

          // Save dates
          const saveDatesButton = page.locator('button:has-text("Salvar Datas")')
          await saveDatesButton.click()

          // Wait for success
          await expect(
            page.locator('text=definidas com sucesso').or(page.locator('text=atualizadas com sucesso'))
          ).toBeVisible({ timeout: 5000 })
        }
      }
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
      const saveTemplateButton = page.locator('button:has-text("Salvar Template")')
      await saveTemplateButton.click()

      // Wait for success
      await expect(page.getByText('Template criado')).toBeVisible({
        timeout: 5000,
      })
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
