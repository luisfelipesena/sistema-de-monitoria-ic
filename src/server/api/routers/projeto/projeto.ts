import { adminProtectedProcedure, createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { createProjetoService } from '@/server/services/projeto/projeto-service'
import { NotFoundError, ValidationError, ForbiddenError, BusinessError } from '@/types/errors'
import {
  anoSchema,
  idSchema,
  nameSchema,
  projectDetailSchema,
  projectFormSchema,
  projectListItemSchema,
  projetoStatusSchema,
  semestreSchema,
  voluntarioStatusSchema,
} from '@/types'
import { logger } from '@/utils/logger'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

const log = logger.child({ context: 'ProjetoRouter' })

function handleServiceError(error: unknown, defaultMessage: string): never {
  if (error instanceof NotFoundError) {
    throw new TRPCError({ code: 'NOT_FOUND', message: error.message })
  }
  if (error instanceof ValidationError) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: error.message })
  }
  if (error instanceof ForbiddenError) {
    throw new TRPCError({ code: 'FORBIDDEN', message: error.message })
  }
  if (error instanceof BusinessError) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: error.message })
  }
  if (error instanceof TRPCError) {
    throw error
  }
  log.error(error, defaultMessage)
  throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: defaultMessage })
}

export const projetoRouter = createTRPCRouter({
  getProjetos: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/projetos',
        tags: ['projetos'],
        summary: 'Get projetos',
        description: 'Retrieve projetos based on user role',
      },
    })
    .input(z.void())
    .output(z.array(projectListItemSchema))
    .query(async ({ ctx }) => {
      try {
        const service = createProjetoService(ctx.db)
        // Pass adminType so DCC/DCI admins only see their department's projects
        return await service.getProjetos(ctx.user.id, ctx.user.role, ctx.user.adminType)
      } catch (error) {
        return handleServiceError(error, 'Erro ao recuperar projetos')
      }
    }),

  getProjetosFiltered: adminProtectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/projetos/filtered',
        tags: ['projetos'],
        summary: 'Get projetos with filters',
        description: 'Retrieve projetos with server-side filtering and pagination (admin only)',
      },
    })
    .input(
      z.object({
        ano: z.array(z.number()).optional(),
        semestre: z.array(semestreSchema).optional(),
        status: z.array(projetoStatusSchema).optional(),
        disciplina: z.string().optional(),
        professorNome: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .output(
      z.object({
        projetos: z.array(
          projectListItemSchema.extend({
            editalNumero: z.string().nullable(),
            editalPublicado: z.boolean(),
          })
        ),
        total: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const service = createProjetoService(ctx.db)
        return await service.getProjetosFiltered(
          {
            ano: input.ano,
            semestre: input.semestre,
            status: input.status,
            disciplina: input.disciplina,
            professorNome: input.professorNome,
            limit: input.limit,
            offset: input.offset,
          },
          ctx.user.adminType
        )
      } catch (error) {
        return handleServiceError(error, 'Erro ao recuperar projetos filtrados')
      }
    }),

  getProjeto: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/projetos/{id}',
        tags: ['projetos'],
        summary: 'Get projeto',
        description: 'Retrieve a specific projeto with full details',
      },
    })
    .input(z.object({ id: idSchema }))
    .output(projectDetailSchema)
    .query(async ({ input, ctx }) => {
      try {
        const service = createProjetoService(ctx.db)
        return await service.getProjeto(input.id, ctx.user.id, ctx.user.role)
      } catch (error) {
        return handleServiceError(error, 'Erro ao recuperar projeto')
      }
    }),

  createProjeto: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/projetos',
        tags: ['projetos'],
        summary: 'Create projeto',
        description: 'Create a new projeto',
      },
    })
    .input(projectFormSchema)
    .output(projectDetailSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createProjetoService(ctx.db)
        return await service.createProjeto({
          userId: ctx.user.id,
          userRole: ctx.user.role,
          ...input,
        })
      } catch (error) {
        return handleServiceError(error, 'Erro ao criar projeto')
      }
    }),

  updateProjeto: protectedProcedure
    .meta({
      openapi: {
        method: 'PUT',
        path: '/projetos/{id}',
        tags: ['projetos'],
        summary: 'Update projeto',
        description: 'Update an existing projeto',
      },
    })
    .input(z.object({ id: idSchema }).merge(projectFormSchema.partial()))
    .output(projectDetailSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createProjetoService(ctx.db)
        return await service.updateProjeto({
          ...input,
          userId: ctx.user.id,
          userRole: ctx.user.role,
        })
      } catch (error) {
        return handleServiceError(error, 'Erro ao atualizar projeto')
      }
    }),

  deleteProjeto: protectedProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/projetos/{id}',
        tags: ['projetos'],
        summary: 'Delete projeto',
        description: 'Soft delete a projeto',
      },
    })
    .input(z.object({ id: idSchema }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createProjetoService(ctx.db)
        await service.deleteProjeto(input.id, ctx.user.id, ctx.user.role)
        return { success: true }
      } catch (error) {
        return handleServiceError(error, 'Erro ao deletar projeto')
      }
    }),

  submitProjeto: protectedProcedure
    .meta({
      openapi: {
        method: 'PATCH',
        path: '/projetos/{id}/submit',
        tags: ['projetos'],
        summary: 'Submit projeto',
        description: 'Submit projeto for admin approval',
      },
    })
    .input(z.object({ id: idSchema }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createProjetoService(ctx.db)
        await service.submitProjeto(input.id, ctx.user.id, ctx.user.role)
        return { success: true }
      } catch (error) {
        return handleServiceError(error, 'Erro ao submeter projeto')
      }
    }),

  approveProjeto: adminProtectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/projetos/{id}/approve',
        tags: ['projetos'],
        summary: 'Approve projeto',
        description: 'Approve projeto and optionally set scholarship allocations',
      },
    })
    .input(
      z.object({
        id: idSchema,
        bolsasDisponibilizadas: z.number().min(0).optional(),
        feedbackAdmin: z.string().optional(),
      })
    )
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createProjetoService(ctx.db)
        await service.approveProjeto(input.id, input.bolsasDisponibilizadas, input.feedbackAdmin)
        return { success: true }
      } catch (error) {
        return handleServiceError(error, 'Erro ao aprovar projeto')
      }
    }),

  rejectProjeto: adminProtectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/projetos/{id}/reject',
        tags: ['projetos'],
        summary: 'Reject projeto',
        description: 'Reject projeto with feedback',
      },
    })
    .input(
      z.object({
        id: idSchema,
        feedbackAdmin: z.string().min(1, 'Feedback é obrigatório para rejeição'),
      })
    )
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createProjetoService(ctx.db)
        await service.rejectProjeto(input.id, input.feedbackAdmin)
        return { success: true }
      } catch (error) {
        return handleServiceError(error, 'Erro ao rejeitar projeto')
      }
    }),

  requestRevision: adminProtectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/projetos/{id}/request-revision',
        tags: ['projetos'],
        summary: 'Request revision',
        description: 'Request revision from professor with a message',
      },
    })
    .input(
      z.object({
        id: idSchema,
        mensagem: z.string().min(10, 'Mensagem deve ter pelo menos 10 caracteres').max(2000),
      })
    )
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createProjetoService(ctx.db)
        await service.requestRevision(input.id, input.mensagem, ctx.user.id)
        return { success: true }
      } catch (error) {
        return handleServiceError(error, 'Erro ao solicitar revisão')
      }
    }),

  signProfessor: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/projetos/{projetoId}/sign-professor',
        tags: ['projetos'],
        summary: 'Sign project as professor',
        description: 'Add professor signature to project',
      },
    })
    .input(
      z.object({
        projetoId: idSchema,
        signatureImage: z.string().min(1, 'Assinatura é obrigatória'),
      })
    )
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createProjetoService(ctx.db)
        await service.signProfessor(input.projetoId, input.signatureImage, ctx.user.id, ctx.user.role)
        return { success: true }
      } catch (error) {
        return handleServiceError(error, 'Erro ao adicionar assinatura')
      }
    }),

  signDocument: protectedProcedure
    .input(
      z.object({
        projetoId: idSchema,
        signatureData: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createProjetoService(ctx.db)
        await service.signProfessor(input.projetoId, input.signatureData, ctx.user.id, ctx.user.role)
        return { success: true }
      } catch (error) {
        return handleServiceError(error, 'Erro ao assinar documento')
      }
    }),

  getAvailableProjects: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/projetos/available',
        tags: ['projetos'],
        summary: 'Get available projects',
        description: 'Get projects available for student applications',
      },
    })
    .input(z.void())
    .output(
      z.array(
        z.object({
          id: idSchema,
          titulo: nameSchema,
          descricao: z.string(),
          departamentoNome: nameSchema,
          professorResponsavelNome: nameSchema,
          ano: z.number(),
          semestre: semestreSchema,
          cargaHorariaSemana: z.number(),
          publicoAlvo: z.string(),
          disciplinas: z.array(
            z.object({
              codigo: z.string(),
              nome: nameSchema,
            })
          ),
          bolsasDisponibilizadas: z.number(),
          voluntariosSolicitados: z.number(),
          totalInscritos: z.number(),
          inscricaoAberta: z.boolean(),
          jaInscrito: z.boolean(),
        })
      )
    )
    .query(async ({ ctx }) => {
      try {
        const service = createProjetoService(ctx.db)
        return await service.getAvailableProjects(ctx.user.id, ctx.user.role)
      } catch (error) {
        return handleServiceError(error, 'Erro ao recuperar projetos disponíveis')
      }
    }),

  getVolunteers: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/projetos/volunteers',
        tags: ['projetos'],
        summary: 'Get volunteers',
        description: 'Get volunteers for professor projects',
      },
    })
    .input(z.void())
    .output(
      z.array(
        z.object({
          id: idSchema,
          nomeCompleto: nameSchema,
          email: z.string(),
          telefone: z.string().optional(),
          disciplina: z.object({
            codigo: z.string(),
            nome: nameSchema,
          }),
          projeto: z.object({
            id: idSchema,
            titulo: nameSchema,
          }),
          status: voluntarioStatusSchema,
          dataInicio: z.date().optional(),
        })
      )
    )
    .query(async ({ ctx }) => {
      try {
        const service = createProjetoService(ctx.db)
        return await service.getVolunteers(ctx.user.id, ctx.user.role)
      } catch (error) {
        return handleServiceError(error, 'Erro ao recuperar voluntários')
      }
    }),

  updateVolunteerStatus: protectedProcedure
    .meta({
      openapi: {
        method: 'PATCH',
        path: '/projetos/volunteers/status',
        tags: ['projetos'],
        summary: 'Update volunteer status',
        description: 'Update volunteer status',
      },
    })
    .input(
      z.object({
        id: idSchema,
        status: voluntarioStatusSchema.extract(['ATIVO', 'INATIVO']),
      })
    )
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createProjetoService(ctx.db)
        await service.updateVolunteerStatus(input.id, input.status, ctx.user.id, ctx.user.role)
        return { success: true }
      } catch (error) {
        return handleServiceError(error, 'Erro ao atualizar status do voluntário')
      }
    }),

  generateSelectionMinutesData: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/projetos/{projetoId}/ata-selecao-data',
        tags: ['projetos'],
        summary: 'Get selection minutes data',
        description: 'Get data for generating selection minutes PDF',
      },
    })
    .input(z.object({ projetoId: idSchema }))
    .output(
      z.object({
        projeto: z.object({
          id: idSchema,
          titulo: nameSchema,
          ano: anoSchema,
          semestre: z.string(),
          departamento: z.object({
            nome: nameSchema,
            sigla: z.string().nullable(),
          }),
          professorResponsavel: z.object({
            nomeCompleto: nameSchema,
            matriculaSiape: z.string().nullable(),
          }),
          disciplinas: z.array(
            z.object({
              codigo: z.string(),
              nome: nameSchema,
            })
          ),
        }),
        candidatos: z.array(
          z.object({
            id: idSchema,
            aluno: z.object({
              nomeCompleto: nameSchema,
              matricula: z.string().nullable(),
              cr: z.number().nullable(),
            }),
            tipoVagaPretendida: z.string().nullable(),
            notaDisciplina: z.number().nullable(),
            notaSelecao: z.number().nullable(),
            coeficienteRendimento: z.number().nullable(),
            notaFinal: z.number().nullable(),
            status: z.string(),
            observacoes: z.string().nullable(),
          })
        ),
        ataInfo: z.object({
          dataSelecao: z.string(),
          localSelecao: z.string().nullable(),
          observacoes: z.string().nullable(),
        }),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const service = createProjetoService(ctx.db)
        return await service.generateSelectionMinutesData(input.projetoId, ctx.user.id, ctx.user.role)
      } catch (error) {
        return handleServiceError(error, 'Erro ao buscar dados da ata de seleção')
      }
    }),

  saveSelectionMinutes: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/projetos/{projetoId}/ata-selecao',
        tags: ['projetos'],
        summary: 'Save selection minutes',
        description: 'Save selection minutes to database and MinIO',
      },
    })
    .input(
      z.object({
        projetoId: idSchema,
        dataSelecao: z.string().optional(),
        localSelecao: z.string().optional(),
        observacoes: z.string().optional(),
      })
    )
    .output(z.object({ success: z.boolean(), ataId: idSchema }))
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createProjetoService(ctx.db)
        const ataId = await service.saveSelectionMinutes(input.projetoId, ctx.user.id, ctx.user.role)
        return { success: true, ataId }
      } catch (error) {
        return handleServiceError(error, 'Erro ao salvar ata de seleção')
      }
    }),

  notifySelectionResults: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/projetos/{projetoId}/notify-results',
        tags: ['projetos'],
        summary: 'Notify selection results',
        description: 'Send email notifications to candidates about selection results',
      },
    })
    .input(
      z.object({
        projetoId: idSchema,
        mensagemPersonalizada: z.string().optional(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        notificationsCount: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createProjetoService(ctx.db)
        const notificationsCount = await service.notifySelectionResults(
          input.projetoId,
          input.mensagemPersonalizada,
          ctx.user.id,
          ctx.user.role
        )
        return { success: true, notificationsCount }
      } catch (error) {
        return handleServiceError(error, 'Erro ao notificar resultados')
      }
    }),
})
