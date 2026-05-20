import { z } from 'zod'
import { generoSchema, regimeSchema, tipoProfessorSchema, UserRole, userRoleSchema } from './enums'

// ========================================
// ONBOARDING TYPES
// ========================================

export interface OnboardingStatus {
  pending: boolean
  profile: {
    exists: boolean
    type: UserRole
  }
  documents: {
    required: string[]
    uploaded: string[]
    missing: string[]
  }
  signature?: {
    configured: boolean
  }
  isInactive?: boolean
  existingProfileData?: {
    nomeCompleto?: string
    matriculaSiape?: string
    cpf?: string
    telefone?: string
    telefoneInstitucional?: string
    regime?: string
    tipoProfessor?: string
    departamentoId?: number
    genero?: string
    especificacaoGenero?: string
    nomeSocial?: string
  }
}

// ========================================
// VALIDATION SCHEMAS
// ========================================

export const existingProfessorProfileDataSchema = z
  .object({
    nomeCompleto: z.string().optional(),
    matriculaSiape: z.string().optional(),
    cpf: z.string().optional(),
    telefone: z.string().optional(),
    telefoneInstitucional: z.string().optional(),
    regime: regimeSchema.optional(),
    tipoProfessor: tipoProfessorSchema.optional(),
    departamentoId: z.number().optional(),
    genero: generoSchema.optional(),
    especificacaoGenero: z.string().optional(),
    nomeSocial: z.string().optional(),
  })
  .optional()

export const onboardingStatusResponseSchema = z.object({
  pending: z.boolean(),
  profile: z.object({
    exists: z.boolean(),
    type: userRoleSchema,
  }),
  documents: z.object({
    required: z.array(z.string()),
    uploaded: z.array(z.string()),
    missing: z.array(z.string()),
  }),
  signature: z
    .object({
      configured: z.boolean(),
    })
    .optional(),
  isInactive: z.boolean().optional(),
  existingProfileData: existingProfessorProfileDataSchema,
})

export type OnboardingStatusResponse = z.infer<typeof onboardingStatusResponseSchema>
