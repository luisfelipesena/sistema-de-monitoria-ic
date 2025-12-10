import { z } from 'zod'
import {
  Genero,
  generoSchema,
  ProfessorAccountStatus,
  ProfessorInvitationStatus,
  professorInvitationStatusSchema,
  ProjetoStatus,
  ProjetoTipo,
  Regime,
  regimeSchema,
  Semestre,
  TipoProfessor,
  tipoProfessorSchema,
} from './enums'
import { cpfSchema } from './schemas'

// ========================================
// PROFESSOR TYPES
// ========================================

export interface Professor {
  id: number
  userId: number
  departamentoId: number
  nomeCompleto: string
  nomeSocial?: string
  matriculaSiape?: string
  genero: Genero
  regime: Regime
  tipoProfessor: TipoProfessor
  accountStatus: ProfessorAccountStatus
  especificacaoGenero?: string
  cpf: string
  telefone?: string
  telefoneInstitucional?: string
  emailInstitucional: string
  curriculumVitaeFileId?: string
  comprovanteVinculoFileId?: string
  assinaturaDefault?: string
  dataAssinaturaDefault?: Date
  createdAt: Date
  updatedAt?: Date
}

export interface CreateProfessorInput {
  userId: number
  departamentoId: number
  nomeCompleto: string
  nomeSocial?: string
  matriculaSiape?: string
  genero: Genero
  regime: Regime
  tipoProfessor?: TipoProfessor
  especificacaoGenero?: string
  cpf: string
  telefone?: string
  telefoneInstitucional?: string
  emailInstitucional: string
  curriculumVitaeFileId?: string
  comprovanteVinculoFileId?: string
}

export interface ProfessorInvitation {
  id: number
  email: string
  token: string
  status: ProfessorInvitationStatus
  expiresAt: Date
  invitedByUserId: number
  acceptedByUserId?: number
  // Fields for pre-creating professor on invitation
  nomeCompleto?: string
  departamentoId?: number
  regime?: Regime
  tipoProfessor?: TipoProfessor
  professorId?: number
  createdAt: Date
  updatedAt?: Date
}

export interface ProfessorDisciplinaListItem {
  id: number
  codigo: string
  nome: string
  cargaHoraria: number
  projetosAtivos: number
  monitoresAtivos: number
  voluntariosAtivos: number
}

export interface ProfessorSigningProjectItem {
  id: number
  titulo: string
  status: ProjetoStatus
  departamentoNome: string
  semestre: Semestre
  ano: number
  disciplinas: Array<{ codigo: string; nome: string }>
}

export interface ProfessorProjetoListItem {
  id: number
  titulo: string
  descricao: string
  departamento: {
    id: number | null
    nome: string | null
  }
  ano: number
  semestre: Semestre
  tipoProposicao: ProjetoTipo
  status: ProjetoStatus
  bolsasSolicitadas: number
  voluntariosSolicitados: number
  inscricoes: number
  bolsasAlocadas: number
  voluntariosAlocados: number
  cargaHorariaSemana: number
  numeroSemanas: number
  publicoAlvo: string
  estimativaPessoasBenificiadas: number
  disciplinas: Array<{ id: number; nome: string }>
  assinaturaProfessor?: string
  editalNumero?: string | null
  editalPublicado?: boolean
  criadoEm: string
  atualizadoEm: string
}

export interface InvitationItem {
  id: number
  email: string
  token: string
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED'
  expiresAt: Date
  createdAt: Date
  invitedByUser: {
    username: string
    email: string
  }
  acceptedByUser?: {
    username: string
    email: string
  } | null
  // Pre-created professor data
  nomeCompleto?: string | null
  departamentoId?: number | null
  departamentoNome?: string | null
  regime?: Regime | null
  tipoProfessor?: TipoProfessor | null
  professorId?: number | null
}

// ========================================
// VALIDATION SCHEMAS
// ========================================

export const createProfessorSchema = z.object({
  userId: z.number().int().positive(),
  departamentoId: z.number().int().positive(),
  nomeCompleto: z.string().min(1),
  nomeSocial: z.string().optional(),
  matriculaSiape: z.string().optional(),
  genero: generoSchema,
  regime: regimeSchema,
  tipoProfessor: tipoProfessorSchema.optional().default('EFETIVO'),
  especificacaoGenero: z.string().optional(),
  cpf: cpfSchema,
  telefone: z.string().optional(),
  telefoneInstitucional: z.string().optional(),
  emailInstitucional: z.string().email(),
  curriculumVitaeFileId: z.string().optional(),
  comprovanteVinculoFileId: z.string().optional(),
})

export const professorInvitationSchema = z.object({
  id: z.number().int().positive(),
  email: z.string().email(),
  token: z.string(),
  status: professorInvitationStatusSchema,
  expiresAt: z.date(),
  invitedByUserId: z.number().int().positive(),
  acceptedByUserId: z.number().int().positive().optional(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
})

export const inviteFormSchema = z.object({
  email: z.string().email(),
  nomeCompleto: z.string().min(1, 'Nome é obrigatório'),
  departamentoId: z.number().int().positive('Departamento é obrigatório'),
  regime: regimeSchema,
  tipoProfessor: tipoProfessorSchema,
  expiresInDays: z.number().int().min(1).max(30),
})

export const sendInvitationSchema = z.object({
  email: z.string().email(),
  nomeCompleto: z.string().min(1),
  departamentoId: z.number().int().positive(),
  regime: regimeSchema,
  tipoProfessor: tipoProfessorSchema.default('EFETIVO'),
  expiresInDays: z.number().int().min(1).max(30).default(7),
})

export const getInvitationsSchema = z
  .object({
    status: professorInvitationStatusSchema.optional(),
  })
  .optional()

export const resendInvitationSchema = z.object({
  invitationId: z.number().int().positive(),
  expiresInDays: z.number().int().min(1).max(30).default(7),
})

export const cancelInvitationSchema = z.object({
  invitationId: z.number().int().positive(),
})

export const deleteInvitationSchema = z.object({
  invitationId: z.number().int().positive(),
})

export const validateInvitationTokenSchema = z.object({
  token: z.string().min(1),
})

export type CreateProfessorData = z.infer<typeof createProfessorSchema>
export type ProfessorInvitationData = z.infer<typeof professorInvitationSchema>
export type InviteFormData = z.infer<typeof inviteFormSchema>
export type SendInvitationData = z.infer<typeof sendInvitationSchema>
export type GetInvitationsData = z.infer<typeof getInvitationsSchema>
export type ResendInvitationData = z.infer<typeof resendInvitationSchema>
export type CancelInvitationData = z.infer<typeof cancelInvitationSchema>
export type DeleteInvitationData = z.infer<typeof deleteInvitationSchema>
export type ValidateInvitationTokenData = z.infer<typeof validateInvitationTokenSchema>
