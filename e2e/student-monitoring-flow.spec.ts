import { test, expect } from '@playwright/test'
import { setupAuth } from './utils/auth'

/**
 * Student Monitoring Flow E2E Tests
 *
 * Tests specific student flows mentioned in docs/transcrição-reuniao-1.txt:
 * - View available monitoring positions (vagas)
 * - Apply to monitoring positions with required documents
 * - Receive email notifications when selected
 * - Accept or reject monitoring positions
 * - Complete bank account information for scholarship recipients (bolsistas)
 * - View application history and status
 */

test.describe('Student Monitoring Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we start with a clean state
    await page.goto('/')
  })

  test.describe('Viewing and Applying to Monitoring Positions', () => {
    test('should display available monitoring positions with turma information', async ({ page }) => {
      await setupAuth(page, 'student')
      await page.goto('/home/student/vagas')

      // Verify page loads correctly
      await expect(page.locator('h1')).toContainText('Vagas Disponíveis')

      // Check that projects are displayed with turma information
      const projectCards = page.locator('[data-testid="project-card"]')
      await expect(projectCards.first()).toBeVisible()

      // Verify turma is displayed in format: CODIGO (TURMA) - NOME
      await expect(page.locator('text=/MATA\\d+\\s*\\([T]\\d+\\)\\s*-/')).toBeVisible()

      // Verify department filter works
      await page.click('[data-testid="filter-departamento"]')
      await page.click('text=Todos os Departamentos')

      // Check project details are visible
      await expect(page.locator('text=Bolsas Disponíveis')).toBeVisible()
      await expect(page.locator('text=Vagas Voluntárias')).toBeVisible()
    })

    test('should allow student to apply to monitoring position', async ({ page }) => {
      await setupAuth(page, 'student')
      await page.goto('/home/student/vagas')

      // Find an available project and apply
      const firstProject = page.locator('[data-testid="project-card"]').first()
      await firstProject.locator('[data-testid="apply-button"]').click()

      // Fill application form
      await expect(page.locator('text=Inscrição para Monitoria')).toBeVisible()

      // Select type of position desired
      await page.selectOption('[name="tipoVagaPretendida"]', 'BOLSISTA')

      // Upload required documents
      const historicInput = page.locator('input[type="file"]').first()
      await historicInput.setInputFiles('./e2e/fixtures/sample-document.pdf')

      // Submit application
      await page.click('text=Enviar Inscrição')

      // Verify success message
      await expect(page.locator('text=Inscrição realizada com sucesso')).toBeVisible()

      // Verify redirect to applications page
      await expect(page).toHaveURL(/\/home\/student\/inscricao-monitoria/)
    })

    test('should prevent duplicate applications to same project', async ({ page }) => {
      await setupAuth(page, 'student')
      await page.goto('/home/student/vagas')

      // Try to apply to same project twice
      const firstProject = page.locator('[data-testid="project-card"]').first()

      // First application
      await firstProject.locator('[data-testid="apply-button"]').click()
      await page.selectOption('[name="tipoVagaPretendida"]', 'VOLUNTARIO')
      await page.click('text=Enviar Inscrição')

      // Go back to vagas page
      await page.goto('/home/student/vagas')

      // Try to apply again - button should be disabled or show different text
      await expect(firstProject.locator('text=Já Inscrito')).toBeVisible()
    })
  })

  test.describe('Application Management and Status Tracking', () => {
    test('should display student application history with status', async ({ page }) => {
      await setupAuth(page, 'student')
      await page.goto('/home/student/inscricao-monitoria')

      // Verify applications page loads
      await expect(page.locator('h1')).toContainText('Minhas Inscrições')

      // Check application cards are displayed
      const applicationCards = page.locator('[data-testid="application-card"]')
      await expect(applicationCards.first()).toBeVisible()

      // Verify application status is shown
      await expect(page.locator('[data-testid="application-status"]')).toBeVisible()

      // Check project details in application
      await expect(page.locator('text=Projeto:')).toBeVisible()
      await expect(page.locator('text=Professor:')).toBeVisible()
      await expect(page.locator('text=Disciplina:')).toBeVisible()
    })

    test('should show detailed application information', async ({ page }) => {
      await setupAuth(page, 'student')
      await page.goto('/home/student/inscricao-monitoria')

      // Click on application details
      await page.click('[data-testid="view-application-details"]')

      // Verify detailed view opens
      await expect(page.locator('text=Detalhes da Inscrição')).toBeVisible()

      // Check all relevant information is displayed
      await expect(page.locator('text=Status da Inscrição:')).toBeVisible()
      await expect(page.locator('text=Tipo de Vaga Pretendida:')).toBeVisible()
      await expect(page.locator('text=Data de Inscrição:')).toBeVisible()
      await expect(page.locator('text=Documentos Enviados:')).toBeVisible()
    })
  })

  test.describe('Selection Results and Position Management', () => {
    test('should display selection results when available', async ({ page }) => {
      await setupAuth(page, 'student')
      await page.goto('/home/student/resultados')

      // Verify results page loads
      await expect(page.locator('h1')).toContainText('Resultados da Seleção')

      // Check for results when they exist
      const resultCards = page.locator('[data-testid="selection-result"]')

      // If results exist, verify their content
      if ((await resultCards.count()) > 0) {
        await expect(resultCards.first()).toBeVisible()
        await expect(page.locator('text=Projeto:')).toBeVisible()
        await expect(page.locator('text=Status:')).toBeVisible()
        await expect(page.locator('text=Posição:')).toBeVisible()
      }
    })

    test('should allow student to accept monitoring position', async ({ page }) => {
      await setupAuth(page, 'student')
      await page.goto('/home/student/resultados')

      // Look for accepted position (assuming test data exists)
      const acceptedResult = page.locator('[data-testid="selection-result"]:has-text("SELECTED_BOLSISTA")')

      if ((await acceptedResult.count()) > 0) {
        // Accept the position
        await acceptedResult.locator('[data-testid="accept-position"]').click()

        // Confirm acceptance
        await page.click('text=Confirmar Aceitação')

        // Verify success message
        await expect(page.locator('text=Posição aceita com sucesso')).toBeVisible()

        // Verify status change
        await expect(page.locator('text=ACCEPTED_BOLSISTA')).toBeVisible()
      }
    })

    test('should allow student to reject monitoring position', async ({ page }) => {
      await setupAuth(page, 'student')
      await page.goto('/home/student/resultados')

      // Look for selected position that can be rejected
      const selectedResult = page.locator('[data-testid="selection-result"]:has-text("SELECTED_VOLUNTARIO")')

      if ((await selectedResult.count()) > 0) {
        // Reject the position
        await selectedResult.locator('[data-testid="reject-position"]').click()

        // Provide rejection reason
        await page.fill('[name="motivoRecusa"]', 'Conflito de horários com outras disciplinas')

        // Confirm rejection
        await page.click('text=Confirmar Recusa')

        // Verify success message
        await expect(page.locator('text=Posição recusada')).toBeVisible()

        // Verify status change
        await expect(page.locator('text=REJECTED_BY_STUDENT')).toBeVisible()
      }
    })
  })

  test.describe('Bank Account Information for Scholarship Recipients', () => {
    test('should require bank account information for accepted scholarship positions', async ({ page }) => {
      await setupAuth(page, 'student')

      // Go to profile to check/update bank account info
      await page.goto('/home/profile')

      // Verify bank account section exists
      await expect(page.locator('text=Dados Bancários')).toBeVisible()

      // Check required bank fields are present
      await expect(page.locator('[name="banco"]')).toBeVisible()
      await expect(page.locator('[name="agencia"]')).toBeVisible()
      await expect(page.locator('[name="conta"]')).toBeVisible()
      await expect(page.locator('[name="digitoConta"]')).toBeVisible()
    })

    test('should allow student to update bank account information', async ({ page }) => {
      await setupAuth(page, 'student')
      await page.goto('/home/profile')

      // Fill bank account information
      await page.fill('[name="banco"]', 'Banco do Brasil')
      await page.fill('[name="agencia"]', '1234-5')
      await page.fill('[name="conta"]', '12345-6')
      await page.fill('[name="digitoConta"]', '7')

      // Save changes
      await page.click('text=Salvar Alterações')

      // Verify success message
      await expect(page.locator('text=Dados bancários atualizados com sucesso')).toBeVisible()
    })

    test('should validate bank account information format', async ({ page }) => {
      await setupAuth(page, 'student')
      await page.goto('/home/profile')

      // Try to save with invalid bank account format
      await page.fill('[name="banco"]', '')
      await page.fill('[name="agencia"]', 'invalid')
      await page.fill('[name="conta"]', 'invalid')
      await page.fill('[name="digitoConta"]', 'invalid')

      await page.click('text=Salvar Alterações')

      // Verify validation errors
      await expect(page.locator('text=Banco é obrigatório')).toBeVisible()
      await expect(page.locator('text=Formato de agência inválido')).toBeVisible()
      await expect(page.locator('text=Formato de conta inválido')).toBeVisible()
    })
  })

  test.describe('Email Notifications and Communication', () => {
    test('should display notification indicators when student is selected', async ({ page }) => {
      await setupAuth(page, 'student')
      await page.goto('/home/student/dashboard')

      // Check for notification badges or indicators
      const notificationBadge = page.locator('[data-testid="notification-badge"]')

      if ((await notificationBadge.count()) > 0) {
        await expect(notificationBadge).toBeVisible()

        // Click to view notifications
        await notificationBadge.click()

        // Verify notification content
        await expect(page.locator('text=Resultado da Seleção')).toBeVisible()
      }
    })

    test('should show recent activity and important updates', async ({ page }) => {
      await setupAuth(page, 'student')
      await page.goto('/home/student/dashboard')

      // Verify dashboard shows relevant information
      await expect(page.locator('text=Minhas Inscrições')).toBeVisible()
      await expect(page.locator('text=Resultados Recentes')).toBeVisible()

      // Check for quick access links
      await expect(page.locator('a[href="/home/student/vagas"]')).toBeVisible()
      await expect(page.locator('a[href="/home/student/resultados"]')).toBeVisible()
    })
  })

  test.describe('Document Management and Requirements', () => {
    test('should show required documents for monitoring application', async ({ page }) => {
      await setupAuth(page, 'student')
      await page.goto('/home/student/vagas')

      // Start application process
      await page.click('[data-testid="apply-button"]')

      // Verify required documents section
      await expect(page.locator('text=Documentos Obrigatórios')).toBeVisible()
      await expect(page.locator('text=Histórico Escolar')).toBeVisible()
      await expect(page.locator('text=Comprovante de Matrícula')).toBeVisible()
    })

    test('should validate document upload requirements', async ({ page }) => {
      await setupAuth(page, 'student')
      await page.goto('/home/student/vagas')

      await page.click('[data-testid="apply-button"]')

      // Try to submit without uploading required documents
      await page.selectOption('[name="tipoVagaPretendida"]', 'BOLSISTA')
      await page.click('text=Enviar Inscrição')

      // Verify validation error
      await expect(page.locator('text=Histórico escolar é obrigatório')).toBeVisible()
    })
  })
})
