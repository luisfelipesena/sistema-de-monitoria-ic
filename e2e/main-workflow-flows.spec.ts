import { test, expect } from '@playwright/test'
import { setupAuth } from './utils/auth'

/**
 * E2E Tests for Main System Workflows
 *
 * Based on docs/transcrição-reuniao-1.txt, this file tests the 4 main modules:
 *
 * Module 1: Professor project creation and submission
 * Module 2: Student application and inscription
 * Module 3: Professor selection process and student notifications
 * Module 4: Student acceptance/rejection and document signing
 */

test.describe('Main System Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Reset database state before each test
    await page.goto('/')
  })

  test.describe('Module 1: Professor Project Creation and Submission Flow', () => {
    test('should allow professor to create, submit and get project approved', async ({ page }) => {
      // Setup professor authentication
      await setupAuth(page, 'professor')

      await page.goto('/home/professor/projetos')

      // Step 1: Create new project
      await page.click('text=Novo Projeto')
      await expect(page).toHaveURL(/\/home\/professor\/projetos\/novo/)

      // Fill project form with required data
      await page.fill('[name="titulo"]', 'Projeto de Monitoria - Matemática A')
      await page.fill('[name="descricao"]', 'Projeto para auxiliar alunos em cálculo diferencial e integral')
      await page.selectOption('[name="ano"]', '2025')
      await page.selectOption('[name="semestre"]', 'PRIMEIRO')

      // Select department and discipline
      await page.click('[data-testid="select-departamento"]')
      await page.click('text=Departamento de Matemática')

      await page.click('[data-testid="select-disciplina"]')
      await page.click('text=MATA37')

      // Set monitor positions
      await page.fill('[name="bolsasDisponibilizadas"]', '2')
      await page.fill('[name="voluntariosSolicitados"]', '1')

      // Save as draft first
      await page.click('text=Salvar Rascunho')
      await expect(page.locator('text=Projeto salvo como rascunho')).toBeVisible()

      // Navigate back to projects list
      await page.goto('/home/professor/projetos')
      await expect(page.locator('text=DRAFT').first()).toBeVisible()

      // Step 2: Submit project for approval
      await page.click('[data-testid="project-actions"]')
      await page.click('text=Submeter para Aprovação')
      await page.click('text=Confirmar Submissão')

      await expect(page.locator('text=SUBMITTED').first()).toBeVisible()
      await expect(page.locator('text=Projeto submetido com sucesso')).toBeVisible()
    })

    test('should allow professor to edit draft project', async ({ page }) => {
      await setupAuth(page, 'professor')
      await page.goto('/home/professor/projetos')

      // Click on edit draft project (assumes one exists)
      await page.click('[data-testid="edit-project-draft"]')

      // Update project details
      await page.fill('[name="titulo"]', 'Projeto Atualizado - Física I')
      await page.fill('[name="descricao"]', 'Descrição atualizada do projeto')

      await page.click('text=Salvar Alterações')
      await expect(page.locator('text=Projeto atualizado com sucesso')).toBeVisible()
    })
  })

  test.describe('Module 2: Student Application and Inscription Flow', () => {
    test('should allow student to view available positions and apply', async ({ page }) => {
      // Setup student authentication
      await setupAuth(page, 'student')

      // Navigate to available positions
      await page.goto('/home/student/vagas')

      // Verify student can see approved projects with available positions
      await expect(page.locator('[data-testid="project-card"]').first()).toBeVisible()
      await expect(page.locator('text=Vagas Disponíveis')).toBeVisible()

      // Filter by department
      await page.click('[data-testid="filter-departamento"]')
      await page.click('text=Departamento de Matemática')

      // Apply to a project
      await page.click('[data-testid="apply-project"]')

      // Fill application form
      await page.selectOption('[name="tipoVagaPretendida"]', 'BOLSISTA')

      // Upload required documents (mock file upload)
      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles('./e2e/fixtures/sample-document.pdf')

      // Submit application
      await page.click('text=Enviar Inscrição')
      await expect(page.locator('text=Inscrição realizada com sucesso')).toBeVisible()

      // Verify application appears in student's applications
      await page.goto('/home/student/inscricao-monitoria')
      await expect(page.locator('[data-testid="application-status"]')).toContainText('SUBMITTED')
    })

    test('should show student application history and status', async ({ page }) => {
      await setupAuth(page, 'student')
      await page.goto('/home/student/inscricao-monitoria')

      // Verify student can see their application history
      await expect(page.locator('[data-testid="application-list"]')).toBeVisible()
      await expect(page.locator('text=Minhas Inscrições')).toBeVisible()

      // Check application details
      await page.click('[data-testid="view-application-details"]')
      await expect(page.locator('text=Detalhes da Inscrição')).toBeVisible()
      await expect(page.locator('text=Status:')).toBeVisible()
      await expect(page.locator('text=Projeto:')).toBeVisible()
    })
  })

  test.describe('Module 3: Professor Selection Process and Student Notifications', () => {
    test('should allow professor to evaluate candidates and make selections', async ({ page }) => {
      await setupAuth(page, 'professor')

      // Navigate to candidate evaluation
      await page.goto('/home/professor/candidatos')

      // Verify professor can see applications for their projects
      await expect(page.locator('[data-testid="candidate-list"]')).toBeVisible()
      await expect(page.locator('text=Candidatos Inscritos')).toBeVisible()

      // Select a project to evaluate
      await page.click('[data-testid="select-project-candidates"]')

      // Evaluate first candidate
      await page.click('[data-testid="evaluate-candidate"]')

      // Fill evaluation form
      await page.fill('[name="notaDisciplina"]', '8.5')
      await page.fill('[name="notaSelecao"]', '9.0')
      await page.fill('[name="coeficienteRendimento"]', '8.2')
      await page.fill('[name="feedbackProfessor"]', 'Excelente candidato, demonstrou conhecimento sólido')

      await page.click('text=Salvar Avaliação')
      await expect(page.locator('text=Avaliação salva com sucesso')).toBeVisible()

      // Proceed to selection
      await page.goto('/home/professor/publicar-resultados')

      // Select monitor for position
      await page.click('[data-testid="select-monitor"]')
      await page.selectOption('[name="tipoVaga"]', 'BOLSISTA')
      await page.click('text=Confirmar Seleção')

      await expect(page.locator('text=Monitor selecionado com sucesso')).toBeVisible()
    })

    test('should allow professor to publish results and notify students', async ({ page }) => {
      await setupAuth(page, 'professor')
      await page.goto('/home/professor/publicar-resultados')

      // Verify professor can see selection results
      await expect(page.locator('text=Resultados da Seleção')).toBeVisible()

      // Generate and publish results
      await page.click('[data-testid="generate-results"]')
      await expect(page.locator('text=Gerar Ata de Seleção')).toBeVisible()

      // Confirm and send notifications
      await page.click('text=Publicar Resultados')
      await page.click('text=Enviar Notificações')

      await expect(page.locator('text=Resultados publicados e notificações enviadas')).toBeVisible()
    })
  })

  test.describe('Module 4: Student Acceptance/Rejection and Document Signing', () => {
    test('should allow student to accept monitor position and sign documents', async ({ page }) => {
      await setupAuth(page, 'student')

      // Check for notifications about selection
      await page.goto('/home/student/resultados')

      // Verify student can see selection results
      await expect(page.locator('text=Resultados da Seleção')).toBeVisible()
      await expect(page.locator('[data-testid="selection-result"]')).toBeVisible()

      // Accept monitor position
      await page.click('[data-testid="accept-position"]')

      // Confirm acceptance
      await page.click('text=Confirmar Aceitação')
      await expect(page.locator('text=Posição aceita com sucesso')).toBeVisible()

      // Navigate to document signing
      await page.goto('/home/student/dashboard')
      await expect(page.locator('text=Documentos Pendentes')).toBeVisible()

      // Sign required documents
      await page.click('[data-testid="sign-documents"]')

      // Digital signature process
      await page.click('[data-testid="signature-canvas"]')
      // Simulate drawing signature
      await page.mouse.move(100, 100)
      await page.mouse.down()
      await page.mouse.move(200, 150)
      await page.mouse.up()

      await page.click('text=Confirmar Assinatura')
      await expect(page.locator('text=Documento assinado com sucesso')).toBeVisible()
    })

    test('should allow student to reject monitor position', async ({ page }) => {
      await setupAuth(page, 'student')
      await page.goto('/home/student/resultados')

      // Reject monitor position
      await page.click('[data-testid="reject-position"]')

      // Provide rejection reason
      await page.fill('[name="motivoRecusa"]', 'Conflito de horários com outras atividades acadêmicas')

      await page.click('text=Confirmar Recusa')
      await expect(page.locator('text=Posição recusada')).toBeVisible()
    })
  })

  test.describe('Admin Complete Workflow', () => {
    test('should allow admin to manage entire monitoring process', async ({ page }) => {
      await setupAuth(page, 'admin')

      // Step 1: Create and manage academic periods
      await page.goto('/home/admin/dashboard')
      await expect(page.locator('text=Painel Administrativo')).toBeVisible()

      // Step 2: Review and approve submitted projects
      await page.goto('/home/admin/manage-projects')
      await expect(page.locator('text=Gerenciar Projetos')).toBeVisible()

      // Approve a submitted project
      await page.click('[data-testid="approve-project"]')
      await page.click('text=Confirmar Aprovação')
      await expect(page.locator('text=Projeto aprovado com sucesso')).toBeVisible()

      // Step 3: Monitor application process
      await page.goto('/home/admin/analytics')
      await expect(page.locator('text=Analytics')).toBeVisible()
      await expect(page.locator('[data-testid="applications-count"]')).toBeVisible()

      // Step 4: Generate PROGRAD consolidation report
      await page.goto('/home/admin/consolidacao-prograd')
      await expect(page.locator('text=Consolidação PROGRAD')).toBeVisible()

      await page.click('[data-testid="generate-prograd-report"]')
      await expect(page.locator('text=Relatório gerado com sucesso')).toBeVisible()

      // Download report
      const downloadPromise = page.waitForEvent('download')
      await page.click('text=Baixar Planilha')
      const download = await downloadPromise

      expect(download.suggestedFilename()).toMatch(/\.xlsx$/)
    })

    test('should allow admin to manage users and send notifications', async ({ page }) => {
      await setupAuth(page, 'admin')

      // Manage professors
      await page.goto('/home/admin/professores')
      await expect(page.locator('text=Gerenciar Professores')).toBeVisible()

      // Invite new professor
      await page.goto('/home/admin/invite-professor')
      await page.fill('[name="email"]', 'novo.professor@ufba.br')
      await page.fill('[name="nomeCompleto"]', 'Professor Novo')
      await page.selectOption('[name="departamentoId"]', '1')

      await page.click('text=Enviar Convite')
      await expect(page.locator('text=Convite enviado com sucesso')).toBeVisible()

      // Manage students
      await page.goto('/home/admin/alunos')
      await expect(page.locator('text=Gerenciar Alunos')).toBeVisible()

      // View student applications and monitor bank account data
      await page.click('[data-testid="view-student-details"]')
      await expect(page.locator('text=Dados Bancários')).toBeVisible()
      await expect(page.locator('[data-testid="bank-account-info"]')).toBeVisible()
    })
  })

  test.describe('Integration: Complete End-to-End Flow', () => {
    test('should complete full monitoring process from project creation to final reporting', async ({ page }) => {
      // This test simulates the complete flow across all 4 modules

      // Module 1: Professor creates and submits project
      await setupAuth(page, 'professor')
      await page.goto('/home/professor/projetos/novo')

      // Create comprehensive project
      await page.fill('[name="titulo"]', 'Monitoria Completa - Algoritmos')
      await page.fill('[name="descricao"]', 'Projeto completo para testar todo o fluxo do sistema')
      await page.selectOption('[name="ano"]', '2025')
      await page.selectOption('[name="semestre"]', 'PRIMEIRO')
      await page.fill('[name="bolsasDisponibilizadas"]', '3')
      await page.fill('[name="voluntariosSolicitados"]', '2')

      await page.click('text=Submeter para Aprovação')
      await page.click('text=Confirmar Submissão')

      // Admin approves project
      await setupAuth(page, 'admin')
      await page.goto('/home/admin/manage-projects')
      await page.click('[data-testid="approve-project"]')
      await page.click('text=Confirmar Aprovação')

      // Module 2: Student applies
      await setupAuth(page, 'student')
      await page.goto('/home/student/vagas')
      await page.click('[data-testid="apply-project"]')
      await page.selectOption('[name="tipoVagaPretendida"]', 'BOLSISTA')
      await page.click('text=Enviar Inscrição')

      // Module 3: Professor evaluates and selects
      await setupAuth(page, 'professor')
      await page.goto('/home/professor/candidatos')
      await page.click('[data-testid="evaluate-candidate"]')
      await page.fill('[name="notaDisciplina"]', '9.0')
      await page.fill('[name="notaSelecao"]', '8.5')
      await page.fill('[name="coeficienteRendimento"]', '8.8')
      await page.click('text=Salvar Avaliação')

      await page.goto('/home/professor/publicar-resultados')
      await page.click('[data-testid="select-monitor"]')
      await page.click('text=Publicar Resultados')

      // Module 4: Student accepts and signs
      await setupAuth(page, 'student')
      await page.goto('/home/student/resultados')
      await page.click('[data-testid="accept-position"]')
      await page.click('text=Confirmar Aceitação')

      // Final verification: Admin generates final report
      await setupAuth(page, 'admin')
      await page.goto('/home/admin/consolidacao-prograd')
      await page.click('[data-testid="generate-prograd-report"]')
      await expect(page.locator('text=Relatório gerado com sucesso')).toBeVisible()

      // Verify all modules completed successfully
      await page.goto('/home/admin/analytics')
      await expect(page.locator('[data-testid="completed-processes"]')).toBeVisible()
    })
  })
})
