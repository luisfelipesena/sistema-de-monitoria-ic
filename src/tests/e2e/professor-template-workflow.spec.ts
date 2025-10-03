import { test, expect, Page } from '@playwright/test'

const PROFESSOR_USER = {
  email: 'professor@ufba.br',
  password: 'password123',
}

async function loginAsProfessor(page: Page) {
  await page.goto('/auth/login')
  await page.getByPlaceholder('nome@ufba.br').fill(PROFESSOR_USER.email)
  await page.getByPlaceholder('••••••••').fill(PROFESSOR_USER.password)
  await page.getByRole('button', { name: 'Entrar com e-mail' }).first().click()

  // Wait for navigation to dashboard or home
  await page.waitForURL(/\/(home|dashboard)/, { timeout: 10000 })
}

test.describe('Professor Template Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsProfessor(page)
  })

  test('should complete full template workflow - select discipline, create template, and use it for project', async ({ page }) => {
    // Navigate to new project page
    await page.goto('/home/professor/projetos/novo')
    await page.waitForLoadState('networkidle')

    // Step 1: Select a discipline first
    await expect(page.locator('h1')).toContainText('Novo projeto de monitoria')
    await expect(page.locator('h1')).toContainText('Selecione a disciplina')

    // Select a discipline from the dropdown
    const disciplineSelect = page.locator('button[role="combobox"]').first()
    await disciplineSelect.click()

    // Wait for options to load and select the first available discipline
    const firstOption = page.locator('[role="option"]').first()
    await expect(firstOption).toBeVisible({ timeout: 5000 })

    // Get the discipline name for later verification
    const disciplineName = await firstOption.textContent()
    await firstOption.click()

    // Step 2: After selecting discipline, should see mode selection screen
    await expect(page.locator('h1')).toContainText('Novo projeto de monitoria')
    await expect(page.locator('h2, h3').filter({ hasText: /Disciplina:/ })).toBeVisible()

    // Should see three cards: Edit Template, Create Project, Existing Projects
    await expect(page.locator('text=Editar Template Padrão')).toBeVisible()
    await expect(page.locator('text=Criar Projeto Específico')).toBeVisible()
    await expect(page.locator('text=Projetos Existentes')).toBeVisible()

    // Step 3: Click on "Editar Template Padrão" to create/edit template
    const templateCard = page.locator('[data-testid="template-card"]').or(
      page.locator('text=Editar Template Padrão').locator('..').locator('..')
    )

    // Use a more reliable selector
    await page.locator('text=Editar Template Padrão').click()

    // Step 4: Should be on template editing page
    await expect(page.locator('h1')).toContainText('Editar Template Padrão')
    await expect(page.locator('text=Configurações do Template')).toBeVisible()

    // Fill template form
    const titleField = page.locator('input[placeholder*="Monitoria"]').or(
      page.locator('label:has-text("Título Padrão")').locator('..').locator('input')
    ).first()
    await titleField.fill('Template de Monitoria - Estruturas de Dados')

    const descriptionField = page.locator('textarea[placeholder*="Descrição"]').or(
      page.locator('label:has-text("Descrição Padrão")').locator('..').locator('textarea')
    ).first()
    await descriptionField.fill('Template padrão para monitoria de estruturas de dados e algoritmos')

    // Fill workload hours
    const hoursField = page.locator('input[type="number"]').first()
    await hoursField.clear()
    await hoursField.fill('12')

    // Fill weeks
    const weeksField = page.locator('input[type="number"]').nth(1)
    await weeksField.clear()
    await weeksField.fill('16')

    // Set target audience (should default to "Estudantes de graduação")
    const graduationRadio = page.locator('input[value="estudantes_graduacao"]').or(
      page.locator('text=Estudantes de graduação').locator('..').locator('input[type="radio"]')
    )
    await graduationRadio.check()

    // Add custom activities
    const firstActivityField = page.locator('input[placeholder*="Atividade"]').first()
    await firstActivityField.clear()
    await firstActivityField.fill('Auxiliar estudantes com implementação de estruturas de dados')

    // Add another activity
    const addActivityButton = page.locator('button:has-text("Adicionar Atividade")')
    await addActivityButton.click()

    const secondActivityField = page.locator('input[placeholder*="Atividade"]').nth(1)
    await secondActivityField.fill('Conduzir sessões de revisão para provas práticas')

    // Step 5: Generate preview of template
    const generatePreviewButton = page.locator('button:has-text("Gerar Preview")')
    await generatePreviewButton.click()

    // Wait for preview to load
    await expect(page.locator('text=Preview gerado com sucesso')).toBeVisible({ timeout: 10000 })

    // Step 6: Save template
    const saveTemplateButton = page.locator('button:has-text("Salvar Template Padrão")')
    await saveTemplateButton.click()

    // Wait for success message
    await expect(page.locator('text=Template criado').or(page.locator('text=Template atualizado'))).toBeVisible({ timeout: 5000 })

    // Step 7: Go back to discipline selection
    const backButton = page.locator('button:has-text("Voltar")')
    await backButton.click()

    // Should be back at mode selection screen
    await expect(page.locator('text=Editar Template Padrão')).toBeVisible()

    // Should now see "Template Padrão Existente" card
    await expect(page.locator('text=Template Padrão Existente')).toBeVisible()
    await expect(page.locator('text=Template de Monitoria - Estruturas de Dados')).toBeVisible()

    // Step 8: Now create a project using the template
    await page.locator('text=Criar Projeto Específico').click()

    // Should be on project creation page with template pre-filled
    await expect(page.locator('h1')).toContainText('Criar Projeto Específico')

    // Verify template data was applied
    const projectTitleField = page.locator('input[placeholder*="título"]').or(
      page.locator('label:has-text("Título do Projeto")').locator('..').locator('input')
    )
    await expect(projectTitleField).toHaveValue(/Template de Monitoria|Monitoria de/)

    const projectDescField = page.locator('textarea[placeholder*="objetivo"]').or(
      page.locator('label:has-text("Descrição")').locator('..').locator('textarea')
    )
    await expect(projectDescField).toHaveValue(/Template padrão|estruturas de dados/)

    // Verify workload was applied
    const projectHoursField = page.locator('label:has-text("Carga Horária Semanal")').locator('..').locator('input[type="number"]')
    await expect(projectHoursField).toHaveValue('12')

    // Step 9: Modify project details (customize from template)
    await projectTitleField.clear()
    await projectTitleField.fill('Monitoria de Estruturas de Dados - 2025.1')

    await projectDescField.clear()
    await projectDescField.fill('Projeto específico para monitoria de estruturas de dados do semestre 2025.1')

    // Set number of scholarship positions
    const scholarshipField = page.locator('label:has-text("Bolsistas Solicitados")').locator('..').locator('input[type="number"]')
    await scholarshipField.clear()
    await scholarshipField.fill('2')

    // Set number of volunteers
    const volunteerField = page.locator('label:has-text("Voluntários Solicitados")').locator('..').locator('input[type="number"]')
    await volunteerField.clear()
    await volunteerField.fill('3')

    // Step 10: Generate preview of project
    const generateProjectPreviewButton = page.locator('button:has-text("Gerar Preview do Documento")')
    if (await generateProjectPreviewButton.isVisible({ timeout: 3000 })) {
      await generateProjectPreviewButton.click()
      await expect(page.locator('text=Preview gerado com sucesso')).toBeVisible({ timeout: 10000 })
    }

    // Step 11: Save project as draft
    const saveDraftButton = page.locator('button:has-text("Salvar Rascunho")')
    await saveDraftButton.click()

    // Wait for success and navigation
    await expect(page.locator('text=Projeto criado')).toBeVisible({ timeout: 5000 })
    await page.waitForURL(/\/home\/professor\/dashboard/, { timeout: 10000 })

    // Step 12: Verify project appears in dashboard
    await expect(page.locator('text=Monitoria de Estruturas de Dados - 2025.1').or(
      page.locator('text=Template de Monitoria').or(
        page.locator('td, div').filter({ hasText: /Estruturas de Dados|Template de Monitoria/ })
      )
    )).toBeVisible({ timeout: 5000 })
  })

  test('should handle template creation for discipline without existing template', async ({ page }) => {
    // Navigate to new project page
    await page.goto('/home/professor/projetos/novo')
    await page.waitForLoadState('networkidle')

    // Select a discipline
    const disciplineSelect = page.locator('button[role="combobox"]').first()
    await disciplineSelect.click()

    const disciplineOption = page.locator('[role="option"]').first()
    await disciplineOption.click()

    // Click on template editing
    await page.locator('text=Editar Template Padrão').click()

    // Should be on template editing page
    await expect(page.locator('h1')).toContainText('Editar Template Padrão')

    // Fill minimal template data
    const titleField = page.locator('label:has-text("Título Padrão")').locator('..').locator('input')
    await titleField.fill('Template Básico')

    // Save template
    const saveButton = page.locator('button:has-text("Salvar Template Padrão")')
    await saveButton.click()

    // Should see success message
    await expect(page.locator('text=Template criado')).toBeVisible({ timeout: 5000 })
  })

  test('should allow reapplying template to project', async ({ page }) => {
    // Navigate to new project page and select discipline
    await page.goto('/home/professor/projetos/novo')
    await page.waitForLoadState('networkidle')

    const disciplineSelect = page.locator('button[role="combobox"]').first()
    await disciplineSelect.click()
    const disciplineOption = page.locator('[role="option"]').first()
    await disciplineOption.click()

    // Go to project creation (assuming template exists)
    await page.locator('text=Criar Projeto Específico').click()

    // Should be on project creation page
    await expect(page.locator('h1')).toContainText('Criar Projeto Específico')

    // Modify the title
    const titleField = page.locator('label:has-text("Título do Projeto")').locator('..').locator('input')
    await titleField.clear()
    await titleField.fill('Modified Title')

    // Check if "Reaplicar Template" button exists and click it
    const reapplyButton = page.locator('button:has-text("Reaplicar Template")')
    if (await reapplyButton.isVisible({ timeout: 3000 })) {
      await reapplyButton.click()

      // Should see success message
      await expect(page.locator('text=Template aplicado')).toBeVisible({ timeout: 3000 })

      // Title should be reverted to template default
      await expect(titleField).not.toHaveValue('Modified Title')
    }
  })

  test('should show existing projects for discipline selection', async ({ page }) => {
    // Navigate to new project page and select discipline
    await page.goto('/home/professor/projetos/novo')
    await page.waitForLoadState('networkidle')

    const disciplineSelect = page.locator('button[role="combobox"]').first()
    await disciplineSelect.click()
    const disciplineOption = page.locator('[role="option"]').first()
    await disciplineOption.click()

    // Click on existing projects
    await page.locator('text=Projetos Existentes').click()

    // Should be on existing projects page
    await expect(page.locator('h1')).toContainText('Projetos Existentes')

    // Either should show projects or empty state
    const hasProjects = await page.locator('div[class*="grid"]').filter({ has: page.locator('[class*="card"]') }).isVisible({ timeout: 3000 })

    if (hasProjects) {
      // Should show project cards
      await expect(page.locator('[class*="card"]').first()).toBeVisible()
    } else {
      // Should show empty state
      await expect(page.locator('text=Nenhum projeto encontrado')).toBeVisible()
      await expect(page.locator('button:has-text("Criar Template")')).toBeVisible()
    }
  })

  test('should handle navigation between workflow modes correctly', async ({ page }) => {
    // Navigate to new project page
    await page.goto('/home/professor/projetos/novo')
    await page.waitForLoadState('networkidle')

    // Step 1: Select discipline
    const disciplineSelect = page.locator('button[role="combobox"]').first()
    await disciplineSelect.click()
    const disciplineOption = page.locator('[role="option"]').first()
    await disciplineOption.click()

    // Step 2: Should see mode selection
    await expect(page.locator('text=Editar Template Padrão')).toBeVisible()
    await expect(page.locator('text=Criar Projeto Específico')).toBeVisible()
    await expect(page.locator('text=Projetos Existentes')).toBeVisible()

    // Step 3: Test back to discipline selection
    const changeDiscButton = page.locator('button:has-text("Escolher Outra Disciplina")')
    await changeDiscButton.click()

    // Should be back at discipline selection
    await expect(page.locator('text=Selecione a disciplina')).toBeVisible()

    // Step 4: Select discipline again
    await disciplineSelect.click()
    await disciplineOption.click()

    // Step 5: Navigate to template editing and back
    await page.locator('text=Editar Template Padrão').click()
    await expect(page.locator('h1')).toContainText('Editar Template Padrão')

    const backButton = page.locator('button:has-text("Voltar")')
    await backButton.click()

    // Should be back at mode selection
    await expect(page.locator('text=Editar Template Padrão')).toBeVisible()

    // Step 6: Navigate to project creation and back
    await page.locator('text=Criar Projeto Específico').click()
    await expect(page.locator('h1')).toContainText('Criar Projeto Específico')

    await page.locator('button:has-text("Voltar")').click()

    // Should be back at mode selection
    await expect(page.locator('text=Criar Projeto Específico')).toBeVisible()
  })
})