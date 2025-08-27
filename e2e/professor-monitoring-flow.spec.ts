import { test, expect } from '@playwright/test'
import { setupAuth } from './utils/auth'

/**
 * Professor Monitoring Flow E2E Tests
 *
 * Tests specific professor flows mentioned in docs/transcrição-reuniao-1.txt:
 * - Create monitoring projects with automatic pre-filling from course planning
 * - Submit projects for approval with digital signature workflow
 * - Evaluate student applications and conduct selection process
 * - Generate selection results and notify students via email
 * - Manage monitor positions and document signing process
 */

test.describe('Professor Monitoring Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test.describe('Project Creation and Submission (Module 1)', () => {
    test('should create monitoring project with automatic pre-filling', async ({ page }) => {
      await setupAuth(page, 'professor')
      await page.goto('/home/professor/projetos')

      // Verify projects dashboard loads
      await expect(page.locator('h1')).toContainText('Meus Projetos')

      // Create new project
      await page.click('text=Novo Projeto')
      await expect(page).toHaveURL(/\/home\/professor\/projetos\/novo/)

      // Verify form fields are available
      await expect(page.locator('[name="titulo"]')).toBeVisible()
      await expect(page.locator('[name="descricao"]')).toBeVisible()
      await expect(page.locator('[name="ano"]')).toBeVisible()
      await expect(page.locator('[name="semestre"]')).toBeVisible()

      // Fill project information
      await page.fill('[name="titulo"]', 'Monitoria de Cálculo Diferencial e Integral')
      await page.fill('[name="descricao"]', 'Projeto para auxiliar estudantes nas disciplinas de cálculo')
      await page.selectOption('[name="ano"]', '2025')
      await page.selectOption('[name="semestre"]', 'PRIMEIRO')

      // Select disciplines with turma information
      await page.click('[data-testid="add-discipline"]')
      await page.selectOption('[data-testid="select-discipline"]', '1') // MATA37
      await page.selectOption('[data-testid="select-turma"]', 'T01')

      // Set monitor positions
      await page.fill('[name="bolsasDisponibilizadas"]', '2')
      await page.fill('[name="voluntariosSolicitados"]', '1')

      // Save as draft first
      await page.click('text=Salvar Rascunho')
      await expect(page.locator('text=Projeto salvo como rascunho')).toBeVisible()
    })

    test('should edit existing draft project', async ({ page }) => {
      await setupAuth(page, 'professor')
      await page.goto('/home/professor/projetos')

      // Find and edit a draft project
      const draftProject = page.locator('[data-testid="project-card"]:has-text("DRAFT")')
      await draftProject.locator('[data-testid="edit-project"]').click()

      // Update project details
      await page.fill('[name="titulo"]', 'Monitoria Atualizada - Álgebra Linear')
      await page.fill('[name="descricao"]', 'Projeto atualizado com novas metodologias de ensino')

      // Save changes
      await page.click('text=Salvar Alterações')
      await expect(page.locator('text=Projeto atualizado com sucesso')).toBeVisible()
    })

    test('should submit project for approval', async ({ page }) => {
      await setupAuth(page, 'professor')
      await page.goto('/home/professor/projetos')

      // Find draft project and submit for approval
      const draftProject = page.locator('[data-testid="project-card"]:has-text("DRAFT")')
      await draftProject.locator('[data-testid="submit-project"]').click()

      // Confirm submission
      await expect(page.locator('text=Submeter Projeto para Aprovação')).toBeVisible()
      await page.click('text=Confirmar Submissão')

      // Verify success and status change
      await expect(page.locator('text=Projeto submetido com sucesso')).toBeVisible()
      await expect(page.locator('text=SUBMITTED')).toBeVisible()
    })

    test('should generate PDF preview of project', async ({ page }) => {
      await setupAuth(page, 'professor')
      await page.goto('/home/professor/projetos/novo')

      // Fill minimal required fields
      await page.fill('[name="titulo"]', 'Projeto Teste PDF')
      await page.fill('[name="descricao"]', 'Descrição para teste de PDF')
      await page.selectOption('[name="ano"]', '2025')
      await page.selectOption('[name="semestre"]', 'PRIMEIRO')

      // Generate PDF preview
      await page.click('[data-testid="generate-pdf-preview"]')

      // Verify PDF preview appears
      await expect(page.locator('[data-testid="pdf-preview"]')).toBeVisible()
      await expect(page.locator('text=Preview do PDF')).toBeVisible()
    })
  })

  test.describe('Student Application Evaluation (Module 3)', () => {
    test('should display student applications for professor projects', async ({ page }) => {
      await setupAuth(page, 'professor')
      await page.goto('/home/professor/candidatos')

      // Verify candidates page loads
      await expect(page.locator('h1')).toContainText('Candidatos Inscritos')

      // Check for project selection dropdown
      await expect(page.locator('[data-testid="select-project"]')).toBeVisible()

      // Select a project to view candidates
      await page.selectOption('[data-testid="select-project"]', '1')

      // Verify candidate list appears
      await expect(page.locator('[data-testid="candidate-list"]')).toBeVisible()
    })

    test('should evaluate student application with grades', async ({ page }) => {
      await setupAuth(page, 'professor')
      await page.goto('/home/professor/candidatos')

      // Select project with applications
      await page.selectOption('[data-testid="select-project"]', '1')

      // Start evaluation of first candidate
      const firstCandidate = page.locator('[data-testid="candidate-row"]').first()
      await firstCandidate.locator('[data-testid="evaluate-button"]').click()

      // Fill evaluation form
      await expect(page.locator('text=Avaliar Candidato')).toBeVisible()

      await page.fill('[name="notaDisciplina"]', '8.5')
      await page.fill('[name="notaSelecao"]', '9.0')
      await page.fill('[name="coeficienteRendimento"]', '8.2')
      await page.fill(
        '[name="feedbackProfessor"]',
        'Excelente performance na entrevista e conhecimento sólido da matéria'
      )

      // Save evaluation
      await page.click('text=Salvar Avaliação')
      await expect(page.locator('text=Avaliação salva com sucesso')).toBeVisible()

      // Verify evaluation appears in candidate row
      await expect(firstCandidate.locator('[data-testid="evaluation-status"]')).toContainText('Avaliado')
    })

    test('should use quick evaluation for multiple candidates', async ({ page }) => {
      await setupAuth(page, 'professor')
      await page.goto('/home/professor/grade-applications')

      // Verify quick evaluation page loads
      await expect(page.locator('h1')).toContainText('Avaliação Rápida')

      // Select project
      await page.selectOption('[data-testid="select-project"]', '1')

      // Use quick evaluation for first candidate
      const firstCandidate = page.locator('[data-testid="quick-eval-card"]').first()

      // Set rating
      await firstCandidate.locator('[data-testid="star-4"]').click()

      // Add quick notes
      await firstCandidate.locator('[name="quickNotes"]').fill('Bom candidato, conhecimento adequado')

      // Make decision
      await firstCandidate.locator('[data-testid="decision-select"]').selectOption('SELECT_SCHOLARSHIP')

      // Save quick evaluation
      await firstCandidate.locator('[data-testid="save-quick-eval"]').click()

      await expect(page.locator('text=Avaliação rápida salva')).toBeVisible()
    })
  })

  test.describe('Selection Process and Results Publication (Module 3)', () => {
    test('should generate selection results and ata', async ({ page }) => {
      await setupAuth(page, 'professor')
      await page.goto('/home/professor/publicar-resultados')

      // Verify results publication page
      await expect(page.locator('h1')).toContainText('Publicar Resultados')

      // Select project with evaluated candidates
      await page.selectOption('[data-testid="select-project"]', '1')

      // Generate ata de seleção
      await page.click('[data-testid="generate-ata"]')
      await expect(page.locator('text=Gerar Ata de Seleção')).toBeVisible()

      // Fill ata information
      await page.fill('[name="dataSelecao"]', '2025-02-15')
      await page.fill('[name="localSelecao"]', 'Sala 201 - Instituto de Matemática')
      await page.fill('[name="observacoes"]', 'Processo seletivo realizado conforme edital')

      // Confirm ata generation
      await page.click('text=Confirmar Geração')
      await expect(page.locator('text=Ata gerada com sucesso')).toBeVisible()
    })

    test('should select monitors for available positions', async ({ page }) => {
      await setupAuth(page, 'professor')
      await page.goto('/home/professor/publicar-resultados')

      // Select project
      await page.selectOption('[data-testid="select-project"]', '1')

      // Select monitor for scholarship position
      const topCandidate = page.locator('[data-testid="candidate-row"]').first()
      await topCandidate.locator('[data-testid="select-scholarship"]').click()

      // Confirm selection
      await expect(page.locator('text=Confirmar Seleção como Bolsista')).toBeVisible()
      await page.click('text=Confirmar Seleção')

      // Verify selection appears
      await expect(page.locator('text=Monitor selecionado com sucesso')).toBeVisible()
      await expect(topCandidate.locator('[data-testid="selection-status"]')).toContainText('SELECTED_BOLSISTA')
    })

    test('should publish final results and send notifications', async ({ page }) => {
      await setupAuth(page, 'professor')
      await page.goto('/home/professor/publicar-resultados')

      // Select project with selections made
      await page.selectOption('[data-testid="select-project"]', '1')

      // Publish results
      await page.click('[data-testid="publish-results"]')
      await expect(page.locator('text=Publicar Resultados Finais')).toBeVisible()

      // Confirm publication and email sending
      await page.click('text=Confirmar e Enviar Emails')

      // Verify success
      await expect(page.locator('text=Resultados publicados e emails enviados')).toBeVisible()
    })
  })

  test.describe('Monitor Management and Document Workflow (Module 4)', () => {
    test('should manage monitor confirmation process', async ({ page }) => {
      await setupAuth(page, 'professor')
      await page.goto('/home/professor/volunteer-management')

      // Verify monitor management page
      await expect(page.locator('h1')).toContainText('Gerenciar Monitores')

      // View monitors awaiting confirmation
      await expect(page.locator('[data-testid="pending-confirmations"]')).toBeVisible()

      // Check monitor response status
      const firstMonitor = page.locator('[data-testid="monitor-row"]').first()
      await expect(firstMonitor.locator('[data-testid="response-status"]')).toBeVisible()
    })

    test('should generate and manage terms of commitment', async ({ page }) => {
      await setupAuth(page, 'professor')
      await page.goto('/home/professor/termos-compromisso')

      // Verify terms management page
      await expect(page.locator('h1')).toContainText('Termos de Compromisso')

      // Generate term for confirmed monitor
      const confirmedMonitor = page.locator('[data-testid="confirmed-monitor"]').first()
      await confirmedMonitor.locator('[data-testid="generate-term"]').click()

      // Verify term generation
      await expect(page.locator('text=Termo gerado com sucesso')).toBeVisible()

      // Download generated term
      const downloadPromise = page.waitForEvent('download')
      await confirmedMonitor.locator('[data-testid="download-term"]').click()
      const download = await downloadPromise
      expect(download.suggestedFilename()).toMatch(/termo.*\.pdf$/)
    })

    test('should track document signing workflow', async ({ page }) => {
      await setupAuth(page, 'professor')
      await page.goto('/home/professor/assinatura-documentos')

      // Verify document signing page
      await expect(page.locator('h1')).toContainText('Assinatura de Documentos')

      // Check projects requiring professor signature
      await expect(page.locator('[data-testid="projects-pending-signature"]')).toBeVisible()

      // Sign project document
      const projectDoc = page.locator('[data-testid="project-document"]').first()
      await projectDoc.locator('[data-testid="sign-document"]').click()

      // Digital signature interface
      await expect(page.locator('[data-testid="signature-canvas"]')).toBeVisible()

      // Simulate signature drawing
      const canvas = page.locator('[data-testid="signature-canvas"]')
      await canvas.click({ position: { x: 100, y: 50 } })
      await page.mouse.down()
      await page.mouse.move(200, 100)
      await page.mouse.up()

      // Confirm signature
      await page.click('text=Confirmar Assinatura')
      await expect(page.locator('text=Documento assinado com sucesso')).toBeVisible()
    })
  })

  test.describe('Project Analytics and Reporting', () => {
    test('should display project statistics and analytics', async ({ page }) => {
      await setupAuth(page, 'professor')
      await page.goto('/home/professor/dashboard')

      // Verify professor dashboard
      await expect(page.locator('h1')).toContainText('Dashboard do Professor')

      // Check key metrics
      await expect(page.locator('[data-testid="total-projects"]')).toBeVisible()
      await expect(page.locator('[data-testid="active-monitors"]')).toBeVisible()
      await expect(page.locator('[data-testid="pending-evaluations"]')).toBeVisible()

      // Verify recent activities section
      await expect(page.locator('text=Atividades Recentes')).toBeVisible()
      await expect(page.locator('text=Próximos Prazos')).toBeVisible()
    })

    test('should generate ata de seleção with proper formatting', async ({ page }) => {
      await setupAuth(page, 'professor')
      await page.goto('/home/professor/atas-selecao')

      // Verify atas page
      await expect(page.locator('h1')).toContainText('Atas de Seleção')

      // Select project to generate ata
      await page.selectOption('[data-testid="select-project"]', '1')

      // Generate new ata
      await page.click('[data-testid="generate-new-ata"]')

      // Verify ata preview
      await expect(page.locator('[data-testid="ata-preview"]')).toBeVisible()
      await expect(page.locator('text=Total de Inscritos:')).toBeVisible()
      await expect(page.locator('text=Total de Comparecentes:')).toBeVisible()
      await expect(page.locator('text=Candidatos Aprovados:')).toBeVisible()

      // Download ata PDF
      const downloadPromise = page.waitForEvent('download')
      await page.click('[data-testid="download-ata"]')
      const download = await downloadPromise
      expect(download.suggestedFilename()).toMatch(/ata.*\.pdf$/)
    })
  })

  test.describe('Communication and Notification Management', () => {
    test('should send notifications to students about selection results', async ({ page }) => {
      await setupAuth(page, 'professor')
      await page.goto('/home/professor/publicar-resultados')

      // Select project with finalized results
      await page.selectOption('[data-testid="select-project"]', '1')

      // Send individual notification
      const selectedStudent = page.locator('[data-testid="selected-student"]').first()
      await selectedStudent.locator('[data-testid="send-notification"]').click()

      // Customize notification message
      await page.fill('[name="customMessage"]', 'Parabéns! Você foi selecionado como monitor bolsista.')

      // Send notification
      await page.click('text=Enviar Notificação')
      await expect(page.locator('text=Notificação enviada com sucesso')).toBeVisible()
    })

    test('should manage email communication with students', async ({ page }) => {
      await setupAuth(page, 'professor')
      await page.goto('/home/professor/candidatos')

      // Select project
      await page.selectOption('[data-testid="select-project"]', '1')

      // Send bulk email to all candidates
      await page.click('[data-testid="send-bulk-email"]')

      // Compose email
      await page.fill('[name="emailSubject"]', 'Informações sobre o Processo Seletivo')
      await page.fill(
        '[name="emailBody"]',
        'Prezados candidatos, seguem informações importantes sobre o processo seletivo...'
      )

      // Send email
      await page.click('text=Enviar Email')
      await expect(page.locator('text=Email enviado para todos os candidatos')).toBeVisible()
    })
  })
})
