import { z } from 'zod'

// Schemas
export const editalSchema = z.object({
  id: z.number(),
  periodoInscricaoId: z.number(),
  tipo: z.enum(['DCC', 'PROGRAD']).default('DCC'),
  numeroEdital: z.string(),
  titulo: z.string().default('Edital Interno de Seleção de Monitores'),
  descricaoHtml: z.string().nullable(),
  fileIdAssinado: z.string().nullable(),
  fileIdProgradOriginal: z.string().nullable(),
  dataPublicacao: z.date().nullable(),
  publicado: z.boolean(),
  valorBolsa: z.string().default('400.00'),
  // Campos específicos para edital interno DCC
  datasProvasDisponiveis: z.string().nullable(), // JSON array de datas
  dataDivulgacaoResultado: z.date().nullable(),
  // Campos de assinatura do chefe
  chefeAssinouEm: z.date().nullable(),
  chefeAssinatura: z.string().nullable(),
  chefeDepartamentoId: z.number().nullable(),
  criadoPorUserId: z.number(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
})

export const newEditalSchema = z
  .object({
    tipo: z.enum(['DCC', 'PROGRAD']).default('DCC'),
    numeroEdital: z.string().min(1, 'Número do edital é obrigatório'),
    titulo: z.string().min(1, 'Título é obrigatório'),
    descricaoHtml: z.string().optional(),
    valorBolsa: z.string().default('400.00'),
    ano: z.number().min(2000).max(2050),
    semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
    dataInicio: z.date(),
    dataFim: z.date(),
    fileIdProgradOriginal: z.string().optional(), // Para editais PROGRAD
    // Campos específicos para edital interno DCC
    datasProvasDisponiveis: z.array(z.string()).optional(), // Array de datas em formato ISO
    dataDivulgacaoResultado: z.date().optional(),
  })
  .refine((data) => data.dataFim > data.dataInicio, {
    message: 'Data de fim deve ser posterior à data de início',
    path: ['dataFim'],
  })
  .refine(
    (data) => {
      if (data.tipo === 'PROGRAD' && !data.fileIdProgradOriginal) {
        return false
      }
      return true
    },
    {
      message: 'PDF da PROGRAD é obrigatório para editais do tipo PROGRAD',
      path: ['fileIdProgradOriginal'],
    }
  )

export const updateEditalSchema = z
  .object({
    id: z.number(),
    numeroEdital: z.string().optional(),
    titulo: z.string().optional(),
    descricaoHtml: z.string().optional(),
    ano: z.number().min(2000).max(2050).optional(),
    semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']).optional(),
    dataInicio: z.date().optional(),
    dataFim: z.date().optional(),
    // Campos específicos para edital interno DCC
    datasProvasDisponiveis: z.array(z.string()).optional(),
    dataDivulgacaoResultado: z.date().optional(),
  })
  .refine(
    (data) => {
      if (data.dataInicio && data.dataFim) {
        return data.dataFim > data.dataInicio
      }
      return true
    },
    {
      message: 'Data de fim deve ser posterior à data de início',
      path: ['dataFim'],
    }
  )

export const periodoInscricaoComStatusSchema = z.object({
  id: z.number(),
  editalId: z.number(),
  ano: z.number(),
  semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
  dataInicio: z.date(),
  dataFim: z.date(),
  status: z.enum(['ATIVO', 'ENCERRADO', 'FUTURO']),
  edital: editalSchema.nullable(),
  totalProjetosAprovados: z.number().optional(),
  totalInscricoes: z.number().optional(),
})

export const signEditalSchema = z.object({
  editalId: z.number(),
  signatureImage: z.string().min(1, 'Assinatura é obrigatória'),
})

export const editalListItemSchema = editalSchema.extend({
  periodoInscricao: periodoInscricaoComStatusSchema.nullable(),
  criadoPor: z
    .object({
      id: z.number(),
      username: z.string(),
      email: z.string(),
    })
    .nullable(),
})
