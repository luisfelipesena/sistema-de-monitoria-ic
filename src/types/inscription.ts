import { z } from 'zod'
import {
  ACCEPTED_BOLSISTA,
  ACCEPTED_VOLUNTARIO,
  REJECTED_BY_PROFESSOR,
  REJECTED_BY_STUDENT,
  SELECTED_BOLSISTA,
  SELECTED_VOLUNTARIO,
  StatusInscricao,
  statusInscricaoSchema,
  SUBMITTED,
  TipoInscricao,
  tipoInscricaoSchema,
  WAITING_LIST,
} from './enums'
import { idSchema } from './schemas'

// ========================================
// INSCRIPTION TYPES
// ========================================

export interface Inscription {
  id: number
  periodoInscricaoId: number
  projetoId: number
  alunoId: number
  tipoVagaPretendida?: TipoInscricao
  status: StatusInscricao
  notaDisciplina?: number
  notaSelecao?: number
  coeficienteRendimento?: number
  notaFinal?: number
  feedbackProfessor?: string
  createdAt: Date
  updatedAt?: Date
}

export interface CreateInscriptionInput {
  periodoInscricaoId: number
  projetoId: number
  alunoId: number
  tipoVagaPretendida?: TipoInscricao
  status?: StatusInscricao
  notaDisciplina?: number
  notaSelecao?: number
  coeficienteRendimento?: number
  notaFinal?: number
  feedbackProfessor?: string
}

export interface SelecaoCandidato {
  id: number
  periodoInscricaoId: number
  projetoId: number
  alunoId: number
  tipoVagaPretendida: 'BOLSISTA' | 'VOLUNTARIO' | 'ANY' | null
  status:
  | typeof SUBMITTED
  | typeof SELECTED_BOLSISTA
  | typeof SELECTED_VOLUNTARIO
  | typeof ACCEPTED_BOLSISTA
  | typeof ACCEPTED_VOLUNTARIO
  | typeof REJECTED_BY_PROFESSOR
  | typeof REJECTED_BY_STUDENT
  | typeof WAITING_LIST
  notaDisciplina: string | null
  notaSelecao: string | null
  coeficienteRendimento: string | null
  notaFinal: string | null
  feedbackProfessor: string | null
  createdAt: Date
  updatedAt: Date | null
  aluno: {
    id: number
    userId: number
    nomeCompleto: string
    nomeSocial: string | null
    genero: 'MASCULINO' | 'FEMININO' | 'OUTRO' | null
    especificacaoGenero: string | null
    emailInstitucional: string | null
    matricula: string | null
    rg: string | null
    cpf: string | null
    cr: number | null
    telefone: string | null
    banco: string | null
    agencia: string | null
    conta: string | null
    digitoConta: string | null
    enderecoId: number | null
    cursoId: number | null
    historicoEscolarFileId: string | null
    comprovanteMatriculaFileId: string | null
    createdAt: Date
    updatedAt: Date | null
    user: {
      id: number
      username: string
      email: string
      role: 'admin' | 'professor' | 'student'
      assinaturaDefault: string | null
      dataAssinaturaDefault: Date | null
    }
  }
}

export interface AtaSelecaoData {
  projeto: {
    id: number
    titulo: string
    ano: number
    semestre: string
    departamento: { nome: string; sigla: string | null }
    professorResponsavel: { nomeCompleto: string; matriculaSiape: string | null }
    disciplinas: Array<{ codigo: string; nome: string }>
  }
  totalInscritos: number
  totalCompareceram: number
  inscricoesBolsista: SelecaoCandidato[]
  inscricoesVoluntario: SelecaoCandidato[]
  dataGeracao: Date
  candidatos: Array<{
    id: number
    aluno: {
      nomeCompleto: string
      matricula: string | null
      cr: number | null
    }
    tipoVagaPretendida: string | null
    notaDisciplina: number | null
    notaSelecao: number | null
    coeficienteRendimento: number | null
    notaFinal: number | null
    status: string
    observacoes?: string | null
  }>
  ataInfo: {
    dataSelecao: string
    localSelecao?: string | null
    observacoes?: string | null
  }
}

export interface QuickEvaluation {
  inscricaoId: number
  rating: 1 | 2 | 3 | 4 | 5
  notes: string
  decision: 'SELECT_SCHOLARSHIP' | 'SELECT_VOLUNTEER' | 'REJECT' | 'PENDING'
}

// ========================================
// VALIDATION SCHEMAS
// ========================================

export const createInscriptionSchema = z.object({
  periodoInscricaoId: z.number().int().positive(),
  projetoId: z.number().int().positive(),
  alunoId: z.number().int().positive(),
  tipoVagaPretendida: tipoInscricaoSchema.optional(),
  status: statusInscricaoSchema.default('SUBMITTED'),
  notaDisciplina: z.number().min(0).max(10).optional(),
  notaSelecao: z.number().min(0).max(10).optional(),
  coeficienteRendimento: z.number().min(0).max(10).optional(),
  notaFinal: z.number().min(0).max(10).optional(),
  feedbackProfessor: z.string().optional(),
})

export const inscriptionFormSchema = z.object({
  projetoId: idSchema,
  tipoVagaPretendida: z.enum(['BOLSISTA', 'VOLUNTARIO', 'ANY']).optional(),
  documentos: z
    .array(
      z.object({
        fileId: z.string(),
        tipoDocumento: z.string(),
      })
    )
    .optional(),
})

export const acceptInscriptionSchema = z.object({
  inscricaoId: idSchema,
})

export const rejectInscriptionSchema = z.object({
  inscricaoId: idSchema,
  feedbackProfessor: z.string().optional(),
})

export const candidateEvaluationSchema = z.object({
  inscricaoId: idSchema,
  notaDisciplina: z.number().min(0).max(10),
  notaSelecao: z.number().min(0).max(10),
  coeficienteRendimento: z.number().min(0).max(10),
  feedbackProfessor: z.string().optional(),
})

export const quickEvaluationSchema = z.object({
  inscricaoId: idSchema,
  rating: z.number().int().min(1).max(5),
  notes: z.string(),
  decision: z.enum(['SELECT_SCHOLARSHIP', 'SELECT_VOLUNTEER', 'REJECT', 'PENDING']),
})

export const inscriptionDetailSchema = z.object({
  id: idSchema,
  projetoId: idSchema,
  alunoId: idSchema,
  tipoVagaPretendida: tipoInscricaoSchema.nullable().optional(),
  status: statusInscricaoSchema,
  notaDisciplina: z.number().min(0).max(10).nullable().optional(),
  notaSelecao: z.number().min(0).max(10).nullable().optional(),
  coeficienteRendimento: z.number().min(0).max(10).nullable().optional(),
  notaFinal: z.number().min(0).max(10).nullable().optional(),
  feedbackProfessor: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date().nullable().optional(),
  projeto: z.object({
    id: idSchema,
    titulo: z.string(),
    descricao: z.string(),
    ano: z.number(),
    semestre: z.string(),
    status: z.string(),
    bolsasDisponibilizadas: z.number().nullable().optional(),
    voluntariosSolicitados: z.number().nullable().optional(),
    professorResponsavel: z.object({
      id: idSchema,
      nomeCompleto: z.string(),
      emailInstitucional: z.string().email().nullable(),
    }),
    departamento: z.object({
      id: idSchema,
      nome: z.string(),
    }),
    disciplinas: z.array(
      z.object({
        id: idSchema,
        nome: z.string(),
        codigo: z.string(),
        turma: z.string(),
      })
    ),
  }),
  aluno: z.object({
    id: idSchema,
    nomeCompleto: z.string(),
    matricula: z.string().nullable(),
    cr: z.number().nullable(),
    user: z.object({
      id: idSchema,
      email: z.string().email(),
    }),
  }),
})

export type CreateInscriptionData = z.infer<typeof createInscriptionSchema>
export type InscriptionFormData = z.infer<typeof inscriptionFormSchema>
export type AcceptInscriptionData = z.infer<typeof acceptInscriptionSchema>
export type RejectInscriptionData = z.infer<typeof rejectInscriptionSchema>
export type CandidateEvaluationData = z.infer<typeof candidateEvaluationSchema>
export type QuickEvaluationData = z.infer<typeof quickEvaluationSchema>
export type InscriptionDetailData = z.infer<typeof inscriptionDetailSchema>
