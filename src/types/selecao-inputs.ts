import { z } from 'zod'
import type { UserRole } from './enums'

// ========================================
// SLOT DATA/HORÁRIO - Schemas e Tipos
// ========================================

export interface SlotDataHorario {
  data: string // formato ISO date: "2025-03-15"
  horario: string // formato legível: "14:00" (hora de início)
}

export const slotDataHorarioSchema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  horario: z.string().min(1, 'Horário é obrigatório'),
})

export const datasProvasDisponiveisSchema = z.array(slotDataHorarioSchema).min(1, 'Mínimo 1 opção de data/horário')

// ========================================
// RANGE DE SELEÇÃO - Tipos para o ADM
// ========================================

export interface RangeSelecao {
  dataInicio: string // ISO date: "2025-08-10"
  dataFim: string // ISO date: "2025-08-15"
  horarioInicio: string // "08:00"
  horarioFim: string // "18:00"
}

export const rangeSelecaoSchema = z.object({
  dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data início inválida'),
  dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data fim inválida'),
  horarioInicio: z.string().regex(/^\d{2}:\d{2}$/, 'Horário início inválido'),
  horarioFim: z.string().regex(/^\d{2}:\d{2}$/, 'Horário fim inválido'),
})

// Schema para a escolha do professor (exatamente 1 data+horário de início)
export const datasSelecaoEscolhidasSchema = z
  .array(slotDataHorarioSchema)
  .min(1, 'Selecione 1 data/horário de seleção')
  .max(1, 'Selecione apenas 1 data/horário de seleção')

// ========================================
// SELEÇÃO - Tipos de Input
// ========================================

export type GenerateAtaDataInput = {
  projetoId: string
  userId: number
  userRole: UserRole
}

export type CreateAtaInput = {
  projetoId: string
  userId: number
  userRole: UserRole
}

export type SignAtaInput = {
  ataId: number
  assinaturaBase64: string
  userId: number
  userRole: UserRole
}

export type PublishResultsInput = {
  projetoId: string
  notifyStudents: boolean
  mensagemPersonalizada?: string
  userId: number
  userRole: UserRole
}

export type SelectMonitorsInput = {
  projetoId: number
  bolsistas: number[]
  voluntarios: number[]
  motivoTroca?: string
  userId: number
  userRole: UserRole
}
