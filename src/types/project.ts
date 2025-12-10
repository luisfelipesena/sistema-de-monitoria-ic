import { z } from 'zod'
import {
  Genero,
  PROJETO_STATUS_DRAFT,
  ProjetoStatus,
  projetoStatusSchema,
  Regime,
  Semestre,
  semestreSchema,
  SigningMode,
  TipoProposicao,
  tipoProposicaoSchema,
} from './enums'

// ========================================
// PROJECT TYPES
// ========================================

export interface Project {
  id: number
  departamentoId: number
  ano: number
  semestre: Semestre
  tipoProposicao: TipoProposicao
  bolsasSolicitadas: number
  voluntariosSolicitados: number
  bolsasDisponibilizadas?: number
  cargaHorariaSemana: number
  numeroSemanas: number
  publicoAlvo: string
  estimativaPessoasBenificiadas?: number
  professorResponsavelId: number
  titulo: string
  descricao: string
  status: ProjetoStatus
  assinaturaProfessor?: string
  feedbackAdmin?: string
  createdAt: Date
  updatedAt?: Date
  deletedAt?: Date
}

export interface CreateProjectInput {
  departamentoId: number
  ano: number
  semestre: Semestre
  tipoProposicao: TipoProposicao
  bolsasSolicitadas: number
  voluntariosSolicitados: number
  bolsasDisponibilizadas?: number
  cargaHorariaSemana: number
  numeroSemanas: number
  publicoAlvo: string
  estimativaPessoasBenificiadas?: number
  professorResponsavelId: number
  titulo: string
  descricao: string
  status?: ProjetoStatus
  assinaturaProfessor?: string
  feedbackAdmin?: string
}

export interface UpdateProjectInput {
  id: number
  departamentoId?: number
  ano?: number
  semestre?: Semestre
  tipoProposicao?: TipoProposicao
  bolsasSolicitadas?: number
  voluntariosSolicitados?: number
  bolsasDisponibilizadas?: number
  cargaHorariaSemana?: number
  numeroSemanas?: number
  publicoAlvo?: string
  estimativaPessoasBenificiadas?: number
  professorResponsavelId?: number
  titulo?: string
  descricao?: string
  status?: ProjetoStatus
  assinaturaProfessor?: string
  feedbackAdmin?: string
}

export interface DashboardProjectItem {
  id: number
  titulo: string
  status: string
  departamentoId: number | null
  departamentoNome: string | null
  semestre: string
  ano: number
  bolsasDisponibilizadas?: number | null | undefined
  voluntariosSolicitados?: number | null | undefined
  totalInscritos: number
  disciplinas: Array<{ codigo: string; nome: string }>
}

export interface ManageProjectItem {
  id: number
  titulo: string
  status: string
  departamentoId: number | null
  departamentoNome: string | null
  semestre: string
  ano: number
  bolsasDisponibilizadas?: number | null | undefined
  voluntariosSolicitados?: number | null | undefined
  totalInscritos: number
  disciplinas: Array<{ codigo: string; nome: string }>
  professorResponsavelNome: string
}

export interface DisciplineAssociation {
  id: number
  codigo: string
  nome: string
  departamentoId: number
  isAssociated: boolean
  ano?: number
  semestre?: Semestre
}

export interface ProjetoDisponivelListItem {
  id: number
  titulo: string
  departamentoNome: string
  professorResponsavelNome: string
  disciplinas: Array<{ codigo: string; nome: string }>
  bolsasDisponibilizadas: number
  voluntariosSolicitados: number
  totalInscritos: number
  inscricaoAberta: boolean
  jaInscrito: boolean
}

export interface MonitoriaFormData {
  titulo: string
  descricao: string
  departamento?: {
    id: number
    nome: string
  }
  coordenadorResponsavel?: string
  professorResponsavel?: {
    id: number
    nomeCompleto: string
    nomeSocial?: string
    genero: Genero | null
    cpf: string | null
    matriculaSiape?: string
    regime: Regime | null
    telefone?: string
    telefoneInstitucional?: string
    emailInstitucional: string | null
  }
  ano: number
  semestre: Semestre
  numeroEdital?: string
  tipoProposicao: TipoProposicao
  professoresParticipantes?: string
  numeroMonitroresSolicitados?: number
  bolsasSolicitadas: number
  voluntariosSolicitados: number
  cargaHorariaSemana: number
  numeroSemanas: number
  cargaHorariaTotal?: number
  publicoAlvo: string
  estimativaPessoasBenificiadas?: number
  disciplinas: Array<{
    id: number
    codigo: string
    nome: string
  }>
  atividades?: string[]
  user?: {
    username?: string
    email?: string
    nomeCompleto?: string
    role?: string
  }
  assinaturaProfessor?: string
  dataAprovacao?: string
  dataAssinaturaProfessor?: string
  dataAssinaturaAdmin?: string
  allowSigning?: boolean
  signingMode?: SigningMode
  projetoId?: number
}

export interface ProjectTemplateItem {
  id: number
  disciplinaId: number
  tituloDefault?: string | null
  descricaoDefault?: string | null
  cargaHorariaSemanaDefault?: number | null
  numeroSemanasDefault?: number | null
  publicoAlvoDefault?: string | null
  atividadesDefault: string[]
  createdAt: Date
  updatedAt?: Date | null
  disciplina: {
    nome: string
    codigo: string
    departamento: {
      nome: string
      sigla?: string | null
    }
  }
  criadoPor?: {
    username: string
  } | null
  ultimaAtualizacaoPor?: {
    username: string
  } | null
}

export interface AdminSigningProjectItem {
  id: number
  titulo: string
  status: string
  departamentoNome: string
  professorResponsavelNome: string
  semestre: string
  ano: number
  disciplinas: Array<{ codigo: string; nome: string }>
}

// ========================================
// VALIDATION SCHEMAS
// ========================================

export const createProjectSchema = z.object({
  departamentoId: z.number().int().positive(),
  ano: z.number().int().min(2000).max(2100),
  semestre: semestreSchema,
  tipoProposicao: tipoProposicaoSchema,
  bolsasSolicitadas: z.number().int().min(0).default(0),
  voluntariosSolicitados: z.number().int().min(0).default(0),
  bolsasDisponibilizadas: z.number().int().min(0).optional(),
  cargaHorariaSemana: z.number().int().positive(),
  numeroSemanas: z.number().int().positive(),
  publicoAlvo: z.string().min(1),
  estimativaPessoasBenificiadas: z.number().int().min(0).optional(),
  professorResponsavelId: z.number().int().positive(),
  titulo: z.string().min(1).max(255),
  descricao: z.string().min(1),
  status: projetoStatusSchema.default(PROJETO_STATUS_DRAFT),
  assinaturaProfessor: z.string().optional(),
  feedbackAdmin: z.string().optional(),
})

export const updateProjectSchema = z.object({
  id: z.number().int().positive(),
  departamentoId: z.number().int().positive().optional(),
  ano: z.number().int().min(2000).max(2100).optional(),
  semestre: semestreSchema.optional(),
  tipoProposicao: tipoProposicaoSchema.optional(),
  bolsasSolicitadas: z.number().int().min(0).optional(),
  voluntariosSolicitados: z.number().int().min(0).optional(),
  bolsasDisponibilizadas: z.number().int().min(0).optional(),
  cargaHorariaSemana: z.number().int().positive().optional(),
  numeroSemanas: z.number().int().positive().optional(),
  publicoAlvo: z.string().min(1).optional(),
  estimativaPessoasBenificiadas: z.number().int().min(0).optional(),
  professorResponsavelId: z.number().int().positive().optional(),
  titulo: z.string().min(1).optional(),
  descricao: z.string().min(1).optional(),
  status: projetoStatusSchema.optional(),
  assinaturaProfessor: z.string().optional(),
  feedbackAdmin: z.string().optional(),
})

export const updateProjetoSchema = z.object({
  id: z.number().int().positive(),
  departamentoId: z.number().int().positive().optional(),
  ano: z.number().int().min(2000).max(2100).optional(),
  semestre: semestreSchema.optional(),
  tipoProposicao: tipoProposicaoSchema.optional(),
  bolsasSolicitadas: z.number().int().min(0).optional(),
  voluntariosSolicitados: z.number().int().min(0).optional(),
  bolsasDisponibilizadas: z.number().int().min(0).optional(),
  cargaHorariaSemana: z.number().int().positive().optional(),
  numeroSemanas: z.number().int().positive().optional(),
  publicoAlvo: z.string().min(1).optional(),
  estimativaPessoasBenificiadas: z.number().int().min(0).optional(),
  professorResponsavelId: z.number().int().positive().optional(),
  titulo: z.string().min(1).optional(),
  descricao: z.string().min(1).optional(),
  status: projetoStatusSchema.optional(),
  assinaturaProfessor: z.string().optional(),
  feedbackAdmin: z.string().optional(),
})

export const insertProjetoTableSchema = z.object({
  departamentoId: z.number().int().positive(),
  ano: z.number().int().min(2000).max(2100),
  semestre: semestreSchema,
  tipoProposicao: tipoProposicaoSchema,
  bolsasSolicitadas: z.number().int().min(0).default(0),
  voluntariosSolicitados: z.number().int().min(0).default(0),
  bolsasDisponibilizadas: z.number().int().min(0).optional(),
  cargaHorariaSemana: z.number().int().positive(),
  numeroSemanas: z.number().int().positive(),
  publicoAlvo: z.string().min(1),
  estimativaPessoasBenificiadas: z.number().int().min(0).optional(),
  professorResponsavelId: z.number().int().positive(),
  titulo: z.string().min(1).max(255),
  descricao: z.string().min(1),
  status: projetoStatusSchema.default(PROJETO_STATUS_DRAFT),
  assinaturaProfessor: z.string().optional(),
  feedbackAdmin: z.string().optional(),
})

export const projectTemplateSchema = z.object({
  disciplinaId: z.number().int().positive(),
  tituloDefault: z.string().optional(),
  descricaoDefault: z.string().optional(),
  cargaHorariaSemanaDefault: z.number().int().positive().optional(),
  numeroSemanasDefault: z.number().int().positive().optional(),
  publicoAlvoDefault: z.string().optional(),
  atividadesDefault: z.array(z.string()),
})

export const duplicateTemplateSchema = z.object({
  sourceId: z.number().int().positive(),
  targetDisciplinaId: z.number().int().positive(),
})

export const projectFormSchema = z.object({
  titulo: z.string().min(1),
  descricao: z.string().min(1),
  departamentoId: z.number().int().positive(),
  ano: z.number().int().min(2000).max(2100),
  semestre: semestreSchema,
  tipoProposicao: tipoProposicaoSchema,
  bolsasSolicitadas: z.number().int().min(0),
  voluntariosSolicitados: z.number().int().min(0),
  cargaHorariaSemana: z.number().int().positive(),
  numeroSemanas: z.number().int().positive(),
  publicoAlvo: z.string().min(1),
  estimativaPessoasBenificiadas: z.number().int().min(0).optional(),
  disciplinas: z.array(z.number().int().positive()),
  disciplinaIds: z.array(z.number().int().positive()).optional(),
  professoresParticipantes: z.string().optional(),
  atividades: z.array(z.string()).optional(),
  professorResponsavelId: z.number().int().positive().optional(),
})

export const projectDetailSchema = z.object({
  id: z.number().int().positive(),
  titulo: z.string().min(1),
  descricao: z.string(),
  departamentoId: z.number().int().positive().nullable(),
  ano: z.number().int().min(2000).max(2100),
  semestre: semestreSchema,
  tipoProposicao: tipoProposicaoSchema,
  bolsasSolicitadas: z.number().int().min(0),
  voluntariosSolicitados: z.number().int().min(0),
  bolsasDisponibilizadas: z.number().int().min(0).nullable().optional(),
  cargaHorariaSemana: z.number().int().positive(),
  numeroSemanas: z.number().int().positive(),
  publicoAlvo: z.string(),
  estimativaPessoasBenificiadas: z.number().int().min(0).nullable().optional(),
  professorResponsavelId: z.number().int().positive(),
  status: projetoStatusSchema,
  assinaturaProfessor: z.string().nullable().optional(),
  feedbackAdmin: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date().nullable().optional(),
  deletedAt: z.date().nullable().optional(),
  departamento: z
    .object({
      id: z.number().int().positive(),
      nome: z.string(),
      sigla: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  professorResponsavel: z
    .object({
      id: z.number().int().positive(),
      nomeCompleto: z.string(),
      emailInstitucional: z.string().email().nullable(),
    })
    .optional(),
  disciplinas: z
    .array(
      z.object({
        id: z.number().int().positive(),
        nome: z.string(),
        codigo: z.string(),
      })
    )
    .optional(),
  atividades: z
    .array(
      z.object({
        id: z.number().int().positive(),
        descricao: z.string(),
        projetoId: z.number().int().positive(),
        createdAt: z.date(),
      })
    )
    .optional(),
  professoresParticipantes: z
    .array(
      z.object({
        id: z.number().int().positive(),
        nomeCompleto: z.string(),
      })
    )
    .optional(),
})

export const projectListItemSchema = z.object({
  id: z.number().int().positive(),
  titulo: z.string(),
  departamentoId: z.number().int().positive().nullable(),
  departamentoNome: z.string().nullable(),
  professorResponsavelId: z.number().int().positive(),
  professorResponsavelNome: z.string(),
  status: z.string(),
  ano: z.number().int().min(2000).max(2100),
  semestre: z.string(),
  tipoProposicao: z.string(),
  bolsasSolicitadas: z.number().int().min(0),
  voluntariosSolicitados: z.number().int().min(0),
  bolsasDisponibilizadas: z.number().int().min(0).nullable().optional(),
  cargaHorariaSemana: z.number().int().positive(),
  numeroSemanas: z.number().int().positive(),
  publicoAlvo: z.string(),
  estimativaPessoasBenificiadas: z.number().int().min(0).nullable().optional(),
  descricao: z.string(),
  assinaturaProfessor: z.string().nullable().optional(),
  feedbackAdmin: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date().nullable().optional(),
  deletedAt: z.date().nullable().optional(),
  disciplinas: z.array(
    z.object({
      id: z.number().int().positive(),
      nome: z.string(),
      codigo: z.string(),
    })
  ),
  totalInscritos: z.number(),
  inscritosBolsista: z.number(),
  inscritosVoluntario: z.number(),
})

export type CreateProjectData = z.infer<typeof createProjectSchema>
export type UpdateProjectData = z.infer<typeof updateProjectSchema>
export type ProjectTemplateData = z.infer<typeof projectTemplateSchema>
export type DuplicateTemplateData = z.infer<typeof duplicateTemplateSchema>
export type ProjectFormData = z.infer<typeof projectFormSchema>
export type ProjectDetailData = z.infer<typeof projectDetailSchema>
export type ProjectListItemData = z.infer<typeof projectListItemSchema>
export type UpdateProjetoData = z.infer<typeof updateProjetoSchema>
export type InsertProjetoTableData = z.infer<typeof insertProjetoTableSchema>
