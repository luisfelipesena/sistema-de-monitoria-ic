import { PlanilhaPROGRADDocument } from '@/components/features/prograd/PlanilhaPROGRAD'
import type { db } from '@/server/db'
import { sendPlanilhaPROGRADEmail } from '@/server/lib/email'
import { NotFoundError, UnauthorizedError, ValidationError } from '@/server/lib/errors'
import type { DashboardMetrics, Semestre, UserRole } from '@/types'
import { ADMIN, APPROVED, DRAFT, SUBMITTED, TIPO_PROPOSICAO_INDIVIDUAL } from '@/types'
import { env } from '@/utils/env'
import { logger } from '@/utils/logger'
import { DocumentProps, renderToBuffer } from '@react-pdf/renderer'
import React, { type ReactElement } from 'react'
import { createAnalyticsRepository } from './analytics-repository'

type Database = typeof db
const log = logger.child({ context: 'AnalyticsService' })

export function createAnalyticsService(db: Database) {
  const repo = createAnalyticsRepository(db)

  return {
    async getDashboardMetrics(userRole: UserRole): Promise<DashboardMetrics> {
      if (userRole !== ADMIN) {
        throw new UnauthorizedError('Acesso permitido apenas para administradores')
      }

      const now = new Date()

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
        totalCursos,
        totalDisciplinas,
        vagasStats,
        vagasOcupadas,
        projetosPorDepartamento,
        inscricoesPorPeriodo,
        alunosPorCurso,
        professoresPorDepartamento,
        projetosRecentes,
      ] = await Promise.all([
        repo.countActivePeriods(now),
        repo.countTotalProjects(),
        repo.countProjectsByStatus(APPROVED),
        repo.countProjectsByStatus(SUBMITTED),
        repo.countProjectsByStatus(DRAFT),
        repo.countTotalInscriptions(),
        repo.countTotalStudents(),
        repo.countTotalProfessors(),
        repo.countTotalDepartments(),
        repo.countTotalCourses(),
        repo.countTotalDisciplines(),
        repo.getVagasStats(),
        repo.countOccupiedVagas(),
        repo.getProjectsByDepartment(),
        repo.getInscriptionsByPeriod(),
        repo.getStudentsByCourse(),
        repo.getProfessorsByDepartment(),
        repo.getRecentProjects(),
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
        totalCursos,
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

        alunosPorCurso: alunosPorCurso.map((item) => ({
          curso: item.curso || 'Curso não especificado',
          alunos: Number(item.alunos),
          inscricoes: Number(item.inscricoes),
        })),

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

    async getApprovedProjectsPROGRAD(ano: number, semestre: Semestre, userRole: UserRole) {
      if (userRole !== ADMIN) {
        throw new UnauthorizedError('Acesso permitido apenas para administradores')
      }

      const projetos = await repo.getApprovedProjectsForPROGRAD(ano, semestre)

      log.info({ ano, semestre, totalProjetos: projetos.length }, 'Projetos aprovados para planilha PROGRAD obtidos')

      return {
        semestre,
        ano,
        projetos: projetos.map((p) => ({
          id: p.id,
          codigo: p.disciplinaNome || p.titulo || 'N/A',
          disciplinaNome: p.disciplinaNome || p.titulo || '',
          professorNome: p.professorNome || '',
          professoresParticipantes: p.professoresParticipantes || '',
          departamentoNome: p.departamentoNome || '',
          tipoProposicao: p.tipoProposicao || TIPO_PROPOSICAO_INDIVIDUAL,
          linkPDF: `${env.CLIENT_URL}/api/projeto/${p.id}/pdf`,
        })),
      }
    },

    async sendPlanilhaPROGRAD(ano: number, semestre: Semestre, userRole: UserRole, userId: number) {
      if (userRole !== ADMIN) {
        throw new UnauthorizedError('Acesso permitido apenas para administradores')
      }

      const projetos = await repo.getApprovedProjectsForPROGRAD(ano, semestre)

      if (projetos.length === 0) {
        throw new NotFoundError('Projeto', 'Nenhum projeto aprovado encontrado para o período especificado')
      }

      const planilhaData = {
        semestre,
        ano,
        projetos: projetos.map((p) => ({
          id: p.id,
          codigo: p.disciplinaNome || p.titulo || 'N/A',
          disciplinaNome: p.disciplinaNome || p.titulo || '',
          professorNome: p.professorNome || '',
          professoresParticipantes: p.professoresParticipantes || '',
          departamentoNome: p.departamentoNome || '',
          tipoProposicao: p.tipoProposicao || TIPO_PROPOSICAO_INDIVIDUAL,
        })),
      }

      const pdfElement: ReactElement<DocumentProps> = React.createElement(PlanilhaPROGRADDocument, {
        data: planilhaData,
      })
      const pdfBuffer = await renderToBuffer(pdfElement)

      const departamentos = await repo.getDepartmentsWithEmails()

      const destinatarios = departamentos
        .map((d) => ({ nome: d.nome, email: d.emailInstituto }))
        .filter((item): item is { nome: string; email: string } => Boolean(item.email))
        .map((item) => item.email)

      if (destinatarios.length === 0) {
        throw new ValidationError(
          'Nenhum email institucional configurado para o Instituto. Atualize as configurações de departamento antes de enviar a planilha.'
        )
      }

      await Promise.all(
        destinatarios.map((email) =>
          sendPlanilhaPROGRADEmail({
            progradEmail: email,
            planilhaPDFBuffer: pdfBuffer,
            semestre,
            ano,
            remetenteUserId: userId,
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
        'Planilha PROGRAD enviada por email com sucesso ao Instituto'
      )

      return {
        success: true,
        message: 'Planilha PROGRAD enviada aos emails institucionais configurados',
        totalProjetos: projetos.length,
        destinatarios,
      }
    },
  }
}
