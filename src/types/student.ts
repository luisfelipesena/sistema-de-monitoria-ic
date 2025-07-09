import { z } from 'zod'
import { Genero, generoSchema } from './enums'
import { cpfSchema } from './schemas'

// ========================================
// STUDENT TYPES
// ========================================

export interface Student {
  id: number
  userId: number
  nomeCompleto: string
  nomeSocial?: string
  genero: Genero
  especificacaoGenero?: string
  emailInstitucional: string
  matricula: string
  rg?: string
  cpf: string
  cr: number
  telefone?: string
  banco?: string
  agencia?: string
  conta?: string
  digitoConta?: string
  enderecoId?: number
  cursoId: number
  historicoEscolarFileId?: string
  comprovanteMatriculaFileId?: string
  createdAt: Date
  updatedAt?: Date
}

export interface CreateStudentInput {
  userId: number
  nomeCompleto: string
  nomeSocial?: string
  genero: Genero
  especificacaoGenero?: string
  emailInstitucional: string
  matricula: string
  rg?: string
  cpf: string
  cr: number
  telefone?: string
  banco?: string
  agencia?: string
  conta?: string
  digitoConta?: string
  enderecoId?: number
  cursoId: number
}

export interface AlunoListItem {
  id: number
  nomeCompleto: string
  matricula: string
  emailInstitucional: string
  cpf: string
  telefone?: string
  cr: number
  curso: {
    id: number
    nome: string
    departamento: string
  }
  status: 'ATIVO' | 'INATIVO' | 'GRADUADO' | 'TRANSFERIDO'
  inscricoes: number
  bolsasAtivas: number
  voluntariadosAtivos: number
  documentosValidados: number
  totalDocumentos: number
  criadoEm: string
}

// ========================================
// VALIDATION SCHEMAS
// ========================================

export const createStudentSchema = z.object({
  userId: z.number().int().positive(),
  nomeCompleto: z.string().min(1),
  nomeSocial: z.string().optional(),
  genero: generoSchema,
  especificacaoGenero: z.string().optional(),
  emailInstitucional: z.string().email(),
  matricula: z.string().min(1),
  rg: z.string().optional(),
  cpf: cpfSchema,
  cr: z.number().min(0).max(10),
  telefone: z.string().optional(),
  banco: z.string().optional(),
  agencia: z.string().optional(),
  conta: z.string().optional(),
  digitoConta: z.string().optional(),
  enderecoId: z.number().int().positive().optional(),
  cursoId: z.number().int().positive(),
})

export type CreateStudentData = z.infer<typeof createStudentSchema>
