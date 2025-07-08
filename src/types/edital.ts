import { z } from 'zod'
import { Semestre, semestreSchema } from './enums'

// ========================================
// PERIODO INSCRICAO & EDITAL TYPES
// ========================================

export interface PeriodoInscricao {
  id: number
  semestre: Semestre
  ano: number
  dataInicio: Date
  dataFim: Date
  createdAt: Date
  updatedAt?: Date
}

export interface CreatePeriodoInscricaoInput {
  semestre: Semestre
  ano: number
  dataInicio: Date
  dataFim: Date
}

export interface Edital {
  id: number
  periodoInscricaoId: number
  numeroEdital: string
  titulo: string
  descricaoHtml?: string
  fileIdAssinado?: string
  dataPublicacao?: Date
  publicado: boolean
  criadoPorUserId: number
  createdAt: Date
  updatedAt?: Date
}

export interface CreateEditalInput {
  periodoInscricaoId: number
  numeroEdital: string
  titulo: string
  descricaoHtml?: string
  fileIdAssinado?: string
  dataPublicacao?: Date
  publicado?: boolean
  criadoPorUserId: number
}

export interface EditalListItem {
  id: number
  numeroEdital: string
  titulo: string
  descricaoHtml: string | null
  fileIdAssinado: string | null
  dataPublicacao: Date | null
  publicado: boolean
  createdAt: Date
  periodoInscricao: {
    id: number
    semestre: Semestre
    ano: number
    dataInicio: Date
    dataFim: Date
    status: 'ATIVO' | 'FUTURO' | 'FINALIZADO'
    totalProjetos: number
    totalInscricoes: number
  } | null
  criadoPor: {
    id: number
    username: string
    email: string
  } | null
}

// ========================================
// VALIDATION SCHEMAS
// ========================================

export const createPeriodoInscricaoSchema = z.object({
  semestre: semestreSchema,
  ano: z.number().int().min(2000).max(2100),
  dataInicio: z.date(),
  dataFim: z.date(),
})

export const createEditalSchema = z.object({
  periodoInscricaoId: z.number().int().positive(),
  numeroEdital: z.string().min(1),
  titulo: z.string().min(1),
  descricaoHtml: z.string().optional(),
  fileIdAssinado: z.string().optional(),
  dataPublicacao: z.date().optional(),
  publicado: z.boolean().default(false),
  criadoPorUserId: z.number().int().positive(),
})

export const editalFormSchema = z.object({
  numeroEdital: z.string().min(1),
  titulo: z.string().min(1),
  descricaoHtml: z.string().optional(),
  ano: z.number().int().min(2000).max(2100),
  semestre: semestreSchema,
  dataInicio: z.date(),
  dataFim: z.date(),
}).refine((data) => data.dataFim > data.dataInicio, {
  message: 'Data de fim deve ser posterior à data de início',
  path: ['dataFim'],
})

export type CreatePeriodoInscricaoData = z.infer<typeof createPeriodoInscricaoSchema>
export type CreateEditalData = z.infer<typeof createEditalSchema>
export type EditalFormData = z.infer<typeof editalFormSchema>
