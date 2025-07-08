import { z } from 'zod'
import { anoSchema, semestreSchema } from './enums'
import { idSchema } from './schemas'

// ========================================
// ANALYTICS TYPES
// ========================================

export interface AnalyticsMetrics {
  totalProjetos: number
  projetosAprovados: number
  totalInscricoes: number
  inscricoesAprovadas: number
  taxaAprovacao: number
  departamentosAtivos: number
  professoresAtivos: number
  alunosInscritos: number
}

export interface DepartmentAnalytics {
  departamentoId: number
  departamentoNome: string
  projetos: number
  projetosAprovados: number
  inscricoes: number
  inscricoesAprovadas: number
  taxaAprovacao: number
}

export type DashboardMetrics = z.infer<typeof dashboardMetricsSchema>

// ========================================
// VALIDATION SCHEMAS
// ========================================

export const analyticsFilterSchema = z.object({
  ano: anoSchema,
  semestre: semestreSchema,
  departamentoId: idSchema.optional(),
})

export const analyticsMetricsSchema = z.object({
  totalProjetos: z.number(),
  projetosAprovados: z.number(),
  totalInscricoes: z.number(),
  inscricoesAprovadas: z.number(),
  taxaAprovacao: z.number(),
  departamentosAtivos: z.number(),
  professoresAtivos: z.number(),
  alunosInscritos: z.number(),
})

export const departmentAnalyticsSchema = z.object({
  departamentoId: idSchema,
  departamentoNome: z.string(),
  projetos: z.number(),
  projetosAprovados: z.number(),
  inscricoes: z.number(),
  inscricoesAprovadas: z.number(),
  taxaAprovacao: z.number(),
})

export const dashboardMetricsSchema = z.object({
  totalProfessores: z.number(),
  totalAlunos: z.number(),
  totalProjetos: z.number(),
  projetosAprovados: z.number(),
  projetosSubmetidos: z.number(),
  projetosRascunho: z.number(),
  totalInscricoes: z.number(),
  totalVagas: z.number(),
  totalBolsas: z.number(),
  totalVoluntarios: z.number(),
  periodosAtivos: z.number(),
  totalDepartamentos: z.number(),
  totalCursos: z.number(),
  totalDisciplinas: z.number(),
  vagasOcupadas: z.number(),
  taxaAprovacao: z.number(),
  departamentos: z.array(
    z.object({
      id: z.number(),
      nome: z.string(),
      projetos: z.number(),
      professores: z.number(),
    })
  ),
  ultimosProjetosAprovados: z.array(
    z.object({
      id: z.number(),
      titulo: z.string(),
      professorResponsavel: z.string(),
      departamento: z.string(),
      dataAprovacao: z.date(),
    })
  ),
  projetosPorDepartamento: z.array(
    z.object({
      departamento: z.string(),
      sigla: z.string(),
      total: z.number(),
      aprovados: z.number(),
      submetidos: z.number(),
    })
  ),
  inscricoesPorPeriodo: z.array(
    z.object({
      periodo: z.string(),
      ano: z.number(),
      semestre: z.string(),
      inscricoes: z.number(),
      projetos: z.number(),
    })
  ),
  alunosPorCurso: z.array(
    z.object({
      curso: z.string(),
      alunos: z.number(),
      inscricoes: z.number(),
    })
  ),
  professoresPorDepartamento: z.array(
    z.object({
      departamento: z.string(),
      professores: z.number(),
      projetosAtivos: z.number(),
    })
  ),
  estatisticasVagas: z.object({
    bolsistas: z.number(),
    voluntarios: z.number(),
    totalDisponibilizadas: z.number(),
    ocupadas: z.number(),
    taxaOcupacao: z.number(),
  }),
  alertas: z.array(
    z.object({
      tipo: z.enum(['warning', 'error', 'info']),
      titulo: z.string(),
      descricao: z.string(),
      link: z.string().optional(),
    })
  ),
})

export type AnalyticsFilter = z.infer<typeof analyticsFilterSchema>
export type AnalyticsMetricsData = z.infer<typeof analyticsMetricsSchema>
export type DepartmentAnalyticsData = z.infer<typeof departmentAnalyticsSchema>
