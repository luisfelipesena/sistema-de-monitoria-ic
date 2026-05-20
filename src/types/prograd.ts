import { z } from 'zod'
import { PrioridadeProblema, prioridadeProblemaSchema, TipoProblema, tipoProblemaSchema } from './enums'
import { idSchema, nameSchema } from './schemas'

// ========================================
// PROGRAD/VALIDATION TYPES
// ========================================

export interface ValidationProblem {
  tipo: TipoProblema
  vagaId: number
  nomeAluno: string
  problemas: string[]
  prioridade: PrioridadeProblema
}

export interface ValidationResult {
  valido: boolean
  totalProblemas: number
  problemas: ValidationProblem[]
}

// ========================================
// VALIDATION SCHEMAS
// ========================================

export const validationProblemSchema = z.object({
  tipo: tipoProblemaSchema,
  vagaId: idSchema,
  nomeAluno: nameSchema,
  problemas: z.array(z.string()),
  prioridade: prioridadeProblemaSchema,
})

export const validationResultSchema = z.object({
  valido: z.boolean(),
  totalProblemas: z.number(),
  problemas: z.array(validationProblemSchema),
})

export type ValidationProblemData = z.infer<typeof validationProblemSchema>
export type ValidationResultData = z.infer<typeof validationResultSchema>
