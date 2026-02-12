import { z } from 'zod'
import { Semestre, semestreSchema, TipoEdital, tipoEditalSchema } from './enums'
import { type PeriodoInscricaoStatus } from './schemas'

// ========================================
// EDITAL TYPES
// ========================================

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
  fileIdPdfExterno?: string
  dataPublicacao?: Date
  publicado: boolean
  valorBolsa: string
  // Datas de seleção
  dataInicioSelecao?: Date
  dataFimSelecao?: Date
  datasProvasDisponiveis?: string
  dataDivulgacaoResultado?: Date
  // Link para formulário
  linkFormularioInscricao?: string
  // Campos específicos
  pontosProva?: string
  bibliografia?: string
  criadoPorUserId: number
  createdAt: Date
  updatedAt?: Date
}

export interface EditalListItem {
  id: number
  numeroEdital: string
  titulo: string
  descricaoHtml: string | null
  fileIdAssinado: string | null
  fileIdPdfExterno: string | null
  dataPublicacao: Date | null
  publicado: boolean
  tipo?: TipoEdital
  // Datas de seleção
  dataInicioSelecao?: Date | null
  dataFimSelecao?: Date | null
  dataDivulgacaoResultado?: Date | null
  // Link formulário
  linkFormularioInscricao?: string | null
  // Assinatura
  chefeAssinouEm?: Date | null
  chefeAssinatura?: string | null
  chefeDepartamentoId?: number | null
  createdAt: Date
  periodoInscricao: {
    id: number
    semestre: Semestre
    ano: number
    dataInicio: Date // Data início INSCRIÇÃO
    dataFim: Date // Data fim INSCRIÇÃO
    numeroEditalPrograd?: string | null
    status: PeriodoInscricaoStatus
    totalProjetos: number
    totalInscricoes: number
  } | null
  criadoPor: {
    id: number
    username: string
    email: string
  } | null
}

// Type for Edital with PeriodoInscricao status (used in services)
export interface EditalWithPeriodoStatus {
  id: number
  createdAt: Date
  updatedAt: Date | null
  tipo: TipoEdital
  titulo: string
  periodoInscricaoId: number
  numeroEdital: string
  descricaoHtml: string | null
  fileIdAssinado: string | null
  fileIdPdfExterno: string | null
  dataPublicacao: Date | null
  publicado: boolean
  valorBolsa: string
  // Datas de seleção
  dataInicioSelecao: Date | null
  dataFimSelecao: Date | null
  datasProvasDisponiveis: string | null
  dataDivulgacaoResultado: Date | null
  // Link formulário
  linkFormularioInscricao: string | null
  // Campos específicos
  pontosProva: string | null
  bibliografia: string | null
  chefeAssinouEm: Date | null
  chefeAssinatura: string | null
  chefeDepartamentoId: number | null
  criadoPorUserId: number
  periodoInscricao: {
    id: number
    createdAt: Date
    updatedAt: Date | null
    ano: number
    semestre: Semestre
    dataInicio: Date // Data início INSCRIÇÃO
    dataFim: Date // Data fim INSCRIÇÃO
    totalBolsasPrograd: number | null
    numeroEditalPrograd: string | null
    status: PeriodoInscricaoStatus
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
  fileIdPdfExterno: z.string().optional(),
  dataPublicacao: z.date().optional(),
  publicado: z.boolean().default(false),
  valorBolsa: z.string().default('400.00'),
  // Datas de seleção
  dataInicioSelecao: z.date().optional(),
  dataFimSelecao: z.date().optional(),
  dataDivulgacaoResultado: z.date().optional(),
  criadoPorUserId: z.number().int().positive(),
})

export const editalFormSchema = z
  .object({
    tipo: tipoEditalSchema.default('DCC'),
    numeroEdital: z.string().min(1, 'Número do edital é obrigatório'),
    titulo: z.string().min(1, 'Título é obrigatório'),
    descricaoHtml: z.string().optional(),
    valorBolsa: z.string().default('400.00'),
    ano: z.number().int().min(2000).max(2100),
    semestre: semestreSchema,
    // Datas de INSCRIÇÃO
    dataInicioInscricao: z.date(),
    dataFimInscricao: z.date(),
    // Datas de SELEÇÃO
    dataInicioSelecao: z.date().optional(),
    dataFimSelecao: z.date().optional(),
    // Data de divulgação dos resultados
    dataDivulgacaoResultado: z.date().optional(),
  })
  .refine((data) => data.dataFimInscricao > data.dataInicioInscricao, {
    message: 'Data fim de inscrição deve ser posterior à data início',
    path: ['dataFimInscricao'],
  })
  .refine(
    (data) => {
      if (data.dataInicioSelecao && data.dataFimSelecao) {
        return data.dataFimSelecao >= data.dataInicioSelecao
      }
      return true
    },
    {
      message: 'Data fim de seleção deve ser posterior ou igual à data início',
      path: ['dataFimSelecao'],
    }
  )

// Schema para editar apenas o número do edital
export const updateNumeroEditalSchema = z.object({
  id: z.number().int().positive(),
  numeroEdital: z.string().min(1, 'Número do edital é obrigatório'),
})

export type CreatePeriodoInscricaoData = z.infer<typeof createPeriodoInscricaoSchema>
export type CreateEditalData = z.infer<typeof createEditalSchema>
export type EditalFormData = z.infer<typeof editalFormSchema>
export type UpdateNumeroEditalData = z.infer<typeof updateNumeroEditalSchema>
