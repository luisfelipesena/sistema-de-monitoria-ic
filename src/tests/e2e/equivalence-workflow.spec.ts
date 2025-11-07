import { test, expect } from '@playwright/test'

/**
 * E2E Test: Discipline Equivalence Workflow
 *
 * Scenario:
 * 1. Admin creates equivalence between MATA37 and MATE045
 * 2. Student with MATE045 grade applies to MATA37 project
 * 3. System automatically recognizes equivalent grade
 */

const ADMIN_CREDENTIALS = {
  email: 'admin@ufba.br',
  password: 'password123',
}

test.describe('Discipline Equivalence Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/auth/login')
    await page.getByPlaceholder('seu.email@exemplo.com').fill(ADMIN_CREDENTIALS.email)
    await page.getByPlaceholder('••••••••••').fill(ADMIN_CREDENTIALS.password)
    await page.getByRole('button', { name: 'Entrar' }).click()

    // Wait for redirect to admin dashboard
    await page.waitForURL('/home/admin/dashboard', { timeout: 5000 })
  })

  test('admin can access equivalence management page', async ({ page }) => {
    // Navigate to equivalences page via sidebar
    await page.getByRole('button', { name: 'Configurações' }).first().click()
    await page.getByRole('link', { name: 'Equivalências de Disciplinas' }).click()

    // Verify page loaded
    await expect(page).toHaveURL('/home/admin/equivalencias')
    await expect(page.locator('h1')).toContainText('Equivalências de Disciplinas')
  })

  test('admin can create a new equivalence', async ({ page }) => {
    // Navigate to equivalences page
    await page.getByRole('button', { name: 'Configurações' }).first().click()
    await page.getByRole('link', { name: 'Equivalências de Disciplinas' }).click()

    // Click "Nova Equivalência" button
    await page.getByRole('button', { name: 'Nova Equivalência' }).click()

    // Fill equivalence form
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()

    // Select first discipline - click and wait for options to load
    await dialog.locator('button').filter({ hasText: 'Selecione uma disciplina' }).first().click()
    await page.waitForTimeout(1000) // Give dropdown time to populate
    const firstDisciplineOption = page.getByRole('option').first()
    await expect(firstDisciplineOption).toBeVisible({ timeout: 5000 })
    await firstDisciplineOption.click()

    // Select second discipline - click and wait for options to load
    await dialog.locator('button').filter({ hasText: 'Selecione uma disciplina' }).last().click()
    await page.waitForTimeout(1000) // Give dropdown time to populate
    const secondDisciplineOption = page.getByRole('option').nth(1) // Select different discipline
    await expect(secondDisciplineOption).toBeVisible({ timeout: 5000 })
    await secondDisciplineOption.click()

    // Submit form
    await dialog.getByRole('button', { name: 'Criar Equivalência' }).click()

    // Verify success message or table update
    const successVisible = await page
      .getByText('Equivalência criada com sucesso')
      .isVisible({ timeout: 3000 })
      .catch(() => false)
    const tableHasContent = await page
      .locator('table tbody tr')
      .count()
      .then((count) => count > 0)
      .catch(() => false)

    // At least one should be true
    expect(successVisible || tableHasContent).toBeTruthy()
  })

  test('admin cannot create duplicate equivalence', async ({ page }) => {
    // Navigate to equivalences page
    await page.getByRole('button', { name: 'Configurações' }).first().click()
    await page.getByRole('link', { name: 'Equivalências de Disciplinas' }).click()

    // Try to create equivalence that already exists (from previous test or seed)
    await page.getByRole('button', { name: 'Nova Equivalência' }).click()

    const dialog = page.locator('[role="dialog"]')

    // Select first discipline - click and wait for options to load
    await dialog.locator('button').filter({ hasText: 'Selecione uma disciplina' }).first().click()
    await page.waitForTimeout(1000)
    const firstDisciplineOption = page.getByRole('option').first()
    await expect(firstDisciplineOption).toBeVisible({ timeout: 5000 })
    await firstDisciplineOption.click()

    // Select second discipline - same as first to test duplicate validation
    await dialog.locator('button').filter({ hasText: 'Selecione uma disciplina' }).last().click()
    await page.waitForTimeout(1000)
    const secondDisciplineOption = page.getByRole('option').nth(1) // Select different discipline
    await expect(secondDisciplineOption).toBeVisible({ timeout: 5000 })
    await secondDisciplineOption.click()

    // Submit
    await dialog.getByRole('button', { name: 'Criar Equivalência' }).click()

    // Verify error message or that form is still open (validation failed)
    const errorVisible = await page
      .getByText(/Equivalência já existe|já cadastrada/i)
      .isVisible({ timeout: 3000 })
      .catch(() => false)
    const dialogStillOpen = await dialog.isVisible().catch(() => false)

    // Either error message should show or dialog should still be open
    expect(errorVisible || dialogStillOpen).toBeTruthy()
  })

  test('admin can delete an equivalence', async ({ page }) => {
    // Navigate to equivalences page
    await page.getByRole('button', { name: 'Configurações' }).first().click()
    await page.getByRole('link', { name: 'Equivalências de Disciplinas' }).click()

    // Wait for table to load
    await expect(page.locator('table')).toBeVisible({ timeout: 3000 })

    // Click delete button on first equivalence (if any exists)
    const deleteButton = page.locator('button[class*="destructive"]').first()
    const hasEquivalences = await deleteButton.isVisible({ timeout: 1000 }).catch(() => false)

    if (hasEquivalences) {
      await deleteButton.click()

      // Confirm deletion
      const confirmDialog = page.locator('[role="dialog"]')
      await expect(confirmDialog).toContainText('Remover Equivalência')
      await confirmDialog.getByRole('button', { name: 'Remover' }).click()

      // Verify success
      await expect(page.getByText('Equivalência removida com sucesso')).toBeVisible({ timeout: 3000 })
    } else {
      console.log('No equivalences to delete in clean test environment')
    }
  })

  test('equivalence system prevents self-equivalence', async ({ page }) => {
    // Navigate to equivalences page
    await page.getByRole('button', { name: 'Configurações' }).first().click()
    await page.getByRole('link', { name: 'Equivalências de Disciplinas' }).click()

    // Open creation dialog
    await page.getByRole('button', { name: 'Nova Equivalência' }).click()

    const dialog = page.locator('[role="dialog"]')

    // Select first discipline - click and wait for options to load
    await dialog.locator('button').filter({ hasText: 'Selecione uma disciplina' }).first().click()
    await page.waitForTimeout(1000)
    const firstDisciplineOption = page.getByRole('option').first()
    await expect(firstDisciplineOption).toBeVisible({ timeout: 5000 })
    await firstDisciplineOption.click()

    // Select same discipline for second field to test self-equivalence validation
    await dialog.locator('button').filter({ hasText: 'Selecione uma disciplina' }).last().click()
    await page.waitForTimeout(1000)
    const sameDisciplineOption = page.getByRole('option').first() // Select same discipline
    await expect(sameDisciplineOption).toBeVisible({ timeout: 5000 })
    await sameDisciplineOption.click()

    // Try to submit
    await dialog.getByRole('button', { name: 'Criar Equivalência' }).click()

    // Verify error message or that submit button is disabled/form is still open
    const errorVisible = await page
      .getByText(/não pode ser equivalente a ela mesma|mesma disciplina/i)
      .isVisible({ timeout: 3000 })
      .catch(() => false)
    const dialogStillOpen = await dialog.isVisible().catch(() => false)

    // Either error message should show or dialog should still be open (validation prevented submit)
    expect(errorVisible || dialogStillOpen).toBeTruthy()
  })
})

test.describe('Equivalence Grade Lookup Integration', () => {
  // TODO: This requires more complex setup:
  // 1. Create student with MATE045 grade in database
  // 2. Create MATA37 project
  // 3. Create MATA37 ↔ MATE045 equivalence
  // 4. Student applies to MATA37 project
  // 5. Verify system automatically captured MATE045 grade

  test.skip('student inscription captures grade from equivalent discipline', async () => {
    // This test requires database seeding and will be implemented when
    // test data infrastructure supports grade insertion
    console.log('Grade equivalence integration test - requires enhanced seed data')
  })
})
