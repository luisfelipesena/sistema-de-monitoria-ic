import { z } from 'zod'
import { tipoVagaSchema } from './enums'

// ========================================
// VAGA TYPES
// ========================================

export interface Vaga {
  id: number
  alunoId: number
  projetoId: number
  inscricaoId: number
  tipo: 'BOLSISTA' | 'VOLUNTARIO'
  dataInicio?: Date
  dataFim?: Date
  createdAt: Date
  updatedAt?: Date
}

export interface CreateVagaInput {
  alunoId: number
  projetoId: number
  inscricaoId: number
  tipo: 'BOLSISTA' | 'VOLUNTARIO'
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
  status: 'ATIVO' | 'INATIVO' | 'PENDENTE'
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
