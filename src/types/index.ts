// ========================================
// COMMON SCHEMAS AND UTILITIES
// ========================================
export * from './enums'
export * from './schemas'
export * from './errors'
export * from './table'
export * from './forms'

// Additional enum exports for type safety
export type {
  FileAction,
  DocumentType,
  NotificationType,
  NotificationPriority,
  StatsPeriod,
  SignatureTypeTermo,
} from './enums'
export {
  fileActionSchema,
  documentTypeSchema,
  notificationTypeSchema,
  notificationPrioritySchema,
  statsPeriodSchema,
  signatureTypeTermoSchema,
} from './enums'

// ========================================
// INPUT DTOs (Service Layer Inputs)
// ========================================
export * from './projeto-inputs'
export * from './edital-inputs'
export * from './selecao-inputs'

// ========================================
// DOMAIN-SPECIFIC TYPES
// ========================================

// Authentication and authorization
export * from './auth'

// Academic structure
export * from './course'
export * from './department'
export * from './discipline'

// User domains
export * from './professor'
export * from './student'

// Core business domains
export * from './edital'
export * from './inscription'
export * from './project'

// Document and signature management
export * from './signature'
export * from './termos'

// Notifications and communication
export * from './notificacoes'

// Reports and analytics
export * from './analytics'
export * from './prograd'
export * from './relatorios'

// System features
export * from './import'
export * from './onboarding'
export * from './vagas'
export * from './monitor-selection'

// ========================================
// RE-EXPORTS FROM THIRD-PARTY LIBRARIES
// ========================================

// Zod exports for convenience
export { z } from 'zod'
export type { ZodArray, ZodObject, ZodSchema, ZodType } from 'zod'

// Common utility types
export type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type NonNullable<T> = T extends null | undefined ? never : T

export type Nullable<T> = T | null

export type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType extends readonly (infer ElementType)[]
  ? ElementType
  : never
