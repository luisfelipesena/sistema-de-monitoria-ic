import { z } from 'zod'
import { nameSchema } from './schemas'

// ========================================
// DEPARTMENT TYPES
// ========================================

export interface Department {
  id: number
  unidadeUniversitaria: string
  nome: string
  sigla?: string
  coordenador?: string
  email?: string
  telefone?: string
  descricao?: string
  createdAt: Date
  updatedAt?: Date
}

export interface CreateDepartmentInput {
  unidadeUniversitaria: string
  nome: string
  sigla?: string
  coordenador?: string
  email?: string
  telefone?: string
  descricao?: string
}

export interface DepartamentoListItem {
  id: number
  nome: string
  sigla: string
  descricao?: string
  instituto?: string
  coordenador?: string
  email?: string
  telefone?: string
  professores: number
  cursos: number
  disciplinas: number
  projetos: number
  status: 'ATIVO' | 'INATIVO'
  criadoEm: string
  atualizadoEm: string
}

// ========================================
// VALIDATION SCHEMAS
// ========================================

export const createDepartmentSchema = z.object({
  unidadeUniversitaria: z.string().min(1),
  nome: z.string().min(1),
  sigla: z.string().optional(),
  coordenador: z.string().optional(),
  email: z.string().email().optional(),
  telefone: z.string().optional(),
  descricao: z.string().optional(),
})

export const updateDepartmentSchema = z.object({
  id: z.number().int().positive(),
  unidadeUniversitaria: z.string().min(1).optional(),
  nome: nameSchema.optional(),
  sigla: z.string().nullable().optional(),
  coordenador: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  telefone: z.string().nullable().optional(),
  descricao: z.string().nullable().optional(),
})

export const departamentoSchema = z.object({
  id: z.number().int().positive(),
  unidadeUniversitaria: z.string().min(1),
  nome: nameSchema,
  sigla: z.string().nullable().optional(),
  coordenador: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  telefone: z.string().nullable().optional(),
  descricao: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date().nullable().optional(),
})

export type CreateDepartmentData = z.infer<typeof createDepartmentSchema>
export type UpdateDepartmentData = z.infer<typeof updateDepartmentSchema>
export type DepartamentoData = z.infer<typeof departamentoSchema>
