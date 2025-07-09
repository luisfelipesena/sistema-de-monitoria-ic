import { z } from 'zod'
import {
  ModalidadeCurso,
  modalidadeCursoSchema,
  StatusCurso,
  statusCursoSchema,
  TipoCurso,
  tipoCursoSchema,
} from './enums'
import { idSchema, nameSchema } from './schemas'

// ========================================
// COURSE TYPES
// ========================================

export interface Course {
  id: number
  nome: string
  codigo: number
  tipo: TipoCurso
  modalidade: ModalidadeCurso
  duracao: number
  departamentoId: number
  cargaHoraria: number
  descricao?: string
  coordenador?: string
  emailCoordenacao?: string
  status: StatusCurso
  createdAt: Date
  updatedAt?: Date
}

export interface CreateCourseInput {
  nome: string
  codigo: number
  tipo: TipoCurso
  modalidade: ModalidadeCurso
  duracao: number
  departamentoId: number
  cargaHoraria: number
  descricao?: string
  coordenador?: string
  emailCoordenacao?: string
  status?: StatusCurso
}

export interface CursoListItem {
  id: number
  nome: string
  codigo: string
  tipo: 'BACHARELADO' | 'LICENCIATURA' | 'TECNICO' | 'POS_GRADUACAO'
  modalidade: 'PRESENCIAL' | 'EAD' | 'HIBRIDO'
  duracao: number // em semestres
  cargaHoraria: number
  descricao?: string
  departamento: {
    id: number
    nome: string
    sigla: string
  }
  coordenador?: string
  emailCoordenacao?: string
  alunos: number
  disciplinas: number
  projetos: number
  status: 'ATIVO' | 'INATIVO' | 'EM_REFORMULACAO'
  criadoEm: string
  atualizadoEm: string
}

// ========================================
// VALIDATION SCHEMAS
// ========================================

export const createCourseSchema = z.object({
  nome: z.string().min(1),
  codigo: z.number().int().nonnegative(),
  tipo: tipoCursoSchema,
  modalidade: modalidadeCursoSchema,
  duracao: z.number().int().nonnegative(),
  departamentoId: z.number().int().positive(),
  cargaHoraria: z.number().int().nonnegative(),
  descricao: z.string().optional(),
  coordenador: z.string().optional(),
  emailCoordenacao: z.string().email().optional(),
  status: statusCursoSchema.default('ATIVO'),
})

export const courseSchema = z.object({
  id: idSchema,
  nome: nameSchema,
  codigo: z.number().int().nonnegative(),
  tipo: z.enum(['BACHARELADO', 'LICENCIATURA', 'TECNICO', 'POS_GRADUACAO']),
  modalidade: z.enum(['PRESENCIAL', 'EAD', 'HIBRIDO']),
  duracao: z.number().int().nonnegative(),
  departamentoId: idSchema,
  cargaHoraria: z.number().int().nonnegative(),
  descricao: z.string().nullable().optional(),
  coordenador: z.string().nullable().optional(),
  emailCoordenacao: z.string().email().nullable().optional(),
  status: z.enum(['ATIVO', 'INATIVO', 'EM_REFORMULACAO']),
  createdAt: z.date(),
  updatedAt: z.date().nullable().optional(),
})

export const updateCourseSchema = z.object({
  id: idSchema,
  nome: nameSchema.optional(),
  codigo: z.number().int().nonnegative().optional(),
  tipo: z.enum(['BACHARELADO', 'LICENCIATURA', 'TECNICO', 'POS_GRADUACAO']).optional(),
  modalidade: z.enum(['PRESENCIAL', 'EAD', 'HIBRIDO']).optional(),
  duracao: z.number().int().nonnegative().optional(),
  departamentoId: idSchema.optional(),
  cargaHoraria: z.number().int().nonnegative().optional(),
  descricao: z.string().nullable().optional(),
  coordenador: z.string().nullable().optional(),
  emailCoordenacao: z.string().email().nullable().optional(),
  status: z.enum(['ATIVO', 'INATIVO', 'EM_REFORMULACAO']).optional(),
})

export type CreateCourseData = z.infer<typeof createCourseSchema>
export type CourseData = z.infer<typeof courseSchema>
export type UpdateCourseData = z.infer<typeof updateCourseSchema>
