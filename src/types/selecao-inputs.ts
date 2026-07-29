import { z } from 'zod'
import type { UserRole } from './enums'

// ========================================
// SLOT DATA/HORÁRIO - Schemas e Tipos
// ========================================

export interface SlotDataHorario {
  data: string // formato ISO date: "2025-03-15"
  horario: string // formato legível: "14:00-16:00"
}

export const slotDataHorarioSchema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  horario: z.string().min(1, 'Horário é obrigatório'),
})

export const datasProvasDisponiveisSchema = z
  .array(slotDataHorarioSchema)
  .min(2, 'Mínimo 2 opções de data/horário')
  .max(3, 'Máximo 3 opções de data/horário')

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
  userId: number
  userRole: UserRole
}
