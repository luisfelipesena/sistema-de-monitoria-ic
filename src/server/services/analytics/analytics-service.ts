import type { db } from '@/server/db'
import { sendPlanilhaPROGRADEmail } from '@/server/lib/email'
import { NotFoundError, UnauthorizedError, ValidationError } from '@/server/lib/errors'
import type { AdminType, DashboardMetrics, Semestre, UserRole } from '@/types'
import { ADMIN, APPROVED, DRAFT, SUBMITTED, TIPO_PROPOSICAO_COLETIVA, TIPO_PROPOSICAO_INDIVIDUAL } from '@/types'
import { env } from '@/utils/env'
import { logger } from '@/utils/logger'
import { createAnalyticsRepository } from './analytics-repository'

const EMAIL_IC_CHAVE = 'EMAIL_INSTITUTO_COMPUTACAO'

type Database = typeof db
const log = logger.child({ context: 'AnalyticsService' })

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
      adminType?: AdminType | null
    ) {
      if (userRole !== ADMIN) {
        throw new UnauthorizedError('Acesso permitido apenas para administradores')
      }

      const projetos = await repo.getApprovedProjectsForPROGRAD(ano, semestre, adminType)

      log.info({ ano, semestre, totalProjetos: projetos.length }, 'Projetos aprovados para planilha PROGRAD obtidos')

      return {
        semestre,
        ano,
        projetos: projetos.map((p) => ({
          id: p.id,
          codigo: p.disciplinaCodigo || 'N/A',
          disciplinaNome: p.disciplinaNome || p.titulo || '',
          professorNome: p.professorNome || '',
          professoresParticipantes: p.professoresParticipantes || '',
          departamentoNome: p.departamentoNome || '',
          tipoProposicao: p.tipoProposicao || TIPO_PROPOSICAO_INDIVIDUAL,
          linkPDF: `${env.CLIENT_URL}/api/projeto/${p.id}/pdf`,
        })),
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

      // Generate CSV content
      const csvContent = this.generateCSV(projetos)
      const csvBuffer = Buffer.from(csvContent, 'utf-8')

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
            planilhaPDFBuffer: csvBuffer,
            semestre,
            ano,
            remetenteUserId: userId,
            isCSV: true,
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

    generateCSV(
      projetos: Array<{
        id: number
        titulo: string
        disciplinaNome: string | null
        disciplinaCodigo: string | null
        professorNome: string | null
        professoresParticipantes: string | null
        departamentoNome: string | null
        tipoProposicao: string | null
      }>
    ): string {
      const headers = [
        'Unidade Universitária',
        'Órgão Responsável',
        'CÓDIGO',
        'Componente Curricular: NOME',
        'Professor Responsável',
        'Professores Participantes',
        'Link PDF',
      ]

      const escapeCSV = (value: string) => {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }

      const rows = projetos.map((p) => [
        escapeCSV('Instituto de Computação'),
        escapeCSV(p.departamentoNome || ''),
        escapeCSV(p.disciplinaCodigo || 'N/A'),
        escapeCSV(p.disciplinaNome || p.titulo || ''),
        escapeCSV(p.professorNome || ''),
        escapeCSV(p.tipoProposicao === TIPO_PROPOSICAO_COLETIVA ? p.professoresParticipantes || '' : ''),
        escapeCSV(`${env.CLIENT_URL}/api/projeto/${p.id}/pdf`),
      ])

      return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
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
