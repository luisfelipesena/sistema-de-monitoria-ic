import { z } from 'zod'
import { regimeSchema, UserRole, userRoleSchema } from './enums'
import { cpfSchema, crSchema, emailSchema, idSchema, nameSchema, usernameSchema } from './schemas'

// ========================================
// AUTH TYPES
// ========================================

export interface CreateUserInput {
  username: string
  email: string
  role: UserRole
}

export interface UpdateUserInput {
  id: number
  username?: string
  email?: string
  role?: UserRole
}

export type AppUser = {
  id: number
  username: string
  email: string
  role: UserRole
  assinaturaDefault: string | null
  dataAssinaturaDefault: Date | null
  professor?: {
    id: number
    departamentoId: number
  } | null
  aluno?: {
    id: number
    cursoId: number
  } | null
}

export interface UserListItem {
  id: number
  username: string
  email: string
  role: UserRole
  assinaturaDefault?: string | null
  dataAssinaturaDefault?: Date | null
  professorProfile?: {
    id: number
    nomeCompleto: string
    cpf?: string
    telefone?: string | null
    telefoneInstitucional?: string | null
    emailInstitucional: string
    matriculaSiape?: string | null
    regime: '20H' | '40H' | 'DE'
    departamentoId: number
    curriculumVitaeFileId?: string | null
    comprovanteVinculoFileId?: string | null
    assinaturaDefault?: string | null
    dataAssinaturaDefault?: Date | null
    projetos?: number
    projetosAtivos?: number
  } | null
  studentProfile?: {
    id: number
    nomeCompleto: string
    matricula: string
    cpf?: string
    cr: number
    cursoId: number
    telefone?: string | null
    emailInstitucional: string
    historicoEscolarFileId?: string | null
    comprovanteMatriculaFileId?: string | null
    banco?: string | null
    agencia?: string | null
    conta?: string | null
    digitoConta?: string | null
    inscricoes?: number
    bolsasAtivas?: number
    voluntariadosAtivos?: number
    documentosValidados?: number
    totalDocumentos?: number
  } | null
  createdAt?: Date
  updatedAt?: Date
}

// ========================================
// VALIDATION SCHEMAS
// ========================================

export const userListItemSchema = z.object({
  id: idSchema,
  username: usernameSchema,
  email: emailSchema,
  role: userRoleSchema,
  assinaturaDefault: z.string().nullable().optional(),
  dataAssinaturaDefault: z.date().nullable().optional(),
  professorProfile: z
    .object({
      id: idSchema,
      nomeCompleto: nameSchema,
      cpf: cpfSchema.optional(),
      telefone: z.string().nullable().optional(),
      telefoneInstitucional: z.string().nullable().optional(),
      emailInstitucional: emailSchema,
      matriculaSiape: z.string().nullable().optional(),
      regime: regimeSchema,
      departamentoId: idSchema,
      curriculumVitaeFileId: z.string().nullable().optional(),
      comprovanteVinculoFileId: z.string().nullable().optional(),
      assinaturaDefault: z.string().nullable().optional(),
      dataAssinaturaDefault: z.date().nullable().optional(),
      projetos: z.number().optional(),
      projetosAtivos: z.number().optional(),
    })
    .nullable()
    .optional(),
  studentProfile: z
    .object({
      id: idSchema,
      nomeCompleto: nameSchema,
      matricula: z.string(),
      cpf: cpfSchema.optional(),
      cr: crSchema,
      cursoId: idSchema,
      telefone: z.string().nullable().optional(),
      emailInstitucional: emailSchema,
      historicoEscolarFileId: z.string().nullable().optional(),
      comprovanteMatriculaFileId: z.string().nullable().optional(),
      banco: z.string().nullable().optional(),
      agencia: z.string().nullable().optional(),
      conta: z.string().nullable().optional(),
      digitoConta: z.string().nullable().optional(),
      inscricoes: z.number().optional(),
      bolsasAtivas: z.number().optional(),
      voluntariadosAtivos: z.number().optional(),
      documentosValidados: z.number().optional(),
      totalDocumentos: z.number().optional(),
    })
    .nullable()
    .optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

export const createUserSchema = z.object({
  username: z.string().min(1),
  email: z.string().email(),
  role: userRoleSchema,
})

export const updateUserSchema = z.object({
  id: z.number().int().positive(),
  username: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: userRoleSchema.optional(),
})

export const createApiKeySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  userId: z.number().int().positive().optional(),
  expiresAt: z.date().optional(),
})

export const updateApiKeySchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.date().optional(),
})

export const listApiKeysSchema = z.object({
  userId: z.number().int().positive().optional(),
})

export const deleteApiKeySchema = z.object({
  id: z.number().int().positive(),
})

export type CreateUserData = z.infer<typeof createUserSchema>
export type UpdateUserData = z.infer<typeof updateUserSchema>
export type UserListItemData = z.infer<typeof userListItemSchema>
export type CreateApiKeyData = z.infer<typeof createApiKeySchema>
export type UpdateApiKeyData = z.infer<typeof updateApiKeySchema>
export type ListApiKeysData = z.infer<typeof listApiKeysSchema>
export type DeleteApiKeyData = z.infer<typeof deleteApiKeySchema>
