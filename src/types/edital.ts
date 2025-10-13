import { z } from 'zod'
import { Semestre, semestreSchema } from './enums'

// ========================================
// EDITAL TYPES
// ========================================

export const TIPO_EDITAL_ENUM = ['DCC', 'PROGRAD'] as const
export type TipoEdital = (typeof TIPO_EDITAL_ENUM)[number]

export const tipoEditalSchema = z.enum(TIPO_EDITAL_ENUM)

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
  tipo: TipoEdital
  numeroEdital: string
  titulo: string
  descricaoHtml?: string
  fileIdAssinado?: string
  fileIdProgradOriginal?: string
  dataPublicacao?: Date
  publicado: boolean
  valorBolsa: string
  criadoPorUserId: number
  createdAt: Date
  updatedAt?: Date
}

export interface CreateEditalInput {
  periodoInscricaoId: number
  tipo: TipoEdital
  numeroEdital: string
  titulo: string
  descricaoHtml?: string
  fileIdAssinado?: string
  fileIdProgradOriginal?: string
  dataPublicacao?: Date
  publicado?: boolean
  valorBolsa?: string
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
  tipo?: TipoEdital
  chefeAssinouEm?: Date | null
  chefeAssinatura?: string | null
  chefeDepartamentoId?: number | null
  createdAt: Date
  periodoInscricao: {
    id: number
    semestre: Semestre
    ano: number
    dataInicio: Date
    dataFim: Date
    status: 'ATIVO' | 'FUTURO' | 'FINALIZADO' | 'ENCERRADO'
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
  tipo: tipoEditalSchema.default('DCC'),
  numeroEdital: z.string().min(1),
  titulo: z.string().min(1),
  descricaoHtml: z.string().optional(),
  fileIdAssinado: z.string().optional(),
  fileIdProgradOriginal: z.string().optional(),
  dataPublicacao: z.date().optional(),
  publicado: z.boolean().default(false),
  valorBolsa: z.string().default('400.00'),
  criadoPorUserId: z.number().int().positive(),
})

export const editalFormSchema = z
  .object({
    tipo: tipoEditalSchema.default('DCC'),
    numeroEdital: z.string().min(1),
    titulo: z.string().min(1),
    descricaoHtml: z.string().optional(),
    valorBolsa: z.string().default('400.00'),
    ano: z.number().int().min(2000).max(2100),
    semestre: semestreSchema,
    dataInicio: z.date(),
    dataFim: z.date(),
  })
  .refine((data) => data.dataFim > data.dataInicio, {
    message: 'Data de fim deve ser posterior à data de início',
    path: ['dataFim'],
  })

export type CreatePeriodoInscricaoData = z.infer<typeof createPeriodoInscricaoSchema>
export type CreateEditalData = z.infer<typeof createEditalSchema>
export type EditalFormData = z.infer<typeof editalFormSchema>
