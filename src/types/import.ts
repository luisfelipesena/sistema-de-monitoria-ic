import { z } from 'zod'
import { ImportStatus, Semestre, anoSchema, semestreSchema } from './enums'

// ========================================
// IMPORT TYPES
// ========================================

export interface ImportacaoPlanejamento {
  id: number
  fileId: string
  nomeArquivo: string
  ano: number
  semestre: Semestre
  totalProjetos: number
  projetosCriados: number
  projetosComErro: number
  status: ImportStatus
  erros?: string
  importadoPorUserId: number
  createdAt: Date
  updatedAt?: Date
}

export interface CreateImportInput {
  fileId: string
  nomeArquivo: string
  ano: number
  semestre: Semestre
  importadoPorUserId: number
}

export interface ImportHistoryItem {
  id: number
  nomeArquivo: string
  ano: number
  semestre: string
  totalProjetos: number
  projetosCriados: number
  projetosComErro: number
  status: string
  professoresNotificadosEm: Date | null
  importadoPor: {
    username: string
    email: string
  }
  createdAt: Date
}

// ========================================
// VALIDATION SCHEMAS
// ========================================

export const createImportSchema = z.object({
  fileId: z.string(),
  nomeArquivo: z.string(),
  ano: anoSchema,
  semestre: semestreSchema,
  importadoPorUserId: z.number().int().positive(),
})

export const importFormSchema = z.object({
  ano: anoSchema,
  semestre: semestreSchema,
  numeroEditalPrograd: z.string().optional(),
})

export type CreateImportData = z.infer<typeof createImportSchema>
export type ImportFormData = z.infer<typeof importFormSchema>
