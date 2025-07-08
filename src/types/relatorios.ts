import { z } from 'zod'
import {
  anoSchema,
  Semestre,
  semestreSchema,
  StatusInscricao,
  statusInscricaoSchema,
  TipoInscricao,
  tipoInscricaoSchema,
  tipoRelatorioSchema,
  TipoVaga,
} from './enums'
import { idSchema, nameSchema } from './schemas'

// ========================================
// RELATORIOS TYPES
// ========================================

export interface RelatorioFilter {
  ano: number
  semestre: string
  departamentoId?: number
  status?: string
}

export interface DepartamentoRelatorio {
  departamento: {
    id: number
    nome: string
    sigla?: string | null
  }
  projetos: number
  projetosAprovados: number
  bolsasSolicitadas: number
  bolsasDisponibilizadas: number
}

export interface ProfessorRelatorio {
  professor: {
    id: number
    nomeCompleto: string
    emailInstitucional: string
  }
  departamento: {
    nome: string
    sigla?: string | null
  }
  projetos: number
  projetosAprovados: number
  bolsasSolicitadas: number
  bolsasDisponibilizadas: number
}

export interface AlunoRelatorio {
  aluno: {
    id: number
    nomeCompleto: string
    emailInstitucional: string
    matricula: string
    cr: number
  }
  inscricoes: number
  statusInscricao: StatusInscricao
  tipoVagaPretendida?: TipoInscricao | null
  projeto: {
    titulo: string
    professorResponsavel: string
  }
}

export interface DisciplinaRelatorio {
  disciplina: {
    id: number
    nome: string
    codigo: string
  }
  departamento: {
    nome: string
    sigla?: string | null
  }
  projetos: number
  projetosAprovados: number
}

export interface EditalRelatorio {
  edital: {
    id: number
    numeroEdital: string
    titulo: string
    publicado: boolean
    dataPublicacao?: Date | null
  }
  periodo: {
    ano: number
    semestre: Semestre
    dataInicio: Date
    dataFim: Date
  }
  criadoPor: {
    username: string
  }
}

export interface RelatorioGeral {
  projetos: {
    total: number
    aprovados: number
    submetidos: number
    rascunhos: number
    totalBolsasSolicitadas: number
    totalBolsasDisponibilizadas: number
  }
  inscricoes: {
    total: number
    submetidas: number
    selecionadas: number
    aceitas: number
  }
  vagas: {
    total: number
    bolsistas: number
    voluntarios: number
  }
}

export interface MonitorConsolidado {
  id: number
  monitor: {
    nome: string
    matricula: string
    email: string
    cr: number
    banco?: string | null
    agencia?: string | null
    conta?: string | null
    digitoConta?: string | null
  }
  professor: {
    nome: string
    matriculaSiape?: string | null
    email: string
    departamento: string
  }
  projeto: {
    titulo: string
    disciplinas: string
    ano: number
    semestre: Semestre
    cargaHorariaSemana: number
    numeroSemanas: number
  }
  monitoria: {
    tipo: TipoVaga
    dataInicio: string
    dataFim: string
    valorBolsa?: number | null
    status: string
  }
}

export interface MonitorFinal {
  id: number
  nomeCompleto: string
  matricula: string
  emailInstitucional: string
  cr: number
  rg?: string
  cpf: string
  banco?: string
  agencia?: string
  conta?: string
  digitoConta?: string
  projeto: {
    titulo: string
    departamento: string
    professorResponsavel: string
    matriculaSiape?: string
    disciplinas: string[]
    cargaHorariaSemana: number
    numeroSemanas: number
  }
  tipo: TipoVaga
  valorBolsa?: number
}

// ========================================
// VALIDATION SCHEMAS
// ========================================

export const relatorioFilterSchema = z.object({
  ano: anoSchema,
  semestre: semestreSchema,
  departamentoId: idSchema.optional(),
  status: statusInscricaoSchema.optional(),
})

export const csvExportSchema = z.object({
  tipo: tipoRelatorioSchema,
  ano: anoSchema,
  semestre: semestreSchema,
  filters: z.record(z.unknown()).optional(),
})

export const departamentoRelatorioSchema = z.object({
  departamento: z.object({
    id: idSchema,
    nome: nameSchema,
    sigla: z.string().nullable().optional(),
  }),
  projetos: z.number(),
  projetosAprovados: z.number(),
  bolsasSolicitadas: z.number(),
  bolsasDisponibilizadas: z.number(),
})

export const professorRelatorioSchema = z.object({
  professor: z.object({
    id: idSchema,
    nomeCompleto: nameSchema,
    emailInstitucional: z.string().email(),
  }),
  departamento: z.object({
    nome: nameSchema,
    sigla: z.string().nullable().optional(),
  }),
  projetos: z.number(),
  projetosAprovados: z.number(),
  bolsasSolicitadas: z.number(),
  bolsasDisponibilizadas: z.number(),
})

export const alunoRelatorioSchema = z.object({
  aluno: z.object({
    id: idSchema,
    nomeCompleto: nameSchema,
    emailInstitucional: z.string().email(),
    matricula: z.string(),
    cr: z.number(),
  }),
  inscricoes: z.number(),
  statusInscricao: statusInscricaoSchema,
  tipoVagaPretendida: tipoInscricaoSchema.nullable().optional(),
  projeto: z.object({
    titulo: nameSchema,
    professorResponsavel: nameSchema,
  }),
})

export const disciplinaRelatorioSchema = z.object({
  disciplina: z.object({
    id: idSchema,
    nome: nameSchema,
    codigo: z.string(),
  }),
  departamento: z.object({
    nome: nameSchema,
    sigla: z.string().nullable().optional(),
  }),
  projetos: z.number(),
  projetosAprovados: z.number(),
})

export const editalRelatorioSchema = z.object({
  edital: z.object({
    id: idSchema,
    numeroEdital: z.string(),
    titulo: nameSchema,
    publicado: z.boolean(),
    dataPublicacao: z.date().nullable().optional(),
  }),
  periodo: z.object({
    ano: anoSchema,
    semestre: semestreSchema,
    dataInicio: z.date(),
    dataFim: z.date(),
  }),
  criadoPor: z.object({
    username: z.string(),
  }),
})

export const relatorioGeralSchema = z.object({
  projetos: z.object({
    total: z.number(),
    aprovados: z.number(),
    submetidos: z.number(),
    rascunhos: z.number(),
    totalBolsasSolicitadas: z.number(),
    totalBolsasDisponibilizadas: z.number(),
  }),
  inscricoes: z.object({
    total: z.number(),
    submetidas: z.number(),
    selecionadas: z.number(),
    aceitas: z.number(),
  }),
  vagas: z.object({
    total: z.number(),
    bolsistas: z.number(),
    voluntarios: z.number(),
  }),
})

export const relatorioFiltersSchema = relatorioFilterSchema

export const relatorioFiltersWithDeptSchema = relatorioFilterSchema.extend({
  departamentoId: idSchema.optional(),
})

export const relatorioFiltersWithStatusSchema = relatorioFilterSchema.extend({
  status: statusInscricaoSchema.optional(),
})

export const csvExportInputSchema = csvExportSchema

export const csvExportOutputSchema = z.object({
  success: z.boolean(),
  fileName: z.string(),
  downloadUrl: z.string(),
})

export const dashboardQuickMetricsSchema = z.object({
  totalProjetos: z.number(),
  projetosAprovados: z.number(),
  totalInscricoes: z.number(),
  totalBolsas: z.number(),
  totalVoluntarios: z.number(),
})

export const monitorConsolidadoSchema = z.object({
  id: idSchema,
  monitor: z.object({
    nome: nameSchema,
    matricula: z.string(),
    email: z.string().email(),
    cr: z.number(),
    banco: z.string().nullable().optional(),
    agencia: z.string().nullable().optional(),
    conta: z.string().nullable().optional(),
    digitoConta: z.string().nullable().optional(),
  }),
  professor: z.object({
    nome: nameSchema,
    matriculaSiape: z.string().nullable().optional(),
    email: z.string().email(),
    departamento: nameSchema,
  }),
  projeto: z.object({
    titulo: nameSchema,
    disciplinas: z.string(),
    ano: anoSchema,
    semestre: semestreSchema,
    cargaHorariaSemana: z.number().int().positive(),
    numeroSemanas: z.number().int().positive(),
  }),
  monitoria: z.object({
    tipo: z.enum(['BOLSISTA', 'VOLUNTARIO']),
    dataInicio: z.string(),
    dataFim: z.string(),
    valorBolsa: z.number().nullable().optional(),
    status: z.string(),
  }),
})

export const monitoresFinalFiltersSchema = z.object({
  ano: anoSchema,
  semestre: semestreSchema,
  departamentoId: idSchema.optional(),
  tipo: z.enum(['BOLSISTA', 'VOLUNTARIO']).optional(),
})

export const monitorFinalBolsistaSchema = z.object({
  id: idSchema,
  nomeCompleto: nameSchema,
  matricula: z.string(),
  emailInstitucional: z.string().email(),
  cr: z.number(),
  rg: z.string().optional(),
  cpf: z.string(),
  banco: z.string().optional(),
  agencia: z.string().optional(),
  conta: z.string().optional(),
  digitoConta: z.string().optional(),
  projeto: z.object({
    titulo: nameSchema,
    departamento: nameSchema,
    professorResponsavel: nameSchema,
    matriculaSiape: z.string().optional(),
    disciplinas: z.array(z.string()),
    cargaHorariaSemana: z.number().int().positive(),
    numeroSemanas: z.number().int().positive(),
  }),
  tipo: z.enum(['BOLSISTA', 'VOLUNTARIO']),
  valorBolsa: z.number().optional(),
})

export type RelatorioFilterData = z.infer<typeof relatorioFilterSchema>
export type CsvExportData = z.infer<typeof csvExportSchema>
export type DepartamentoRelatorioData = z.infer<typeof departamentoRelatorioSchema>
export type ProfessorRelatorioData = z.infer<typeof professorRelatorioSchema>
export type AlunoRelatorioData = z.infer<typeof alunoRelatorioSchema>
export type DisciplinaRelatorioData = z.infer<typeof disciplinaRelatorioSchema>
export type EditalRelatorioData = z.infer<typeof editalRelatorioSchema>
export type RelatorioGeralData = z.infer<typeof relatorioGeralSchema>
export type CsvExportOutputData = z.infer<typeof csvExportOutputSchema>
export type DashboardQuickMetricsData = z.infer<typeof dashboardQuickMetricsSchema>
export type MonitorConsolidadoData = z.infer<typeof monitorConsolidadoSchema>
export type MonitoresFinalFiltersData = z.infer<typeof monitoresFinalFiltersSchema>
export type MonitorFinalBolsistaData = z.infer<typeof monitorFinalBolsistaSchema>
