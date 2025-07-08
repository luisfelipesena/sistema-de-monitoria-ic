import { z } from 'zod'
import { TipoAssinatura, tipoAssinaturaSchema } from './enums'
import { signatureDataSchema } from './schemas'

// ========================================
// SIGNATURE TYPES
// ========================================

export interface AssinaturaDocumento {
  id: number
  assinaturaData: string
  tipoAssinatura: TipoAssinatura
  userId: number
  projetoId?: number
  vagaId?: number
  editalId?: number
  createdAt: Date
}

export interface CreateAssinaturaInput {
  assinaturaData: string
  tipoAssinatura: TipoAssinatura
  userId: number
  projetoId?: number
  vagaId?: number
  editalId?: number
}

// ========================================
// VALIDATION SCHEMAS
// ========================================

export const createAssinaturaSchema = z.object({
  assinaturaData: signatureDataSchema,
  tipoAssinatura: tipoAssinaturaSchema,
  userId: z.number().int().positive(),
  projetoId: z.number().int().positive().optional(),
  vagaId: z.number().int().positive().optional(),
  editalId: z.number().int().positive().optional(),
})

export type CreateAssinaturaData = z.infer<typeof createAssinaturaSchema>
