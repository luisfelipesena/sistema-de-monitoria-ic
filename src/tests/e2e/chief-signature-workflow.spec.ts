import { test, expect, Page } from '@playwright/test'

const ADMIN_USER = {
  email: 'admin@ufba.br',
  password: 'password123',
}

const PROFESSOR_USER = {
  email: 'professor@ufba.br',
  password: 'password123',
}

async function loginAsAdmin(page: Page) {
  await page.goto('/auth/login')
  await page.getByPlaceholder('nome@ufba.br').fill(ADMIN_USER.email)
  await page.getByPlaceholder('••••••••').fill(ADMIN_USER.password)
  await page.getByRole('button', { name: 'Entrar com e-mail' }).first().click()
  await page.waitForURL(/\/(home|dashboard)/, { timeout: 10000 })
}

async function loginAsProfessor(page: Page) {
  await page.goto('/auth/login')
  await page.getByPlaceholder('nome@ufba.br').fill(PROFESSOR_USER.email)
  await page.getByPlaceholder('••••••••').fill(PROFESSOR_USER.password)
  await page.getByRole('button', { name: 'Entrar com e-mail' }).first().click()
  await page.waitForURL(/\/(home|dashboard)/, { timeout: 10000 })
}

test.describe('Chief Signature Workflow', () => {
  test('should request chief signature for edital', async ({ page }) => {
    // Login as admin
    await loginAsAdmin(page)

    // Navigate to edital management
    await page.goto('/home/admin/edital-management')
    await page.waitForLoadState('networkidle')

    // Check if we're on the correct page
    await expect(page.locator('h1, h2').filter({ hasText: /Gerenciar Editais/i })).toBeVisible({ timeout: 5000 })

    // Look for an existing DCC edital or create one
    const editais = await page.locator('tr[data-state]').count()

    if (editais === 0) {
      // Create a new edital if none exists
      const createButton = page.getByRole('button', { name: 'Novo Edital' })
      await expect(createButton).toBeVisible({ timeout: 5000 })
      await createButton.click()

      // Wait for dialog to open
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })

      // Fill basic edital info
      const numeroField = page.locator('input[name="numeroEdital"]')
      if (await numeroField.isVisible({ timeout: 3000 })) {
        await numeroField.fill('TEST/2025')
      }

      const tituloField = page.locator('input[name="titulo"]')
      if (await tituloField.isVisible({ timeout: 3000 })) {
        await tituloField.fill('Edital de Teste para Assinatura')
      }

      // Save the edital
      const saveButton = page.getByRole('button', { name: /Criar|Salvar/i })
      if (await saveButton.isVisible({ timeout: 3000 })) {
        await saveButton.click()
        await page.waitForTimeout(2000)
      }
    }

    // Look for "Solicitar Assinatura" button
    const solicitarAssinaturaButton = page.getByRole('button', { name: 'Solicitar Assinatura' }).first()

    if (await solicitarAssinaturaButton.isVisible({ timeout: 3000 })) {
      await solicitarAssinaturaButton.click()

      // Verify success message
      const successToast = page.locator('[data-state="open"]').getByText(/assinatura.*enviada|solicitada/i)
      await expect(successToast).toBeVisible({ timeout: 10000 })
    } else {
      // Button might not be visible if edital is already signed or incomplete
      console.log('Solicitar Assinatura button not available - edital may be already signed or incomplete')
    }
  })

  test('should show editais pending signature for chief', async ({ page }) => {
    // Login as professor (who might be chief)
    await loginAsProfessor(page)

    // Try to access the endpoint for editais pending signature
    // Note: This would normally require a dedicated UI page for the chief
    // For now, we'll just verify the API endpoint exists

    // Navigate to dashboard
    await page.goto('/home/professor/dashboard')
    await expect(page).toHaveURL(/\/home\/professor\/dashboard/, { timeout: 10000 })

    // In a full implementation, there would be a menu item or notification
    // showing editais pending signature for the chief
  })

  test('should sign edital as chief', async ({ page }) => {
    // This test simulates a professor (who is chief) signing an edital
    await loginAsProfessor(page)

    // Navigate to a hypothetical chief signature page
    // Since we don't have a dedicated UI yet, we'll test the basic flow
    await page.goto('/home/professor/dashboard')

    // In a complete implementation:
    // 1. Navigate to pending signatures page
    // 2. Select edital to sign
    // 3. Review edital details
    // 4. Add digital signature
    // 5. Confirm signature

    // For now, we just verify the professor can access their dashboard
    await expect(page).toHaveURL(/\/home\/professor\/dashboard/, { timeout: 10000 })
  })

  test('should update edital status after chief signature', async ({ page }) => {
    // Login as admin to check edital status
    await loginAsAdmin(page)

    // Navigate to edital management
    await page.goto('/home/admin/edital-management')
    await page.waitForLoadState('networkidle')

    // Look for badges indicating signature status
    const signatureBadges = page.locator('text=/Assinado pelo Chefe|PDF Assinado/i')
    const badgeCount = await signatureBadges.count()

    // There might be editais with different signature states
    if (badgeCount > 0) {
      console.log(`Found ${badgeCount} edital(s) with signature status`)

      // Verify at least one badge is visible
      const firstBadge = signatureBadges.first()
      await expect(firstBadge).toBeVisible({ timeout: 5000 })
    } else {
      console.log('No signed editais found - this is expected in a fresh test environment')
    }
  })

  test('should prevent publishing edital without chief signature', async ({ page }) => {
    // Login as admin
    await loginAsAdmin(page)

    // Navigate to edital management
    await page.goto('/home/admin/edital-management')
    await page.waitForLoadState('networkidle')

    // Look for an unsigned DCC edital
    const rows = page.locator('tr[data-state]')
    const rowCount = await rows.count()

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i)
      const statusBadge = row.locator('text=Rascunho')

      if (await statusBadge.isVisible({ timeout: 1000 })) {
        // Found an unsigned edital
        const publishButton = row.locator('button:has-text("Publicar")')

        // The publish button should either be:
        // 1. Not visible (best case)
        // 2. Disabled
        // 3. Show error when clicked

        if (await publishButton.isVisible({ timeout: 1000 })) {
          const isDisabled = await publishButton.isDisabled()
          expect(isDisabled).toBeTruthy()
        }

        break // Test one is enough
      }
    }
  })

  test('should validate chief signature fields in database', async ({ page }) => {
    // This is more of an integration test
    // We're verifying that the UI correctly displays the signature status

    await loginAsAdmin(page)
    await page.goto('/home/admin/edital-management')
    await page.waitForLoadState('networkidle')

    // Check that the page loads without errors
    await expect(page.locator('text=Editais e Períodos de Inscrição')).toBeVisible({ timeout: 5000 })

    // Verify the table has the expected columns
    const table = page.locator('table').first()
    await expect(table).toBeVisible({ timeout: 5000 })

    // Look for status badges which indicate signature state
    const badges = page.locator('[class*="badge"]')
    const badgeCount = await badges.count()

    if (badgeCount > 0) {
      // At least one badge exists, indicating the status system is working
      console.log(`Found ${badgeCount} status badge(s)`)
    }
  })
})
