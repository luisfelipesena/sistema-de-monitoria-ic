import { z } from 'zod'

// Base schemas for report filters
export const relatorioFiltersSchema = z.object({
  ano: z.number().int().min(2000).max(2100),
  semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
})

export const relatorioFiltersWithDeptSchema = relatorioFiltersSchema.extend({
  departamentoId: z.number().optional(),
})

export const relatorioFiltersWithStatusSchema = relatorioFiltersSchema.extend({
  status: z.enum(['SUBMITTED', 'SELECTED_BOLSISTA', 'SELECTED_VOLUNTARIO', 'ACCEPTED_BOLSISTA', 'ACCEPTED_VOLUNTARIO']).optional(),
})

// Department report schema
export const departamentoRelatorioSchema = z.object({
  departamento: z.object({
    id: z.number(),
    nome: z.string(),
    sigla: z.string().nullable(),
  }),
  projetos: z.number(),
  projetosAprovados: z.number(),
  bolsasSolicitadas: z.number(),
  bolsasDisponibilizadas: z.number(),
})

// Professor report schema
export const professorRelatorioSchema = z.object({
  professor: z.object({
    id: z.number(),
    nomeCompleto: z.string(),
    emailInstitucional: z.string(),
  }),
  departamento: z.object({
    nome: z.string(),
    sigla: z.string().nullable(),
  }),
  projetos: z.number(),
  projetosAprovados: z.number(),
  bolsasSolicitadas: z.number(),
  bolsasDisponibilizadas: z.number(),
})

// Student report schema
export const alunoRelatorioSchema = z.object({
  aluno: z.object({
    id: z.number(),
    nomeCompleto: z.string(),
    emailInstitucional: z.string(),
    matricula: z.string(),
    cr: z.number(),
  }),
  inscricoes: z.number(),
  statusInscricao: z.enum(['SUBMITTED', 'SELECTED_BOLSISTA', 'SELECTED_VOLUNTARIO', 'ACCEPTED_BOLSISTA', 'ACCEPTED_VOLUNTARIO', 'REJECTED_BY_PROFESSOR', 'REJECTED_BY_STUDENT']),
  tipoVagaPretendida: z.enum(['BOLSISTA', 'VOLUNTARIO', 'ANY']).nullable(),
  projeto: z.object({
    titulo: z.string(),
    professorResponsavel: z.string(),
  }),
})

// Discipline report schema
export const disciplinaRelatorioSchema = z.object({
  disciplina: z.object({
    id: z.number(),
    nome: z.string(),
    codigo: z.string(),
  }),
  departamento: z.object({
    nome: z.string(),
    sigla: z.string().nullable(),
  }),
  projetos: z.number(),
  projetosAprovados: z.number(),
})

// Notice report schema
export const editalRelatorioSchema = z.object({
  edital: z.object({
    id: z.number(),
    numeroEdital: z.string(),
    titulo: z.string(),
    publicado: z.boolean(),
    dataPublicacao: z.date().nullable(),
  }),
  periodo: z.object({
    ano: z.number(),
    semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
    dataInicio: z.date(),
    dataFim: z.date(),
  }),
  criadoPor: z.object({
    username: z.string(),
  }),
})

// General report schema
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

// Validation schemas for PROGRAD consolidation
export const validationProblemSchema = z.object({
  tipo: z.enum(['bolsista', 'voluntario']),
  vagaId: z.number(),
  nomeAluno: z.string(),
  problemas: z.array(z.string()),
  prioridade: z.enum(['alta', 'media', 'baixa']),
})

export const validationResultSchema = z.object({
  valido: z.boolean(),
  totalProblemas: z.number(),
  problemas: z.array(validationProblemSchema),
})

// Monitor consolidation schema for PROGRAD
export const monitorConsolidadoSchema = z.object({
  id: z.number(),
  monitor: z.object({
    nome: z.string(),
    matricula: z.string(),
    email: z.string(),
    cr: z.number(),
    banco: z.string().nullable().optional(),
    agencia: z.string().nullable().optional(),
    conta: z.string().nullable().optional(),
    digitoConta: z.string().nullable().optional(),
  }),
  professor: z.object({
    nome: z.string(),
    matriculaSiape: z.string().nullable().optional(),
    email: z.string(),
    departamento: z.string(),
  }),
  projeto: z.object({
    titulo: z.string(),
    disciplinas: z.string(),
    ano: z.number(),
    semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
    cargaHorariaSemana: z.number(),
    numeroSemanas: z.number(),
  }),
  monitoria: z.object({
    tipo: z.enum(['BOLSISTA', 'VOLUNTARIO']),
    dataInicio: z.string(),
    dataFim: z.string(),
    valorBolsa: z.number().nullable().optional(),
    status: z.string(),
  }),
})

// Final monitor schema for PROGRAD export
export const monitorFinalSchema = z.object({
  id: z.number(),
  nomeCompleto: z.string(),
  matricula: z.string(),
  emailInstitucional: z.string(),
  cr: z.number(),
  rg: z.string().nullable(),
  cpf: z.string(),
  banco: z.string().nullable(),
  agencia: z.string().nullable(),
  conta: z.string().nullable(),
  digitoConta: z.string().nullable(),
  projeto: z.object({
    titulo: z.string(),
    departamento: z.string(),
    professorResponsavel: z.string(),
    matriculaSiape: z.string().nullable(),
    disciplinas: z.array(z.string()),
    cargaHorariaSemana: z.number(),
    numeroSemanas: z.number(),
  }),
  tipo: z.enum(['BOLSISTA', 'VOLUNTARIO']),
  valorBolsa: z.number().nullable(),
})

// CSV export schemas
export const csvExportInputSchema = z.object({
  tipo: z.enum(['geral', 'departamentos', 'professores', 'alunos', 'disciplinas', 'editais']),
  ano: z.number().int().min(2000).max(2100),
  semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
  filters: z.record(z.any()).optional(),
})

export const csvExportOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  csvData: z.string(),
  fileName: z.string(),
})

// Export consolidated schemas
export const exportConsolidatedInputSchema = z.object({
  ano: z.number().int().min(2000).max(2100),
  semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
  incluirBolsistas: z.boolean(),
  incluirVoluntarios: z.boolean(),
})

export const exportConsolidatedOutputSchema = z.object({
  message: z.string(),
  fileName: z.string(),
})

// TypeScript types inferred from schemas
export type RelatorioFilters = z.infer<typeof relatorioFiltersSchema>
export type RelatorioFiltersWithDept = z.infer<typeof relatorioFiltersWithDeptSchema>
export type RelatorioFiltersWithStatus = z.infer<typeof relatorioFiltersWithStatusSchema>

export type DepartamentoRelatorio = z.infer<typeof departamentoRelatorioSchema>
export type ProfessorRelatorio = z.infer<typeof professorRelatorioSchema>
export type AlunoRelatorio = z.infer<typeof alunoRelatorioSchema>
export type DisciplinaRelatorio = z.infer<typeof disciplinaRelatorioSchema>
export type EditalRelatorio = z.infer<typeof editalRelatorioSchema>
export type RelatorioGeral = z.infer<typeof relatorioGeralSchema>

export type ValidationProblem = z.infer<typeof validationProblemSchema>
export type ValidationResult = z.infer<typeof validationResultSchema>

export type MonitorConsolidado = z.infer<typeof monitorConsolidadoSchema>
export type MonitorFinal = z.infer<typeof monitorFinalSchema>

export type CsvExportInput = z.infer<typeof csvExportInputSchema>
export type CsvExportOutput = z.infer<typeof csvExportOutputSchema>

export type ExportConsolidatedInput = z.infer<typeof exportConsolidatedInputSchema>
export type ExportConsolidatedOutput = z.infer<typeof exportConsolidatedOutputSchema> 