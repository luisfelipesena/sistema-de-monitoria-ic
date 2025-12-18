import type { db } from '@/server/db'
import { sendPlanilhaPROGRADEmail } from '@/server/lib/email'
import { NotFoundError, UnauthorizedError, ValidationError } from '@/server/lib/errors'
import minioClient, { bucketName } from '@/server/lib/minio'
import { PDFService } from '@/server/lib/pdf-service'
import type { AdminType, DashboardMetrics, Semestre, UserRole } from '@/types'
import { ADMIN, APPROVED, DRAFT, SUBMITTED, TIPO_PROPOSICAO_COLETIVA, TIPO_PROPOSICAO_INDIVIDUAL } from '@/types'
import { env } from '@/utils/env'
import { logger } from '@/utils/logger'
import { sanitizeForFilename } from '@/utils/string-normalization'
import { v4 as uuidv4 } from 'uuid'
import ExcelJS from 'exceljs'
import { createAnalyticsRepository } from './analytics-repository'

const EMAIL_IC_CHAVE = 'EMAIL_INSTITUTO_COMPUTACAO'

type Database = typeof db
const log = logger.child({ context: 'AnalyticsService' })

/**
 * Check if a project has a signed PDF in MinIO
 * Searches in propostas_assinadas/ by projetoId metadata
 */
async function checkProjectHasPdfInMinio(projetoId: number): Promise<boolean> {
  return new Promise((resolve) => {
    const prefix = 'propostas_assinadas/'
    const objectsStream = minioClient.listObjectsV2(bucketName, prefix, true)

    const pdfFiles: string[] = []

    objectsStream.on('data', (obj) => {
      if (obj.name?.endsWith('.pdf')) {
        pdfFiles.push(obj.name)
      }
    })

    objectsStream.on('error', (err) => {
      log.warn({ projetoId, error: err }, 'Error checking MinIO for project PDF')
      resolve(false)
    })

    objectsStream.on('end', async () => {
      // Check metadata for matching projetoId
      for (const fileName of pdfFiles) {
        try {
          const stat = await minioClient.statObject(bucketName, fileName)
          const metaProjetoId = stat.metaData?.['projeto-id'] || stat.metaData?.['x-amz-meta-projeto-id']
          if (metaProjetoId === projetoId.toString()) {
            resolve(true)
            return
          }
        } catch {
          // Skip files we can't stat
        }
      }
      resolve(false)
    })
  })
}

/**
 * Check multiple projects for PDFs in MinIO in parallel
 */
async function checkProjectsHavePdfsInMinio(projetoIds: number[]): Promise<Set<number>> {
  const results = await Promise.all(
    projetoIds.map(async (id) => {
      const hasPdf = await checkProjectHasPdfInMinio(id)
      return { id, hasPdf }
    })
  )

  return new Set(results.filter((r) => r.hasPdf).map((r) => r.id))
}

export function createAnalyticsService(db: Database) {
  const repo = createAnalyticsRepository(db)

  return {
    async getDashboardMetrics(userRole: UserRole, adminType?: AdminType | null): Promise<DashboardMetrics> {
      if (userRole !== ADMIN) {
        throw new UnauthorizedError('Acesso permitido apenas para administradores')
      }

      const now = new Date()

      // Pass adminType to filter metrics by department (DCC or DCI)
      const [
        periodosAtivos,
        totalProjetos,
        projetosAprovados,
        projetosSubmetidos,
        projetosRascunho,
        totalInscricoes,
        totalAlunos,
        totalProfessores,
        totalDepartamentos,
        totalDisciplinas,
        vagasStats,
        vagasOcupadas,
        projetosPorDepartamento,
        inscricoesPorPeriodo,
        professoresPorDepartamento,
        projetosRecentes,
      ] = await Promise.all([
        repo.countActivePeriods(now),
        repo.countTotalProjects(adminType),
        repo.countProjectsByStatus(APPROVED, adminType),
        repo.countProjectsByStatus(SUBMITTED, adminType),
        repo.countProjectsByStatus(DRAFT, adminType),
        repo.countTotalInscriptions(adminType),
        repo.countTotalStudents(),
        repo.countTotalProfessors(adminType),
        repo.countTotalDepartments(adminType),
        repo.countTotalDisciplines(adminType),
        repo.getVagasStats(adminType),
        repo.countOccupiedVagas(adminType),
        repo.getProjectsByDepartment(adminType),
        repo.getInscriptionsByPeriod(adminType),
        repo.getProfessorsByDepartment(adminType),
        repo.getRecentProjects(adminType),
      ])

      const totalVagas = vagasStats.bolsas + vagasStats.voluntarios
      const taxaAprovacao = totalProjetos > 0 ? (projetosAprovados / totalProjetos) * 100 : 0
      const taxaOcupacao = totalVagas > 0 ? (vagasOcupadas / totalVagas) * 100 : 0

      const metrics: DashboardMetrics = {
        periodosAtivos,
        totalProjetos,
        projetosAprovados,
        projetosSubmetidos,
        projetosRascunho,
        totalInscricoes,
        totalVagas,
        totalBolsas: vagasStats.bolsas,
        totalVoluntarios: vagasStats.voluntarios,
        vagasOcupadas,
        taxaAprovacao: Math.round(taxaAprovacao * 100) / 100,

        totalAlunos,
        totalProfessores,
        totalDepartamentos,
        totalDisciplinas,

        departamentos: projetosPorDepartamento.map((item, index) => ({
          id: index + 1,
          nome: item.departamento || 'Sem departamento',
          projetos: Number(item.total),
          professores: professoresPorDepartamento.find((p) => p.departamento === item.departamento)?.professores || 0,
        })),

        ultimosProjetosAprovados: projetosRecentes
          .filter((p) => p.status === APPROVED)
          .slice(0, 5)
          .map((p) => ({
            id: p.id,
            titulo: p.titulo,
            professorResponsavel: p.professorResponsavelNome || 'N/A',
            departamento: p.departamentoNome || 'N/A',
            dataAprovacao: p.createdAt,
          })),

        projetosPorDepartamento: projetosPorDepartamento.map((item) => ({
          departamento: item.departamento || 'Sem departamento',
          sigla: item.sigla || 'N/A',
          total: Number(item.total),
          aprovados: Number(item.aprovados),
          submetidos: Number(item.submetidos),
        })),

        inscricoesPorPeriodo: inscricoesPorPeriodo.map((item) => ({
          periodo: item.periodo.replace('SEMESTRE_', ''),
          ano: Number(item.ano),
          semestre: item.semestre.replace('SEMESTRE_', ''),
          inscricoes: Number(item.inscricoes),
          projetos: Number(item.projetos),
        })),

        estatisticasVagas: {
          bolsistas: vagasStats.bolsas,
          voluntarios: vagasStats.voluntarios,
          totalDisponibilizadas: totalVagas,
          ocupadas: vagasOcupadas,
          taxaOcupacao: Math.round(taxaOcupacao * 100) / 100,
        },

        professoresPorDepartamento: professoresPorDepartamento.map((item) => ({
          departamento: item.departamento || 'Departamento não especificado',
          professores: Number(item.professores),
          projetosAtivos: Number(item.projetosAtivos),
        })),

        alertas: [
          ...(projetosRecentes.filter((p) => p.status === DRAFT).length > 5
            ? [
              {
                tipo: 'warning' as const,
                titulo: 'Projetos pendentes',
                descricao: `${projetosRecentes.filter((p) => p.status === DRAFT).length} projetos ainda em rascunho`,
              },
            ]
            : []),
          ...(taxaOcupacao < 0.3
            ? [
              {
                tipo: 'info' as const,
                titulo: 'Baixa ocupação',
                descricao: `Taxa de ocupação das vagas está em ${Math.round(taxaOcupacao * 100)}%`,
              },
            ]
            : []),
        ],
      }

      log.info({ metrics }, 'Métricas do dashboard calculadas com sucesso')
      return metrics
    },

    async getApprovedProjectsPROGRAD(
      ano: number,
      semestre: Semestre,
      userRole: UserRole,
      adminType?: AdminType | null,
      userId?: number
    ) {
      if (userRole !== ADMIN) {
        throw new UnauthorizedError('Acesso permitido apenas para administradores')
      }

      const projetos = await repo.getApprovedProjectsForPROGRAD(ano, semestre, adminType)

      if (projetos.length === 0) {
        log.info({ ano, semestre }, 'Nenhum projeto aprovado para planilha PROGRAD')
        return { semestre, ano, projetos: [] }
      }

      const projetoIds = projetos.map((p) => p.id)

      // Fetch existing valid tokens
      const existingTokens = await repo.findActiveTokensForProjects(projetoIds)
      const tokenByProjetoId = new Map(existingTokens.map((t) => [t.projetoId, t.token]))

      // Check MinIO directly for signed PDFs (not the database table)
      const projectsWithPdfInMinio = await checkProjectsHavePdfsInMinio(projetoIds)

      log.info(
        { totalProjetos: projetoIds.length, projectsWithPdf: projectsWithPdfInMinio.size },
        'Checked MinIO for project PDFs'
      )

      // Generate tokens for projects that have signed PDFs but no valid token
      const baseUrl = env.CLIENT_URL || 'http://localhost:3000'

      // Use 10-year expiration for PROGRAD tokens to ensure permanent access
      const PROGRAD_TOKEN_EXPIRATION_YEARS = 10

      for (const projeto of projetos) {
        if (projectsWithPdfInMinio.has(projeto.id) && !tokenByProjetoId.has(projeto.id) && userId) {
          // Generate new token with long expiration for permanent access
          const token = uuidv4()
          const expiresAt = new Date()
          expiresAt.setFullYear(expiresAt.getFullYear() + PROGRAD_TOKEN_EXPIRATION_YEARS)

          try {
            await repo.createPublicPdfToken({
              projetoId: projeto.id,
              token,
              expiresAt,
              createdByUserId: userId,
            })
            tokenByProjetoId.set(projeto.id, token)
            log.debug({ projetoId: projeto.id }, 'Generated permanent public PDF token for PROGRAD')
          } catch (error) {
            log.warn({ projetoId: projeto.id, error }, 'Failed to generate public PDF token')
          }
        }
      }

      log.info({ ano, semestre, totalProjetos: projetos.length }, 'Projetos aprovados para planilha PROGRAD obtidos')

      return {
        semestre,
        ano,
        projetos: projetos.map((p) => {
          const token = tokenByProjetoId.get(p.id)
          // Use public PDF URL if token exists, otherwise fallback to empty
          const linkPDF = token ? `${baseUrl}/api/public/projeto-pdf/${token}` : ''

          return {
            id: p.id,
            codigo: p.disciplinaCodigo || 'N/A',
            disciplinaNome: p.disciplinaNome || p.titulo || '',
            professorNome: p.professorNome || '',
            professoresParticipantes: p.professoresParticipantes || '',
            departamentoNome: p.departamentoNome || '',
            tipoProposicao: p.tipoProposicao || TIPO_PROPOSICAO_INDIVIDUAL,
            linkPDF,
          }
        }),
      }
    },

    async sendPlanilhaPROGRAD(
      ano: number,
      semestre: Semestre,
      userRole: UserRole,
      userId: number,
      adminType?: AdminType | null
    ) {
      if (userRole !== ADMIN) {
        throw new UnauthorizedError('Acesso permitido apenas para administradores')
      }

      const projetos = await repo.getApprovedProjectsForPROGRAD(ano, semestre, adminType)

      if (projetos.length === 0) {
        throw new NotFoundError('Projeto', 'Nenhum projeto aprovado encontrado para o período especificado')
      }

      // Get public PDF URLs for XLSX
      const projetoIds = projetos.map((p) => p.id)
      const existingTokens = await repo.findActiveTokensForProjects(projetoIds)
      const tokenByProjetoId = new Map(existingTokens.map((t) => [t.projetoId, t.token]))

      // Check MinIO directly for signed PDFs (not the database table)
      const projectsWithPdfInMinio = await checkProjectsHavePdfsInMinio(projetoIds)

      const baseUrl = env.CLIENT_URL || 'http://localhost:3000'

      // Use 10-year expiration for PROGRAD tokens to ensure permanent access
      const PROGRAD_TOKEN_EXPIRATION_YEARS = 10

      // Generate tokens for projects without valid tokens
      for (const projeto of projetos) {
        if (projectsWithPdfInMinio.has(projeto.id) && !tokenByProjetoId.has(projeto.id)) {
          const token = uuidv4()
          const expiresAt = new Date()
          expiresAt.setFullYear(expiresAt.getFullYear() + PROGRAD_TOKEN_EXPIRATION_YEARS)

          try {
            await repo.createPublicPdfToken({
              projetoId: projeto.id,
              token,
              expiresAt,
              createdByUserId: userId,
            })
            tokenByProjetoId.set(projeto.id, token)
          } catch (error) {
            log.warn({ projetoId: projeto.id, error }, 'Failed to generate public PDF token for email')
          }
        }
      }

      // Generate XLSX content with proper hyperlinks
      const xlsxBuffer = await this.generateXLSXWithHyperlinks(projetos, tokenByProjetoId, baseUrl, ano, semestre)

      // Fetch individual project PDFs for attachments
      const pdfAttachments: Array<{ filename: string; content: Buffer; contentType: string }> = []
      for (const projeto of projetos) {
        if (projectsWithPdfInMinio.has(projeto.id)) {
          try {
            const pdfData = await PDFService.getLatestProjetoPDF(projeto.id)
            if (pdfData) {
              const codigo = projeto.disciplinaCodigo || 'PROJETO'
              const professorNome = projeto.professorNome || 'PROFESSOR'
              const filename = `${codigo}_${sanitizeForFilename(professorNome)}.pdf`
              pdfAttachments.push({
                filename,
                content: pdfData.buffer,
                contentType: 'application/pdf',
              })
              log.debug({ projetoId: projeto.id, filename }, 'PDF attachment prepared for email')
            }
          } catch (error) {
            log.warn({ projetoId: projeto.id, error }, 'Failed to fetch PDF for email attachment')
            // Continue with other projects even if one fails
          }
        }
      }

      log.info(
        { totalProjetos: projetos.length, pdfAttachments: pdfAttachments.length },
        'PDF attachments prepared for PROGRAD email'
      )

      // Get IC email (global config)
      const icEmailConfig = await repo.getConfiguracaoSistema(EMAIL_IC_CHAVE)
      const icEmail = icEmailConfig?.valor

      // Get department email based on adminType
      const departamentos = await repo.getDepartmentsWithEmails()
      const departamentoEmail = adminType ? departamentos.find((d) => d.sigla === adminType)?.emailInstituto : null

      const destinatarios: string[] = []
      if (icEmail) destinatarios.push(icEmail)
      if (departamentoEmail) destinatarios.push(departamentoEmail)

      if (destinatarios.length === 0) {
        throw new ValidationError(
          'Nenhum email configurado. Configure o email do IC e/ou do departamento antes de enviar.'
        )
      }

      await Promise.all(
        destinatarios.map((email) =>
          sendPlanilhaPROGRADEmail({
            progradEmail: email,
            planilhaPDFBuffer: xlsxBuffer,
            semestre,
            ano,
            remetenteUserId: userId,
            isExcel: true,
            projectPdfAttachments: pdfAttachments,
          })
        )
      )

      log.info(
        {
          destinatarios,
          ano,
          semestre,
          totalProjetos: projetos.length,
        },
        'Planilha PROGRAD enviada por email com sucesso'
      )

      return {
        success: true,
        message: 'Planilha PROGRAD enviada aos emails configurados',
        totalProjetos: projetos.length,
        destinatarios,
      }
    },

    async generateXLSXWithHyperlinks(
      projetos: Array<{
        id: number
        titulo: string
        disciplinaNome: string | null
        disciplinaCodigo: string | null
        professorNome: string | null
        professoresParticipantes: string | null
        departamentoNome: string | null
        tipoProposicao: string | null
      }>,
      tokenByProjetoId: Map<number, string>,
      baseUrl: string,
      ano: number,
      semestre: Semestre
    ): Promise<Buffer> {
      const wb = new ExcelJS.Workbook()
      const ws = wb.addWorksheet('Projetos Aprovados')

      // Styles
      const greenFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92D050' } }
      const thinBorder: Partial<ExcelJS.Borders> = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      }

      const semestreNum = semestre === 'SEMESTRE_1' ? '1' : '2'

      // Group projects by department first
      const projetosPorDepartamento = projetos.reduce(
        (acc, projeto) => {
          const dept = projeto.departamentoNome || 'Sem Departamento'
          if (!acc[dept]) acc[dept] = []
          acc[dept].push(projeto)
          return acc
        },
        {} as Record<string, typeof projetos>
      )
      const sortedDepartments = Object.keys(projetosPorDepartamento).sort()
      const totalDataRows = projetos.length

      // Build all rows as array first
      type RowData = {
        values: (string | { text: string; hyperlink: string })[]
        isTitle?: boolean
        isHeader?: boolean
      }
      const allRows: RowData[] = []

      // Title row
      allRows.push({
        values: [`PLANILHA DE DETALHAMENTO DOS PROJETOS APROVADOS NA CONGREGAÇÃO DO IC - ${ano}.${semestreNum}`, '', '', '', '', ''],
        isTitle: true,
      })

      // Header row
      allRows.push({
        values: [
          'Unidade Universitária',
          'Órgão Responsável (Dept. ou Coord. Acadêmica)',
          'CÓDIGO',
          'Componente(s) Curricular(es): NOME',
          'Professor Responsável pelo Projeto (Proponente)',
          'Professores participantes (Projetos coletivos)',
        ],
        isHeader: true,
      })

      // Data rows
      let isFirstDataRow = true
      for (const departamento of sortedDepartments) {
        const deptProjetos = projetosPorDepartamento[departamento]
        deptProjetos.forEach((p, idx) => {
          const token = tokenByProjetoId.get(p.id)
          const linkPDF = token ? `${baseUrl}/api/public/projeto-pdf/${token}` : ''
          const displayName = p.disciplinaNome || p.titulo || ''

          const componenteValue = linkPDF ? { text: displayName, hyperlink: linkPDF } : displayName

          allRows.push({
            values: [
              isFirstDataRow ? 'Instituto de Computação' : '',
              idx === 0 ? departamento : '',
              p.disciplinaCodigo || 'N/A',
              componenteValue,
              p.professorNome || '',
              p.tipoProposicao === TIPO_PROPOSICAO_COLETIVA ? p.professoresParticipantes || '' : '',
            ],
          })
          isFirstDataRow = false
        })
      }

      // Add rows to worksheet - only exact number needed
      allRows.forEach((rowData, rowIndex) => {
        const excelRow = rowIndex + 1
        const row = ws.getRow(excelRow)

        if (rowData.isTitle) {
          row.getCell(1).value = rowData.values[0] as string
          row.getCell(1).font = { name: 'Verdana', size: 12, bold: true }
          row.getCell(1).fill = greenFill
          row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
          row.getCell(1).border = thinBorder
          row.height = 25
          ws.mergeCells(`A${excelRow}:F${excelRow}`)
        } else if (rowData.isHeader) {
          rowData.values.forEach((val, colIdx) => {
            const cell = row.getCell(colIdx + 1)
            cell.value = val as string
            cell.font = { bold: true, size: 10 }
            cell.fill = greenFill
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
            cell.border = thinBorder
          })
          row.height = 30
        } else {
          rowData.values.forEach((val, colIdx) => {
            const cell = row.getCell(colIdx + 1)
            if (typeof val === 'object' && val !== null && 'hyperlink' in val) {
              cell.value = { text: val.text, hyperlink: val.hyperlink }
              cell.font = { color: { argb: 'FF0563C1' }, underline: true }
            } else {
              cell.value = val as string
            }
            cell.border = thinBorder
            cell.alignment = { vertical: 'middle', wrapText: true }
            if (colIdx === 2) cell.alignment = { horizontal: 'center', vertical: 'middle' }
          })
        }

        row.commit()
      })

      // Set column widths AFTER adding data
      ws.getColumn(1).width = 23
      ws.getColumn(2).width = 43
      ws.getColumn(3).width = 12
      ws.getColumn(4).width = 69
      ws.getColumn(5).width = 51
      ws.getColumn(6).width = 59

      // Merge cells for Unidade (column A)
      const firstDataRow = 3
      const lastDataRow = 2 + totalDataRows
      if (totalDataRows > 1) {
        ws.mergeCells(`A${firstDataRow}:A${lastDataRow}`)
        ws.getCell(`A${firstDataRow}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      }

      // Merge cells for Órgão (column B) per department
      let currentMergeRow = firstDataRow
      for (const departamento of sortedDepartments) {
        const deptCount = projetosPorDepartamento[departamento].length
        if (deptCount > 1) {
          ws.mergeCells(`B${currentMergeRow}:B${currentMergeRow + deptCount - 1}`)
          ws.getCell(`B${currentMergeRow}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
        }
        currentMergeRow += deptCount
      }

      const buffer = await wb.xlsx.writeBuffer()
      return Buffer.from(buffer)
    },

    async getEmailDestinatarios(adminType?: AdminType | null) {
      const icEmailConfig = await repo.getConfiguracaoSistema(EMAIL_IC_CHAVE)
      const icEmail = icEmailConfig?.valor

      const departamentos = await repo.getDepartmentsWithEmails()
      const departamentoEmail = adminType ? departamentos.find((d) => d.sigla === adminType)?.emailInstituto : null

      return {
        icEmail: icEmail || null,
        departamentoEmail: departamentoEmail || null,
        departamentoNome: adminType ? departamentos.find((d) => d.sigla === adminType)?.nome || null : null,
      }
    },
  }
}
