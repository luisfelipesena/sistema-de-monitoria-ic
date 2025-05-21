import { tipoInscricaoEnum, tipoVagaEnum } from '@/server/database/schema';
import { z } from 'zod';

// Schema representing one available vaga returned to the FE
export const vagaDisponivelSchema = z.object({
  id: z.string(), // Combination of projetoId + tipo
  projetoId: z.number(),
  nome: z.string(),
  codigo: z.string(),
  tipo: z.enum(tipoVagaEnum.enumValues),
  vagas: z.number(),
});

export type VagaDisponivel = z.infer<typeof vagaDisponivelSchema>;

// Document sent when finishing application
export const inscricaoDocumentoInputSchema = z.object({
  tipoDocumento: z.string(),
  fileId: z.string(),
});

// Body for POST /api/monitoria/inscricao
export const criarInscricaoSchema = z.object({
  projetoId: z.number(),
  tipoVagaPretendida: z.enum(tipoInscricaoEnum.enumValues),
  documentos: z.array(inscricaoDocumentoInputSchema).optional(),
});

export type CriarInscricaoInput = z.infer<typeof criarInscricaoSchema>;
