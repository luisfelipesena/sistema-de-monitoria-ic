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

// Output schema for list endpoint
export const editalListItemSchema = z.object({
  id: z.number(),
  numeroEdital: z.string(),
  titulo: z.string(),
  descricaoHtml: z.string().nullable(),
  fileIdAssinado: z.string().nullable(),
  fileIdProgradOriginal: z.string().nullable().optional(),
  dataPublicacao: z.date().nullable(),
  publicado: z.boolean(),
  tipo: tipoEditalSchema.optional(),
  chefeAssinouEm: z.date().nullable().optional(),
  chefeAssinatura: z.string().nullable().optional(),
  chefeDepartamentoId: z.number().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date().nullable().optional(),
  periodoInscricaoId: z.number().nullable(),
  periodoInscricao: z
    .object({
      id: z.number(),
      semestre: semestreSchema,
      ano: z.number(),
      dataInicio: z.date(),
      dataFim: z.date(),
      editalId: z.number().optional(),
      status: z.enum(['ATIVO', 'FUTURO', 'FINALIZADO', 'ENCERRADO']),
      totalProjetos: z.number(),
      totalInscricoes: z.number(),
      createdAt: z.date().optional(),
      updatedAt: z.date().nullable().optional(),
    })
    .nullable(),
  criadoPor: z
    .object({
      id: z.number(),
      username: z.string(),
      email: z.string(),
    })
    .nullable(),
  criadoPorUserId: z.number(),
  valorBolsa: z.string(),
})

export const editalListResponseSchema = z.array(editalListItemSchema)

export type CreatePeriodoInscricaoData = z.infer<typeof createPeriodoInscricaoSchema>
export type CreateEditalData = z.infer<typeof createEditalSchema>
export type EditalFormData = z.infer<typeof editalFormSchema>
