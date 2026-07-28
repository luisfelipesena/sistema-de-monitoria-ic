import { z } from 'zod'
import { idSchema } from './schemas'

// Motivo is required because it is the only context the audit trail keeps about a manual reset.
export const adminGeneratePasswordResetSchema = z.object({
  userId: idSchema,
  motivo: z.string().min(5, 'Descreva o motivo com pelo menos 5 caracteres').max(200),
})

export const adminPasswordResetLinkSchema = z.object({
  resetLink: z.string().url(),
  expiresAt: z.date(),
  emailSent: z.boolean(),
})

export type AdminGeneratePasswordResetInput = z.infer<typeof adminGeneratePasswordResetSchema>
export type AdminPasswordResetLink = z.infer<typeof adminPasswordResetLinkSchema>
