import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import {
  acceptInscriptionSchema,
  anoSchema,
  candidateEvaluationSchema,
  candidateResultStatusSchema,
  idSchema,
  inscriptionDetailSchema,
  inscriptionFormSchema,
  rejectInscriptionSchema,
  semestreSchema,
  statusInscricaoSchema,
  tipoVagaSchema,
  type TipoVaga,
} from '@/types'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { createInscricaoService } from '@/server/services/inscricao/inscricao-service'
import { createInscricaoRepository } from '@/server/services/inscricao/inscricao-repository'
import { BusinessError } from '@/types/errors'

const transformError = (error: unknown): TRPCError => {
  if (error instanceof BusinessError) {
    const codeMap: Record<string, 'FORBIDDEN' | 'NOT_FOUND' | 'BAD_REQUEST' | 'CONFLICT' | 'INTERNAL_SERVER_ERROR'> = {
      FORBIDDEN: 'FORBIDDEN',
      NOT_FOUND: 'NOT_FOUND',
      BAD_REQUEST: 'BAD_REQUEST',
      CONFLICT: 'CONFLICT',
      VALIDATION_ERROR: 'BAD_REQUEST',
      UNAUTHORIZED: 'FORBIDDEN',
      INTERNAL_ERROR: 'INTERNAL_SERVER_ERROR',
    }
    return new TRPCError({ code: codeMap[error.code] || 'INTERNAL_SERVER_ERROR', message: error.message })
  }
  return new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: error instanceof Error ? error.message : 'Erro interno do servidor',
  })
}

export const inscricaoRouter = createTRPCRouter({
  getMyStatus: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/inscricao/my-status',
        tags: ['inscricao'],
        summary: 'Get student status',
        description: 'Get current student status in monitoring program',
      },
    })
    .input(z.void())
    .output(
      z.object({
        totalInscricoes: z.number(),
        totalAprovacoes: z.number(),
        monitoriaAtiva: z
          .object({
            id: idSchema,
            projeto: z.object({
              titulo: z.string(),
              disciplinas: z.array(
                z.object({
                  codigo: z.string(),
                  nome: z.string(),
                })
              ),
              professorResponsavelNome: z.string(),
            }),
            status: z.string(),
            tipo: tipoVagaSchema,
            dataInicio: z.date().nullable(),
            dataFim: z.date().nullable(),
            cargaHorariaCumprida: z.number().optional(),
            cargaHorariaPlanejada: z.number().optional(),
          })
          .nullable(),
        historicoAtividades: z
          .array(
            z.object({
              tipo: z.string(),
              descricao: z.string(),
              data: z.date(),
            })
          )
          .optional(),
        proximasAcoes: z
          .array(
            z.object({
              titulo: z.string(),
              descricao: z.string(),
              prazo: z.date().optional(),
            })
          )
          .optional(),
      })
    )
    .query(async ({ ctx }) => {
      try {
        const service = createInscricaoService(ctx.db)
        return await service.getMyStatus(ctx.user.id, ctx.user.role)
      } catch (error) {
        throw transformError(error)
      }
    }),

  createInscricao: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/inscricao/create',
        tags: ['inscricao'],
        summary: 'Create application',
        description: 'Create new application for monitoring project',
      },
    })
    .input(
      z.object({
        projetoId: idSchema,
        tipo: tipoVagaSchema,
        motivacao: z.string().min(10, 'Motivação deve ter pelo menos 10 caracteres'),
        documentos: z
          .array(
            z.object({
              fileId: z.string(),
              tipoDocumento: z.string(),
            })
          )
          .optional(),
      })
    )
    .output(z.object({ success: z.boolean(), inscricaoId: idSchema }))
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createInscricaoService(ctx.db)
        return await service.createInscricao(ctx.user.id, ctx.user.role, input)
      } catch (error) {
        throw transformError(error)
      }
    }),

  getMyResults: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/inscricao/my-results',
        tags: ['inscricao'],
        summary: 'Get student results',
        description: 'Get all application results for current student',
      },
    })
    .input(z.void())
    .output(
      z.array(
        z.object({
          id: idSchema,
          projeto: z.object({
            id: idSchema,
            titulo: z.string(),
            disciplinas: z.array(
              z.object({
                codigo: z.string(),
                nome: z.string(),
              })
            ),
            professorResponsavelNome: z.string(),
          }),
          tipoInscricao: tipoVagaSchema,
          status: candidateResultStatusSchema,
          dataResultado: z.date().optional(),
          posicaoLista: z.number().optional(),
          observacoes: z.string().optional(),
        })
      )
    )
    .query(
      async ({
        ctx,
      }): Promise<
        Array<{
          id: number
          projeto: {
            id: number
            titulo: string
            disciplinas: Array<{
              codigo: string
              nome: string
            }>
            professorResponsavelNome: string
          }
          tipoInscricao: TipoVaga
          status: 'APROVADO' | 'REPROVADO' | 'EM_ANALISE' | 'LISTA_ESPERA'
          dataResultado?: Date
          posicaoLista?: number
          observacoes?: string
        }>
      > => {
        try {
          const service = createInscricaoService(ctx.db)
          return await service.getMyResults(ctx.user.id, ctx.user.role)
        } catch (error) {
          throw transformError(error)
        }
      }
    ),

  getMinhasInscricoes: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/inscricoes/minhas',
        tags: ['inscricoes'],
        summary: 'Get my applications',
        description: 'Get all applications for the authenticated student',
      },
    })
    .input(z.void())
    .output(z.array(inscriptionDetailSchema))
    .query(async ({ ctx }) => {
      try {
        const service = createInscricaoService(ctx.db)
        return await service.getMinhasInscricoes(ctx.user.id)
      } catch (error) {
        throw transformError(error)
      }
    }),

  criarInscricao: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/inscricoes',
        tags: ['inscricoes'],
        summary: 'Create application',
        description: 'Create a new project application',
      },
    })
    .input(inscriptionFormSchema)
    .output(z.object({ id: idSchema, message: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createInscricaoService(ctx.db)
        return await service.criarInscricao(ctx.user.id, ctx.user.role, input)
      } catch (error) {
        throw transformError(error)
      }
    }),

  aceitarInscricao: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/inscricoes/aceitar',
        tags: ['inscricoes'],
        summary: 'Accept application',
        description: 'Student accepts a selected application',
      },
    })
    .input(acceptInscriptionSchema)
    .output(z.object({ success: z.boolean(), message: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createInscricaoService(ctx.db)
        return await service.aceitarInscricao(ctx.user.id, ctx.user.role, input.inscricaoId)
      } catch (error) {
        throw transformError(error)
      }
    }),

  recusarInscricao: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/inscricoes/recusar',
        tags: ['inscricoes'],
        summary: 'Reject application',
        description: 'Student rejects a selected application',
      },
    })
    .input(rejectInscriptionSchema)
    .output(z.object({ success: z.boolean(), message: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createInscricaoService(ctx.db)
        return await service.recusarInscricao(ctx.user.id, ctx.user.role, input.inscricaoId, input.feedbackProfessor)
      } catch (error) {
        throw transformError(error)
      }
    }),

  avaliarCandidato: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/inscricoes/avaliar',
        tags: ['inscricoes'],
        summary: 'Grade candidate',
        description: 'Professor grades a student application',
      },
    })
    .input(candidateEvaluationSchema)
    .output(z.object({ success: z.boolean(), notaFinal: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createInscricaoService(ctx.db)
        return await service.avaliarCandidato(ctx.user.id, ctx.user.role, input)
      } catch (error) {
        throw transformError(error)
      }
    }),

  getInscricoesProjeto: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/inscricoes/projeto',
        tags: ['inscricoes'],
        summary: 'Get project applications',
        description: 'Get all applications for a specific project (professor/admin only)',
      },
    })
    .input(z.object({ projetoId: idSchema }))
    .output(z.array(inscriptionDetailSchema))
    .query(async ({ input, ctx }) => {
      try {
        const service = createInscricaoService(ctx.db)
        return await service.getInscricoesProjeto(ctx.user.id, ctx.user.role, input.projetoId)
      } catch (error) {
        throw transformError(error)
      }
    }),

  evaluateApplications: protectedProcedure
    .input(
      z.object({
        inscricaoId: idSchema,
        notaDisciplina: z.number().min(0).max(10),
        notaSelecao: z.number().min(0).max(10),
        coeficienteRendimento: z.number().min(0).max(10),
        feedbackProfessor: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const service = createInscricaoService(ctx.db)
        return await service.evaluateApplications(ctx.user.id, ctx.user.role, input)
      } catch (error) {
        throw transformError(error)
      }
    }),

  acceptPosition: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/inscricoes/{inscricaoId}/accept',
        tags: ['inscricoes'],
        summary: 'Accept position',
        description: 'Accept offered position (scholarship or volunteer)',
      },
    })
    .input(z.object({ inscricaoId: idSchema }))
    .output(z.object({ success: z.boolean(), message: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createInscricaoService(ctx.db)
        return await service.acceptPosition(ctx.user.id, ctx.user.role, input.inscricaoId)
      } catch (error) {
        throw transformError(error)
      }
    }),

  rejectPosition: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/inscricoes/{inscricaoId}/reject',
        tags: ['inscricoes'],
        summary: 'Reject position',
        description: 'Reject offered position',
      },
    })
    .input(
      z.object({
        inscricaoId: idSchema,
        motivo: z.string().optional(),
      })
    )
    .output(z.object({ success: z.boolean(), message: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createInscricaoService(ctx.db)
        return await service.rejectPosition(ctx.user.id, ctx.user.role, input.inscricaoId, input.motivo)
      } catch (error) {
        throw transformError(error)
      }
    }),

  generateCommitmentTermData: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/inscricoes/{inscricaoId}/termo-compromisso-data',
        tags: ['inscricoes'],
        summary: 'Get commitment term data',
        description: 'Get data for generating commitment term PDF',
      },
    })
    .input(z.object({ inscricaoId: idSchema }))
    .output(
      z.object({
        monitor: z.object({
          nome: z.string(),
          matricula: z.string().nullable(),
          email: z.string(),
          telefone: z.string().optional(),
          cr: z.number().nullable(),
        }),
        professor: z.object({
          nome: z.string(),
          matriculaSiape: z.string().optional(),
          email: z.string().nullable(),
          departamento: z.string(),
        }),
        projeto: z.object({
          titulo: z.string(),
          disciplinas: z.array(
            z.object({
              codigo: z.string(),
              nome: z.string(),
            })
          ),
          ano: z.number(),
          semestre: z.string(),
          cargaHorariaSemana: z.number(),
          numeroSemanas: z.number(),
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
    )
    .query(
      async ({
        input,
        ctx,
      }): Promise<{
        monitor: {
          nome: string
          matricula: string | null
          email: string
          telefone?: string
          cr: number | null
        }
        professor: {
          nome: string
          matriculaSiape?: string
          email: string | null
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
      }> => {
        try {
          const service = createInscricaoService(ctx.db)
          return await service.generateCommitmentTermData(ctx.user.id, ctx.user.role, input.inscricaoId)
        } catch (error) {
          throw transformError(error)
        }
      }
    ),

  // ========================================
  // ADMIN ENDPOINTS
  // ========================================

  getAllForAdmin: protectedProcedure
    .input(
      z.object({
        ano: anoSchema.optional(),
        semestre: semestreSchema.optional(),
        status: statusInscricaoSchema.optional(),
        departamentoId: z.number().int().positive().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso restrito a administradores' })
      }

      const repo = createInscricaoRepository(ctx.db)
      return await repo.findAllForAdmin(input)
    }),
})
