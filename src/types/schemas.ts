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
export const phoneSchema = z.string().regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, 'Telefone inválido').optional()
export const urlSchema = z.string().url('URL inválida').optional()

// Username validation
export const usernameSchema = z.string().min(3, 'Username deve ter pelo menos 3 caracteres').max(50, 'Username deve ter no máximo 50 caracteres')

// Signature validation
export const signatureDataSchema = z.string().min(1, 'Assinatura é obrigatória')
export const optionalSignatureDataSchema = z.string().min(1).optional()

// Date validations
export const dateSchema = z.date()
export const dateStringSchema = z.string().refine(
  (date) => !isNaN(Date.parse(date)),
  'Data inválida'
)

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
  error: z.string(),
  details: z.unknown().optional(),
})

// Common status schemas
export const statusSchema = z.enum(['active', 'inactive', 'pending', 'suspended'])

// Academic period schemas
export const semesterSchema = z.number().int().min(1).max(2)
export const yearSchema = z.number().int().min(2020).max(2030)

// Period validation schema
export const periodSchema = z.object({
  ano: yearSchema,
  semestre: semesterSchema,
})

// Grade and performance schemas
export const gradeSchema = z.number().min(0).max(10)
export const coefficientSchema = z.number().min(0).max(1)

// Generic metadata schema
export const metadataSchema = z.object({
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
})

// Address schema (common for users)
export const addressSchema = z.object({
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
})

// Document validation schemas
export const cpfSchema = z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido')
export const rgSchema = z.string().min(5, 'RG inválido')

// Academic record schemas
export const matriculaSchema = z.string().min(8, 'Matrícula deve ter pelo menos 8 caracteres')
export const crSchema = z.number().min(0).max(10)

// ========================================
// UTILITY FUNCTIONS
// ========================================

export const createOptionalSchema = <T extends z.ZodTypeAny>(schema: T) =>
  schema.optional()

export const createNullableSchema = <T extends z.ZodTypeAny>(schema: T) =>
  schema.nullable()

export const createOptionalNullableSchema = <T extends z.ZodTypeAny>(schema: T) =>
  schema.optional().nullable()

// ========================================
// EXPORTED TYPES FROM SCHEMAS
// ========================================

export type Id = z.infer<typeof idSchema>
export type OptionalId = z.infer<typeof optionalIdSchema>
export type Name = z.infer<typeof nameSchema>
export type Username = z.infer<typeof usernameSchema>
export type Email = z.infer<typeof emailSchema>
export type Phone = z.infer<typeof phoneSchema>
export type Url = z.infer<typeof urlSchema>
export type Status = z.infer<typeof statusSchema>
export type Semester = z.infer<typeof semesterSchema>
export type Year = z.infer<typeof yearSchema>
export type Period = z.infer<typeof periodSchema>
export type Grade = z.infer<typeof gradeSchema>
export type Coefficient = z.infer<typeof coefficientSchema>
export type Pagination = z.infer<typeof paginationSchema>
export type Search = z.infer<typeof searchSchema>
export type FileInfo = z.infer<typeof fileSchema>
export type FileId = z.infer<typeof fileIdSchema>
export type Address = z.infer<typeof addressSchema>
export type Metadata = z.infer<typeof metadataSchema>
export type SignatureData = z.infer<typeof signatureDataSchema>
export type SuccessResponse = z.infer<typeof successResponseSchema>
export type ErrorResponse = z.infer<typeof errorResponseSchema>
