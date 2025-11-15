import { z } from 'zod'

// ========================================
// COMMON VALIDATION SCHEMAS
// ========================================

// Basic field validations
export const idSchema = z.number().int().positive()
export const optionalIdSchema = z.number().int().positive().optional()
export const nameSchema = z.string().min(1, 'Nome é obrigatório').max(255)
export const descriptionSchema = z.string().max(1000).optional()
export const emailSchema = z.string().email('Email inválido')
export const phoneSchema = z
  .string()
  .refine((val) => !val || /^\(\d{2}\) \d{4,5}-\d{4}$/.test(val), 'Telefone inválido')
  .optional()

// Username validation
export const usernameSchema = z
  .string()
  .min(3, 'Username deve ter pelo menos 3 caracteres')
  .max(50, 'Username deve ter no máximo 50 caracteres')

export const passwordSchema = z
  .string()
  .min(8, 'Senha deve ter pelo menos 8 caracteres')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/,
    'Senha deve conter letras maiúsculas, minúsculas, números e um caractere especial'
  )

export const loginPasswordSchema = z.string().min(1, 'Informe a senha')

// Signature validation
export const signatureDataSchema = z.string().min(1, 'Assinatura é obrigatória')
export const optionalSignatureDataSchema = z.string().min(1).optional()

// Date validations
export const dateSchema = z.date()
export const dateStringSchema = z.string().refine((date) => !isNaN(Date.parse(date)), 'Data inválida')

// File validations
export const fileSchema = z.object({
  name: z.string(),
  size: z.number(),
  type: z.string(),
})

// File ID validation
export const fileIdSchema = z.string().min(1)
export const optionalFileIdSchema = z.string().min(1).optional()

// Pagination schemas
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
})

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  })

// Search and filter schemas
export const searchSchema = z.object({
  query: z.string().optional(),
  filters: z.record(z.string(), z.unknown()).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

// Generic response schemas
export const successResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
})

export const errorResponseSchema = z.object({
  title: z.string(),
  message: z.string(),
  code: z.string().optional(),
  details: z.record(z.unknown()).optional(),
})

// Grade and performance schemas
export const gradeSchema = z.number().min(0).max(10)

// Document validation schemas
export const cpfSchema = z.string().min(1, 'CPF é obrigatório')

// Academic record schemas
export const matriculaSchema = z.string().min(8, 'Matrícula deve ter pelo menos 8 caracteres')
export const crSchema = z.number().min(0).max(10)

// ========================================
// UTILITY FUNCTIONS
// ========================================

export const createOptionalSchema = <T extends z.ZodTypeAny>(schema: T) => schema.optional()

export const createNullableSchema = <T extends z.ZodTypeAny>(schema: T) => schema.nullable()

export const createOptionalNullableSchema = <T extends z.ZodTypeAny>(schema: T) => schema.optional().nullable()

// ========================================
// STATUS ENUM SCHEMAS
// ========================================

// Periodo Inscricao Status
export const PERIODO_INSCRICAO_STATUS_ATIVO = 'ATIVO' as const
export const PERIODO_INSCRICAO_STATUS_FUTURO = 'FUTURO' as const
export const PERIODO_INSCRICAO_STATUS_FINALIZADO = 'FINALIZADO' as const

export const periodoInscricaoStatusSchema = z.enum([
  PERIODO_INSCRICAO_STATUS_ATIVO,
  PERIODO_INSCRICAO_STATUS_FUTURO,
  PERIODO_INSCRICAO_STATUS_FINALIZADO,
])

// Note: Schemas below are now defined in enums.ts for centralization
// Import them from @/types instead of defining here

// ========================================
// EXPORTED TYPES FROM SCHEMAS
// ========================================

export type Id = z.infer<typeof idSchema>
export type OptionalId = z.infer<typeof optionalIdSchema>
export type Name = z.infer<typeof nameSchema>
export type Username = z.infer<typeof usernameSchema>
export type Email = z.infer<typeof emailSchema>
export type Phone = z.infer<typeof phoneSchema>
export type Grade = z.infer<typeof gradeSchema>
export type Pagination = z.infer<typeof paginationSchema>
export type Search = z.infer<typeof searchSchema>
export type FileInfo = z.infer<typeof fileSchema>
export type FileId = z.infer<typeof fileIdSchema>
export type SignatureData = z.infer<typeof signatureDataSchema>
export type SuccessResponse = z.infer<typeof successResponseSchema>
export type ErrorResponse = z.infer<typeof errorResponseSchema>
export type PeriodoInscricaoStatus = z.infer<typeof periodoInscricaoStatusSchema>
// Note: VoluntarioStatus, RelatorioValidationType, CandidateResultStatus, and ProfessorStatus
// are now exported from enums.ts - import from @/types instead
