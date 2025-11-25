import { z } from 'zod'
import { anoSchema, semestreSchema, Semestre, TipoVaga, tipoVagaSchema } from './enums'
import { idSchema } from './schemas'

// ========================================
// RELATORIO STATUS ENUM (from DB)
// ========================================

export const RELATORIO_STATUS_DRAFT = 'DRAFT' as const
export const RELATORIO_STATUS_SUBMITTED = 'SUBMITTED' as const
export const RELATORIO_STATUS_APPROVED = 'APPROVED' as const
export const RELATORIO_STATUS_REJECTED = 'REJECTED' as const

export const RELATORIO_STATUS_ENUM = [
  RELATORIO_STATUS_DRAFT,
  RELATORIO_STATUS_SUBMITTED,
  RELATORIO_STATUS_APPROVED,
  RELATORIO_STATUS_REJECTED,
] as const

export const relatorioStatusSchema = z.enum(RELATORIO_STATUS_ENUM)
export type RelatorioStatus = z.infer<typeof relatorioStatusSchema>

export const RELATORIO_STATUS_LABELS: Record<RelatorioStatus, string> = {
  DRAFT: 'Rascunho',
  SUBMITTED: 'Submetido',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
}

// ========================================
// RELATORIO FINAL DISCIPLINA TYPES
// ========================================

export interface RelatorioFinalDisciplinaContent {
  resumoAtividades: string
  avaliacaoGeral: string
  dificuldadesEncontradas?: string
  sugestoesMelhorias?: string
  observacoes?: string
}

export const relatorioFinalDisciplinaContentSchema = z.object({
  resumoAtividades: z.string().min(10, 'Resumo das atividades é obrigatório'),
  avaliacaoGeral: z.string().min(10, 'Avaliação geral é obrigatória'),
  dificuldadesEncontradas: z.string().optional(),
  sugestoesMelhorias: z.string().optional(),
  observacoes: z.string().optional(),
})

export interface RelatorioFinalDisciplina {
  id: number
  projetoId: number
  conteudo: RelatorioFinalDisciplinaContent
  status: RelatorioStatus
  professorAssinouEm: Date | null
  createdAt: Date
  updatedAt: Date | null
  projeto: {
    id: number
    titulo: string
    ano: number
    semestre: Semestre
    disciplinaNome: string | null
    professorResponsavel: {
      id: number
      nomeCompleto: string
    }
  }
  relatoriosMonitores: RelatorioFinalMonitorListItem[]
}

export interface RelatorioFinalDisciplinaListItem {
  id: number
  projetoId: number
  status: RelatorioStatus
  professorAssinouEm: Date | null
  createdAt: Date
  projeto: {
    id: number
    titulo: string
    ano: number
    semestre: Semestre
    disciplinaNome: string | null
  }
  totalMonitores: number
  monitoresAssinados: number
}

// ========================================
// RELATORIO FINAL MONITOR TYPES
// ========================================

export interface RelatorioFinalMonitorContent {
  desempenhoGeral: string
  atividadesRealizadas: string
  frequencia: string
  notaFinal: number
  avaliacaoQualitativa?: string
  observacoes?: string
  // Legacy field names for backward compatibility
  nota?: string | number
}

/**
 * Extracts nota from RelatorioFinalMonitorContent JSON string
 * Handles both legacy 'nota' field and current 'notaFinal' field
 */
export function extractNotaFromRelatorioConteudo(conteudoJson: string): string {
  try {
    const conteudo = JSON.parse(conteudoJson) as Partial<RelatorioFinalMonitorContent>
    const nota = conteudo.notaFinal ?? conteudo.nota
    return nota !== undefined ? String(nota) : 'N/A'
  } catch {
    return 'N/A'
  }
}

export const relatorioFinalMonitorContentSchema = z.object({
  desempenhoGeral: z.string().min(10, 'Avaliação de desempenho é obrigatória'),
  atividadesRealizadas: z.string().min(10, 'Descrição das atividades é obrigatória'),
  frequencia: z.string().min(1, 'Frequência é obrigatória'),
  notaFinal: z.number().min(0).max(10),
  avaliacaoQualitativa: z.string().optional(),
  observacoes: z.string().optional(),
})

export interface RelatorioFinalMonitor {
  id: number
  inscricaoId: number
  relatorioDisciplinaId: number
  conteudo: RelatorioFinalMonitorContent
  status: RelatorioStatus
  alunoAssinouEm: Date | null
  professorAssinouEm: Date | null
  createdAt: Date
  updatedAt: Date | null
  inscricao: {
    id: number
    aluno: {
      id: number
      nomeCompleto: string
      matricula: string | null
      emailInstitucional: string | null
    }
    tipoVagaPretendida: string | null
  }
  projeto: {
    id: number
    titulo: string
    ano: number
    semestre: Semestre
    disciplinaNome: string | null
  }
}

export interface RelatorioFinalMonitorListItem {
  id: number
  inscricaoId: number
  status: RelatorioStatus
  alunoAssinouEm: Date | null
  professorAssinouEm: Date | null
  aluno: {
    id: number
    nomeCompleto: string
    matricula: string | null
  }
  tipoVaga: TipoVaga | null
}

// ========================================
// INPUT SCHEMAS
// ========================================

export const createRelatorioFinalDisciplinaInputSchema = z.object({
  projetoId: idSchema,
  conteudo: relatorioFinalDisciplinaContentSchema,
})

export type CreateRelatorioFinalDisciplinaInput = z.infer<typeof createRelatorioFinalDisciplinaInputSchema>

export const updateRelatorioFinalDisciplinaInputSchema = z.object({
  id: idSchema,
  conteudo: relatorioFinalDisciplinaContentSchema.partial(),
})

export type UpdateRelatorioFinalDisciplinaInput = z.infer<typeof updateRelatorioFinalDisciplinaInputSchema>

export const createRelatorioFinalMonitorInputSchema = z.object({
  inscricaoId: idSchema,
  relatorioDisciplinaId: idSchema,
  conteudo: relatorioFinalMonitorContentSchema,
})

export type CreateRelatorioFinalMonitorInput = z.infer<typeof createRelatorioFinalMonitorInputSchema>

export const updateRelatorioFinalMonitorInputSchema = z.object({
  id: idSchema,
  conteudo: relatorioFinalMonitorContentSchema.partial(),
})

export type UpdateRelatorioFinalMonitorInput = z.infer<typeof updateRelatorioFinalMonitorInputSchema>

// ========================================
// FILTER SCHEMAS
// ========================================

export const relatorioFinalFilterSchema = z.object({
  ano: anoSchema,
  semestre: semestreSchema,
  status: relatorioStatusSchema.optional(),
})

export type RelatorioFinalFilter = z.infer<typeof relatorioFinalFilterSchema>

// ========================================
// OUTPUT SCHEMAS
// ========================================

export const relatorioFinalDisciplinaListItemSchema = z.object({
  id: idSchema,
  projetoId: idSchema,
  status: relatorioStatusSchema,
  professorAssinouEm: z.date().nullable(),
  createdAt: z.date(),
  projeto: z.object({
    id: idSchema,
    titulo: z.string(),
    ano: anoSchema,
    semestre: semestreSchema,
    disciplinaNome: z.string().nullable(),
  }),
  totalMonitores: z.number().int().min(0),
  monitoresAssinados: z.number().int().min(0),
})

export const relatorioFinalMonitorListItemSchema = z.object({
  id: idSchema,
  inscricaoId: idSchema,
  status: relatorioStatusSchema,
  alunoAssinouEm: z.date().nullable(),
  professorAssinouEm: z.date().nullable(),
  aluno: z.object({
    id: idSchema,
    nomeCompleto: z.string(),
    matricula: z.string().nullable(),
  }),
  tipoVaga: tipoVagaSchema.nullable(),
})

// ========================================
// STUDENT VIEW TYPES
// ========================================

export interface RelatorioParaAssinarAluno {
  id: number
  relatorioDisciplinaId: number
  conteudo: RelatorioFinalMonitorContent
  status: RelatorioStatus
  alunoAssinouEm: Date | null
  professorAssinouEm: Date | null
  projeto: {
    id: number
    titulo: string
    ano: number
    semestre: Semestre
    disciplinaNome: string | null
    professorResponsavel: {
      nomeCompleto: string
    }
  }
}

export const relatorioParaAssinarAlunoSchema = z.object({
  id: idSchema,
  relatorioDisciplinaId: idSchema,
  conteudo: relatorioFinalMonitorContentSchema,
  status: relatorioStatusSchema,
  alunoAssinouEm: z.date().nullable(),
  professorAssinouEm: z.date().nullable(),
  projeto: z.object({
    id: idSchema,
    titulo: z.string(),
    ano: anoSchema,
    semestre: semestreSchema,
    disciplinaNome: z.string().nullable(),
    professorResponsavel: z.object({
      nomeCompleto: z.string(),
    }),
  }),
})
