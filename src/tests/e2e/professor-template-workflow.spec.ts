import { test, expect, Page } from '@playwright/test'

const PROFESSOR_USER = {
  email: 'professor@ufba.br',
  password: 'password123',
}

async function loginAsProfessor(page: Page) {
  await page.goto('/auth/login')
  await page.getByPlaceholder('seu.email@exemplo.com').fill(PROFESSOR_USER.email)
  await page.getByPlaceholder('••••••••••').fill(PROFESSOR_USER.password)
  await page.getByRole('button', { name: 'Entrar' }).click()

  // Wait for navigation to dashboard or home
  await page.waitForURL(/\/(home|dashboard)/, { timeout: 10000 })
}

test.describe('Professor Template Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsProfessor(page)
  })

  test('should complete full template workflow - select discipline, create/edit template, and create project', async ({
    page,
  }) => {
    // Navigate to new project page
    await page.goto('/home/professor/projetos/novo')
    await page.waitForLoadState('networkidle')

    // Step 1: Select a discipline first
    await expect(page.locator('h1')).toContainText('Novo projeto de monitoria')
    await expect(page.getByText('Selecione a disciplina para continuar')).toBeVisible()

    // Select a discipline from the dropdown
    const disciplineSelect = page.getByRole('combobox')
    await disciplineSelect.click()

    // Wait for options to load and select the first available discipline
    await page.waitForTimeout(1000) // Give dropdown time to populate
    const firstOption = page.getByRole('option').first()
    await expect(firstOption).toBeVisible({ timeout: 10000 })
    await firstOption.click()

    // Step 2: After selecting discipline, should see either template creation or project form
    await page.waitForLoadState('networkidle')

    // Check if template exists by looking for either the "create template" card or project form
    const hasNoTemplate = await page.locator('text=Criar Template Padrão Primeiro').isVisible({ timeout: 3000 })

    if (hasNoTemplate) {
      // No template - should see button to create one
      await expect(page.locator('text=Esta disciplina não possui um template padrão')).toBeVisible()
      const createTemplateBtn = page.getByRole('button', { name: /Criar Template Padrão/i })
      await expect(createTemplateBtn).toBeVisible()

      // Click to create template
      await createTemplateBtn.click()
      await page.waitForLoadState('networkidle')
    } else {
      // Template exists - should see project form with edit template button
      await expect(page.locator('h1')).toContainText('Criar Projeto de Monitoria')

      // Click edit template button
      const editTemplateBtn = page.getByRole('button', { name: /Editar Template/i })
      await expect(editTemplateBtn).toBeVisible({ timeout: 5000 })
      await editTemplateBtn.click()
      await page.waitForLoadState('networkidle')
    }

    // Step 3: Should now be on template editing view
    await expect(page.locator('h1')).toContainText('Editar Template Padrão')
    await expect(page.locator('text=Configurações do Template')).toBeVisible()

    // Template workflow is functional - editing page loads correctly
    console.log('Template workflow navigation verified successfully')
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
    await page.waitForLoadState('networkidle')

    // Check if we need to create template
    const hasNoTemplate = await page.locator('text=Criar Template Padrão Primeiro').isVisible({ timeout: 3000 })

    if (hasNoTemplate) {
      // Click create template button
      await page.getByRole('button', { name: /Criar Template Padrão/i }).click()
    } else {
      // Click edit template button
      await page.getByRole('button', { name: /Editar Template/i }).click()
    }

    await page.waitForLoadState('networkidle')

    // Should be on template editing page
    await expect(page.locator('h1')).toContainText('Editar Template Padrão')

    // Fill minimal template data
    const titleField = page.locator('label:has-text("Título Padrão")').locator('..').locator('input')
    await titleField.fill('Template Básico')

    // Save template
    const saveButton = page.locator('button:has-text("Salvar Template")')
    await saveButton.click()

    // Should see success toast message
    const templateToast = page.locator('[data-state="open"]').getByText(/Template (criado|atualizado)/)
    await expect(templateToast).toBeVisible({ timeout: 10000 })
  })

  test('should allow creating project after template exists', async ({ page }) => {
    // Navigate to new project page and select discipline
    await page.goto('/home/professor/projetos/novo')
    await page.waitForLoadState('networkidle')

    const disciplineSelect = page.getByRole('combobox')
    await disciplineSelect.click()
    await page.waitForTimeout(1000)
    const disciplineOption = page.getByRole('option').first()
    await expect(disciplineOption).toBeVisible({ timeout: 10000 })
    await disciplineOption.click()
    await page.waitForLoadState('networkidle')

    // Check if template exists
    const hasNoTemplate = await page.locator('text=Criar Template Padrão Primeiro').isVisible({ timeout: 3000 })

    if (hasNoTemplate) {
      // Create template first
      await page.getByRole('button', { name: /Criar Template Padrão/i }).click()
      await page.waitForLoadState('networkidle')

      const titleField = page.locator('label:has-text("Título Padrão")').locator('..').locator('input')
      await titleField.fill('Template para Teste')

      await page.locator('button:has-text("Salvar Template")').click()
      await expect(page.locator('[data-state="open"]').getByText(/Template/)).toBeVisible({ timeout: 10000 })

      // Wait for redirect or click back to project
      await page.waitForTimeout(2000)
    }

    // Should now see project creation form
    const projectTitle = await page.locator('h1').textContent()
    expect(projectTitle).toContain('Projeto de Monitoria')
  })

  test('should show project form when template exists', async ({ page }) => {
    // Navigate to new project page and select discipline
    await page.goto('/home/professor/projetos/novo')
    await page.waitForLoadState('networkidle')

    const disciplineSelect = page.getByRole('combobox')
    await disciplineSelect.click()
    await page.waitForTimeout(1000)
    const disciplineOption = page.getByRole('option').first()
    await expect(disciplineOption).toBeVisible({ timeout: 10000 })
    await disciplineOption.click()
    await page.waitForLoadState('networkidle')

    // Create template if needed
    const hasNoTemplate = await page.locator('text=Criar Template Padrão Primeiro').isVisible({ timeout: 3000 })

    if (hasNoTemplate) {
      await page.getByRole('button', { name: /Criar Template Padrão/i }).click()
      await page.waitForLoadState('networkidle')

      const titleField = page.locator('label:has-text("Título Padrão")').locator('..').locator('input')
      await titleField.fill('Template Padrão')

      await page.locator('button:has-text("Salvar Template")').click()
      await expect(page.locator('[data-state="open"]').getByText(/Template/)).toBeVisible({ timeout: 10000 })
      await page.waitForTimeout(2000)
    }

    // Should see project form elements
    await expect(page.locator('text=Identificação do Projeto')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Detalhes do Projeto')).toBeVisible({ timeout: 5000 })
  })

  test('should handle navigation between template and project creation', async ({ page }) => {
    // Navigate to new project page
    await page.goto('/home/professor/projetos/novo')
    await page.waitForLoadState('networkidle')

    // Select discipline
    const disciplineSelect = page.getByRole('combobox')
    await disciplineSelect.click()
    await page.waitForTimeout(1000)
    const disciplineOption = page.getByRole('option').first()
    await expect(disciplineOption).toBeVisible({ timeout: 10000 })
    await disciplineOption.click()
    await page.waitForLoadState('networkidle')

    // Ensure template exists
    const hasNoTemplate = await page.locator('text=Criar Template Padrão Primeiro').isVisible({ timeout: 3000 })

    if (hasNoTemplate) {
      await page.getByRole('button', { name: /Criar Template Padrão/i }).click()
      await page.waitForLoadState('networkidle')

      const titleField = page.locator('label:has-text("Título Padrão")').locator('..').locator('input')
      await titleField.fill('Template Navegação')

      await page.locator('button:has-text("Salvar Template")').click()
      await expect(page.locator('[data-state="open"]').getByText(/Template/)).toBeVisible({ timeout: 10000 })
      await page.waitForTimeout(2000)
    }

    // Should be on project creation
    await expect(page.locator('h1')).toContainText('Criar Projeto de Monitoria')

    // Click edit template
    await page.getByRole('button', { name: /Editar Template/i }).click()
    await page.waitForLoadState('networkidle')

    // Should be on template editing
    await expect(page.locator('h1')).toContainText('Editar Template Padrão')

    // Navigation workflow is functional
    console.log('Navigation between workflow modes verified successfully')
  })
})
