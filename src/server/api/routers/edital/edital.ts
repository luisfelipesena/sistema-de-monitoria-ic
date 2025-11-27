import { adminProtectedProcedure, createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/api/trpc'
import { createEditalService } from '@/server/services/edital/edital-service'
import { NotFoundError, ValidationError, ConflictError, ForbiddenError } from '@/types/errors'
import { semestreSchema, tipoEditalSchema, periodoInscricaoStatusSchema } from '@/types'
import { logger } from '@/utils/logger'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

const log = logger.child({ context: 'EditalRouter' })

export const editalSchema = z.object({
  id: z.number(),
  periodoInscricaoId: z.number(),
  tipo: tipoEditalSchema.default('DCC'),
  numeroEdital: z.string(),
  titulo: z.string().default('Edital Interno de Seleção de Monitores'),
  descricaoHtml: z.string().nullable(),
  fileIdAssinado: z.string().nullable(),
  fileIdProgradOriginal: z.string().nullable(),
  dataPublicacao: z.date().nullable(),
  publicado: z.boolean(),
  valorBolsa: z.string().default('400.00'),
  datasProvasDisponiveis: z.string().nullable(),
  dataDivulgacaoResultado: z.date().nullable(),
  chefeAssinouEm: z.date().nullable(),
  chefeAssinatura: z.string().nullable(),
  chefeDepartamentoId: z.number().nullable(),
  criadoPorUserId: z.number(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
})

export const newEditalSchema = z
  .object({
    tipo: tipoEditalSchema.default('DCC'),
    numeroEdital: z.string().min(1, 'Número do edital é obrigatório'),
    titulo: z.string().min(1, 'Título é obrigatório'),
    descricaoHtml: z.string().optional(),
    valorBolsa: z.string().default('400.00'),
    ano: z.number().min(2000).max(2050),
    semestre: semestreSchema,
    dataInicio: z.date(),
    dataFim: z.date(),
    fileIdProgradOriginal: z.string().optional(),
    datasProvasDisponiveis: z.array(z.string()).optional(),
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
    semestre: semestreSchema.optional(),
    dataInicio: z.date().optional(),
    dataFim: z.date().optional(),
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
  semestre: semestreSchema,
  ano: z.number(),
  dataInicio: z.date(),
  dataFim: z.date(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
  status: periodoInscricaoStatusSchema,
  totalProjetos: z.number().default(0),
  totalInscricoes: z.number().default(0),
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

function handleServiceError(error: unknown): never {
  if (error instanceof NotFoundError) {
    throw new TRPCError({ code: 'NOT_FOUND', message: error.message })
  }
  if (error instanceof ValidationError) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: error.message })
  }
  if (error instanceof ConflictError) {
    throw new TRPCError({ code: 'CONFLICT', message: error.message })
  }
  if (error instanceof ForbiddenError) {
    throw new TRPCError({ code: 'FORBIDDEN', message: error.message })
  }
  if (error instanceof TRPCError) {
    throw error
  }
  log.error(error, 'Unexpected error in edital router')
  throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro interno no servidor' })
}

export const editalRouter = createTRPCRouter({
  getActivePeriod: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/editais/active-period',
        tags: ['editais'],
        summary: 'Get active enrollment period',
        description: 'Get the currently active enrollment period',
      },
    })
    .input(z.void())
    .output(
      z.object({
        periodo: periodoInscricaoComStatusSchema.nullable(),
        edital: editalSchema.nullable(),
      })
    )
    .query(async ({ ctx }) => {
      try {
        const service = createEditalService(ctx.db)
        return await service.getActivePeriod()
      } catch (error) {
        handleServiceError(error)
      }
    }),

  getEditais: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/editais',
        tags: ['editais'],
        summary: 'List editais',
        description: 'Retrieve all editais with their enrollment periods',
      },
    })
    .input(z.void())
    .output(z.array(editalListItemSchema))
    .query(async ({ ctx }) => {
      try {
        const service = createEditalService(ctx.db)
        return await service.getEditais()
      } catch (error) {
        handleServiceError(error)
      }
    }),

  getEdital: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/editais/{id}',
        tags: ['editais'],
        summary: 'Get edital',
        description: 'Retrieve a specific edital',
      },
    })
    .input(z.object({ id: z.number() }))
    .output(editalListItemSchema)
    .query(async ({ input, ctx }) => {
      try {
        const service = createEditalService(ctx.db)
        return await service.getEdital(input.id)
      } catch (error) {
        handleServiceError(error)
      }
    }),

  createEdital: adminProtectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/editais',
        tags: ['editais'],
        summary: 'Create edital',
        description: 'Create a new edital with its enrollment period',
      },
    })
    .input(newEditalSchema)
    .output(editalListItemSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createEditalService(ctx.db)
        return await service.createEdital({
          ...input,
          criadoPorUserId: ctx.user.id,
        })
      } catch (error) {
        handleServiceError(error)
      }
    }),

  updateEdital: adminProtectedProcedure
    .meta({
      openapi: {
        method: 'PUT',
        path: '/editais/{id}',
        tags: ['editais'],
        summary: 'Update edital',
        description: 'Update an existing edital and its enrollment period',
      },
    })
    .input(updateEditalSchema)
    .output(editalSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createEditalService(ctx.db)
        return await service.updateEdital(input)
      } catch (error) {
        handleServiceError(error)
      }
    }),

  deleteEdital: adminProtectedProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/editais/{id}',
        tags: ['editais'],
        summary: 'Delete edital',
        description: 'Delete an edital and its associated enrollment period',
      },
    })
    .input(z.object({ id: z.number() }))
    .output(z.void())
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createEditalService(ctx.db)
        await service.deleteEdital(input.id)
      } catch (error) {
        handleServiceError(error)
      }
    }),

  publishEdital: adminProtectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/editais/{id}/publish',
        tags: ['editais'],
        summary: 'Publish edital',
        description: 'Publish an edital making it publicly available',
      },
    })
    .input(z.object({ id: z.number() }))
    .output(editalSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createEditalService(ctx.db)
        return await service.publishEdital(input.id, ctx.user.id)
      } catch (error) {
        handleServiceError(error)
      }
    }),

  publishAndNotify: adminProtectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/editais/{id}/publish-and-notify',
        tags: ['editais'],
        summary: 'Publish edital and send notification emails',
        description: 'Publish an edital and automatically send notification emails to students and professors',
      },
    })
    .input(
      z.object({
        id: z.number(),
        emailLists: z.array(z.string().email()).optional().default(['estudantes.ic@ufba.br', 'professores.ic@ufba.br']),
      })
    )
    .output(
      z.object({
        edital: editalSchema,
        emailsSent: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createEditalService(ctx.db)
        return await service.publishAndNotify(input.id, ctx.user.id, input.emailLists)
      } catch (error) {
        handleServiceError(error)
      }
    }),

  uploadSignedEdital: adminProtectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/editais/{id}/upload-signed',
        tags: ['editais'],
        summary: 'Upload signed edital',
        description: 'Upload a signed version of the edital PDF',
      },
    })
    .input(z.object({ id: z.number(), fileId: z.string() }))
    .output(editalSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createEditalService(ctx.db)
        return await service.uploadSignedEdital(input.id, input.fileId, ctx.user.id)
      } catch (error) {
        handleServiceError(error)
      }
    }),

  getPublicEditais: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/public/editais',
        tags: ['editais'],
        summary: 'Get public editais',
        description: 'Retrieve all published editais',
      },
    })
    .input(z.void())
    .output(z.array(editalListItemSchema))
    .query(async ({ ctx }) => {
      try {
        const service = createEditalService(ctx.db)
        return await service.getPublicEditais()
      } catch (error) {
        handleServiceError(error)
      }
    }),

  generateEditalPdf: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/editais/{id}/pdf',
        tags: ['editais'],
        summary: 'Generate edital PDF',
        description: 'Generate PDF for edital interno using template',
      },
    })
    .input(z.object({ id: z.number() }))
    .output(z.object({ url: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createEditalService(ctx.db)
        return await service.generateEditalPdf(input.id, ctx.user.id)
      } catch (error) {
        handleServiceError(error)
      }
    }),

  getEditaisBySemestre: protectedProcedure
    .input(
      z.object({
        ano: z.number().int().min(2000).max(2100),
        semestre: semestreSchema,
        tipo: tipoEditalSchema.optional(),
        publicadoApenas: z.boolean().default(false),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const service = createEditalService(ctx.db)
        return await service.getEditaisBySemestre(input.ano, input.semestre, input.tipo, input.publicadoApenas)
      } catch (error) {
        handleServiceError(error)
      }
    }),

  getCurrentEditalForSemestre: protectedProcedure
    .input(
      z.object({
        ano: z.number().int().min(2000).max(2100),
        semestre: semestreSchema,
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const service = createEditalService(ctx.db)
        return await service.getCurrentEditalForSemestre(input.ano, input.semestre)
      } catch (error) {
        handleServiceError(error)
      }
    }),

  setAvailableExamDates: adminProtectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/editais/{id}/exam-dates',
        tags: ['editais'],
        summary: 'Set available exam dates',
        description: 'Admin defines available exam dates for internal DCC announcement',
      },
    })
    .input(
      z.object({
        id: z.number(),
        datasProvasDisponiveis: z.array(z.string()).min(1, 'Pelo menos uma data deve ser definida'),
        dataDivulgacaoResultado: z.date().optional(),
      })
    )
    .output(editalSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createEditalService(ctx.db)
        return await service.setAvailableExamDates(
          input.id,
          input.datasProvasDisponiveis,
          input.dataDivulgacaoResultado,
          ctx.user.id
        )
      } catch (error) {
        handleServiceError(error)
      }
    }),

  getAvailableExamDates: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/editais/{id}/exam-dates',
        tags: ['editais'],
        summary: 'Get available exam dates',
        description: 'Get available exam dates for internal DCC announcement',
      },
    })
    .input(z.object({ id: z.number() }))
    .output(
      z.object({
        datasProvasDisponiveis: z.array(z.string()).nullable(),
        dataDivulgacaoResultado: z.date().nullable(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const service = createEditalService(ctx.db)
        return await service.getAvailableExamDates(input.id)
      } catch (error) {
        handleServiceError(error)
      }
    }),

  requestChefeSignature: adminProtectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/editais/{id}/request-chefe-signature',
        tags: ['editais'],
        summary: 'Request chief signature',
        description: 'Request department chief to sign the edital via email link',
      },
    })
    .input(
      z.object({
        id: z.number(),
        chefeEmail: z.string().email(),
        chefeNome: z.string().optional(),
      })
    )
    .output(z.object({ success: z.boolean(), message: z.string(), expiresAt: z.date().optional() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createEditalService(ctx.db)
        return await service.requestChefeSignature({
          id: input.id,
          chefeEmail: input.chefeEmail,
          chefeNome: input.chefeNome,
          requestedByUserId: ctx.user.id,
        })
      } catch (error) {
        handleServiceError(error)
      }
    }),

  signAsChefe: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/editais/{id}/sign-as-chefe',
        tags: ['editais'],
        summary: 'Sign as chief',
        description: 'Sign the edital as department chief',
      },
    })
    .input(
      z.object({
        id: z.number(),
        assinatura: z.string(),
      })
    )
    .output(editalSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createEditalService(ctx.db)
        return await service.signAsChefe(input.id, input.assinatura, ctx.user.id)
      } catch (error) {
        handleServiceError(error)
      }
    }),

  getEditaisParaAssinar: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/editais/para-assinar',
        tags: ['editais'],
        summary: 'Get editais pending signature',
        description: 'Get list of editais pending chief signature',
      },
    })
    .input(z.void())
    .output(z.array(editalListItemSchema))
    .query(async ({ ctx }) => {
      try {
        const service = createEditalService(ctx.db)
        return await service.getEditaisParaAssinar()
      } catch (error) {
        handleServiceError(error)
      }
    }),

  // Public endpoints for token-based signature
  getEditalByToken: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/editais/by-token/{token}',
        tags: ['editais'],
        summary: 'Get edital by signature token',
        description: 'Get edital details using a signature token (public endpoint for chefe)',
      },
    })
    .input(z.object({ token: z.string() }))
    .output(
      z.object({
        token: z.object({
          id: z.number(),
          editalId: z.number(),
          chefeEmail: z.string(),
          chefeNome: z.string().nullable(),
          expiresAt: z.date(),
        }),
        edital: z.object({
          id: z.number(),
          numeroEdital: z.string(),
          titulo: z.string(),
          descricaoHtml: z.string().nullable(),
          periodoInscricao: z
            .object({
              ano: z.number(),
              semestre: semestreSchema,
              dataInicio: z.date(),
              dataFim: z.date(),
            })
            .nullable(),
        }),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const service = createEditalService(ctx.db)
        return await service.getEditalByToken(input.token)
      } catch (error) {
        handleServiceError(error)
      }
    }),

  signEditalByToken: publicProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/editais/sign-by-token',
        tags: ['editais'],
        summary: 'Sign edital using token',
        description: 'Sign edital as department chief using a signature token',
      },
    })
    .input(
      z.object({
        token: z.string(),
        assinatura: z.string().min(1, 'Assinatura é obrigatória'),
        chefeNome: z.string().min(1, 'Nome do chefe é obrigatório'),
      })
    )
    .output(z.object({ success: z.boolean(), message: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createEditalService(ctx.db)
        return await service.signEditalByToken(input.token, input.assinatura, input.chefeNome)
      } catch (error) {
        handleServiceError(error)
      }
    }),
})
