import { z } from 'zod'
import { idSchema, nameSchema } from './schemas'

// ========================================
// DISCIPLINE TYPES
// ========================================

export interface Discipline {
  id: number
  nome: string
  codigo: string
  turma: string
  departamentoId: number
  createdAt: Date
  updatedAt?: Date
  deletedAt?: Date
}

export interface CreateDisciplineInput {
  nome: string
  codigo: string
  turma: string
  departamentoId: number
}

export interface DisciplinaListItem {
  id: number
  codigo: string
  nome: string
  turma: string
  departamentoId: number
}

// ========================================
// VALIDATION SCHEMAS
// ========================================

export const createDisciplineSchema = z.object({
  nome: z.string().min(1),
  codigo: z.string().min(1),
  turma: z.string().min(1),
  departamentoId: z.number().int().positive(),
})

export const updateDisciplineSchema = z.object({
  id: idSchema,
  nome: nameSchema.optional(),
  codigo: z.string().min(1).optional(),
  turma: z.string().min(1).optional(),
  departamentoId: idSchema.optional(),
})

export const disciplinaSchema = z.object({
  id: idSchema,
  nome: nameSchema,
  codigo: z.string().min(1),
  turma: z.string().min(1),
  departamentoId: idSchema,
  createdAt: z.date(),
  updatedAt: z.date().nullable().optional(),
  deletedAt: z.date().nullable().optional(),
})

export const newDisciplinaSchema = z.object({
  nome: z.string().min(1),
  codigo: z.string().min(1),
  turma: z.string().min(1),
  departamentoId: z.number().int().positive(),
})

export type CreateDisciplineData = z.infer<typeof createDisciplineSchema>
export type UpdateDisciplineData = z.infer<typeof updateDisciplineSchema>
export type DisciplinaData = z.infer<typeof disciplinaSchema>
export type NewDisciplinaData = z.infer<typeof newDisciplinaSchema>
