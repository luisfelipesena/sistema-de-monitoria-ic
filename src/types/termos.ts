import { z } from 'zod'
import { anoSchema, TipoVaga, tipoVagaSchema } from './enums'
import { crSchema, emailSchema, matriculaSchema, nameSchema, phoneSchema } from './schemas'

// ========================================
// TERMOS TYPES
// ========================================

export interface TermoCompromissoData {
  monitor: {
    nome: string
    matricula: string
    email: string
    telefone?: string
    cr: number
  }
  professor: {
    nome: string
    matriculaSiape?: string
    email: string
    departamento: string
  }
  projeto: {
    titulo: string
    disciplinas: Array<{
      codigo: string
      nome: string
    }>
    ano: number
    semestre: string
    cargaHorariaSemana: number
    numeroSemanas: number
  }
  monitoria: {
    tipo: TipoVaga
    dataInicio: string
    dataFim: string
    valorBolsa?: number
  }
  termo: {
    numero: string
    dataGeracao: string
  }
}

// ========================================
// VALIDATION SCHEMAS
// ========================================

export const termoCompromissoSchema = z.object({
  monitor: z.object({
    nome: nameSchema,
    matricula: matriculaSchema,
    email: emailSchema,
    telefone: phoneSchema.optional(),
    cr: crSchema,
  }),
  professor: z.object({
    nome: nameSchema,
    matriculaSiape: z.string().optional(),
    email: emailSchema,
    departamento: nameSchema,
  }),
  projeto: z.object({
    titulo: nameSchema,
    disciplinas: z.array(
      z.object({
        codigo: z.string(),
        nome: nameSchema,
      })
    ),
    ano: anoSchema,
    semestre: z.string(),
    cargaHorariaSemana: z.number().int().positive(),
    numeroSemanas: z.number().int().positive(),
  }),
  monitoria: z.object({
    tipo: tipoVagaSchema,
    dataInicio: z.string(),
    dataFim: z.string(),
    valorBolsa: z.number().optional(),
  }),
  termo: z.object({
    numero: z.string(),
    dataGeracao: z.string(),
  }),
})

export type TermoCompromissoSchemaData = z.infer<typeof termoCompromissoSchema>
