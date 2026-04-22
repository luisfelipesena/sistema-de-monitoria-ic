import { z } from 'zod'
import { Genero, generoSchema, StudentStatus } from './enums'
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
  cursoNome?: string
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
  cursoNome?: string
}

export interface AlunoListItem {
  id: number
  nomeCompleto: string
  matricula: string | null
  emailInstitucional: string | null
  cpf: string | null
  telefone?: string
  cr: number | null
  cursoNome: string | null
  status: StudentStatus
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
  cursoNome: z.string().optional(),
})

export type CreateStudentData = z.infer<typeof createStudentSchema>

// ========================================
// PROFILE PATCH (inscription wizard)
// Fields the student can complete during an inscription if their profile is incomplete.
// ========================================

export const enderecoPatchSchema = z.object({
  rua: z.string().min(1, 'Rua é obrigatória'),
  numero: z.number().int().positive().nullable().optional(),
  bairro: z.string().min(1, 'Bairro é obrigatório'),
  cidade: z.string().min(1, 'Cidade é obrigatória'),
  estado: z.string().min(1, 'Estado é obrigatório'),
  cep: z.string().min(1, 'CEP é obrigatório'),
  complemento: z.string().nullable().optional(),
})

export const alunoProfilePatchSchema = z.object({
  nomeCompleto: z.string().min(1).optional(),
  nomeSocial: z.string().nullable().optional(),
  cpf: cpfSchema.optional(),
  rg: z.string().min(1).optional(),
  dataNascimento: z.coerce.date().optional(),
  genero: generoSchema.optional(),
  telefone: z.string().min(1).optional(),
  telefoneFixo: z.string().nullable().optional(),
  cursoNome: z.string().min(1).optional(),
  endereco: enderecoPatchSchema.optional(),
  // Banking (required only for bolsista — enforced server-side)
  banco: z.string().nullable().optional(),
  agencia: z.string().nullable().optional(),
  conta: z.string().nullable().optional(),
  digitoConta: z.string().nullable().optional(),
})

export type EnderecoPatch = z.infer<typeof enderecoPatchSchema>
export type AlunoProfilePatch = z.infer<typeof alunoProfilePatchSchema>

// Full profile returned by aluno.getFullProfile — used to pre-fill the wizard
export interface AlunoFullProfile {
  id: number
  userId: number
  nomeCompleto: string
  nomeSocial: string | null
  cpf: string | null
  rg: string | null
  matricula: string | null
  dataNascimento: Date | null
  genero: Genero | null
  telefone: string | null
  telefoneFixo: string | null
  cursoNome: string | null
  emailInstitucional: string | null
  cr: number | null
  banco: string | null
  agencia: string | null
  conta: string | null
  digitoConta: string | null
  historicoEscolarFileId: string | null
  comprovanteMatriculaFileId: string | null
  endereco: {
    id: number
    rua: string
    numero: number | null
    bairro: string
    cidade: string
    estado: string
    cep: string
    complemento: string | null
  } | null
  user: {
    id: number
    username: string
    email: string
  }
}
