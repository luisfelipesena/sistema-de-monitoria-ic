import { z } from 'zod'
import { tipoVagaSchema, type TipoVaga, type VoluntarioStatus } from './enums'

// ========================================
// VAGA TYPES
// ========================================

export interface Vaga {
  id: number
  alunoId: number
  projetoId: number
  inscricaoId: number
  tipo: TipoVaga
  dataInicio?: Date
  dataFim?: Date
  createdAt: Date
  updatedAt?: Date
}

export interface CreateVagaInput {
  alunoId: number
  projetoId: number
  inscricaoId: number
  tipo: TipoVaga
  dataInicio?: Date
  dataFim?: Date
}

export interface VoluntarioListItem {
  id: number
  nomeCompleto: string
  email: string
  telefone?: string
  disciplina: {
    codigo: string
    nome: string
  }
  projeto: {
    id: number
    titulo: string
  }
  status: VoluntarioStatus
  dataInicio?: Date
}

// ========================================
// VALIDATION SCHEMAS
// ========================================

export const createVagaSchema = z.object({
  alunoId: z.number().int().positive(),
  projetoId: z.number().int().positive(),
  inscricaoId: z.number().int().positive(),
  tipo: tipoVagaSchema,
  dataInicio: z.date().optional(),
  dataFim: z.date().optional(),
})

export type CreateVagaData = z.infer<typeof createVagaSchema>
