import { z } from 'zod'
import { StatusEnvio, statusEnvioSchema } from './enums'
import { emailSchema, optionalIdSchema } from './schemas'

// ========================================
// NOTIFICATION TYPES
// ========================================

export interface NotificationHistory {
  id: number
  destinatarioEmail: string
  assunto: string
  tipoNotificacao: string
  statusEnvio: StatusEnvio
  dataEnvio: Date
  mensagemErro?: string
  projetoId?: number
  alunoId?: number
  remetenteUserId?: number
}

export interface CreateNotificationInput {
  destinatarioEmail: string
  assunto: string
  tipoNotificacao: string
  statusEnvio: StatusEnvio
  mensagemErro?: string
  projetoId?: number
  alunoId?: number
  remetenteUserId?: number
}

// ========================================
// VALIDATION SCHEMAS
// ========================================

export const createNotificationSchema = z.object({
  destinatarioEmail: emailSchema,
  assunto: z.string().min(1).max(255),
  tipoNotificacao: z.string().min(1).max(100),
  statusEnvio: statusEnvioSchema,
  mensagemErro: z.string().optional(),
  projetoId: optionalIdSchema,
  alunoId: optionalIdSchema,
  remetenteUserId: optionalIdSchema,
})

export type CreateNotificationData = z.infer<typeof createNotificationSchema>

// ========================================
// EMAIL HEALTH
// ========================================

// Historical rows are not re-validated on read, so recipients stay loose strings.
export const emailFailureSchema = z.object({
  id: z.number(),
  destinatarioEmail: z.string(),
  assunto: z.string(),
  tipoNotificacao: z.string(),
  mensagemErro: z.string().nullable(),
  dataEnvio: z.date(),
})

export const emailHealthSchema = z.object({
  transport: z.object({
    healthy: z.boolean(),
    checkedAt: z.date(),
    error: z.string().nullable(),
  }),
  failuresLast24h: z.number(),
  recentFailures: z.array(emailFailureSchema),
})

export type EmailFailure = z.infer<typeof emailFailureSchema>
export type EmailHealth = z.infer<typeof emailHealthSchema>
