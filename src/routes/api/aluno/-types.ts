import {
  insertAlunoTableSchema,
  selectAlunoTableSchema,
} from '@/server/database/schema';
import { z } from 'zod';

// Schema estendido para incluir campos de upload
export const alunoInputSchema = insertAlunoTableSchema.extend({
  historicoEscolarFileId: z.string().optional(),
  comprovanteMatriculaFileId: z.string({
    required_error: 'O comprovante de matrícula é obrigatório',
  }),
});

// Schema for response to ensure type safety
export const alunoResponseSchema = selectAlunoTableSchema;

export type AlunoResponse = z.infer<typeof alunoResponseSchema>;
export type AlunoInput = z.infer<typeof alunoInputSchema>;
