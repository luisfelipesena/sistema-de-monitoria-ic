import { adminProtectedProcedure, protectedProcedure } from '@/server/api/trpc'
import { professorTable, projetoTable } from '@/server/db/schema'
import { idSchema } from '@/types'
import { logger } from '@/utils/logger'
import { TRPCError } from '@trpc/server'
import { and, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'

const log = logger.child({ context: 'ProjetoRouter.Workflow' })

export const submitProjetoHandler = protectedProcedure
  .meta({
    openapi: {
      method: 'PATCH',
      path: '/projetos/{id}/submit',
      tags: ['projetos'],
      summary: 'Submit projeto',
      description: 'Submit projeto for admin approval',
    },
  })
  .input(
    z.object({
      id: idSchema,
    })
  )
  .output(z.object({ success: z.boolean() }))
  .mutation(async ({ input, ctx }) => {
    const projeto = await ctx.db.query.projetoTable.findFirst({
      where: and(eq(projetoTable.id, input.id), isNull(projetoTable.deletedAt)),
    })

    if (!projeto) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Projeto não encontrado',
      })
    }

    if (ctx.user.role === 'professor') {
      const professor = await ctx.db.query.professorTable.findFirst({
        where: eq(professorTable.userId, ctx.user.id),
      })

      if (!professor || projeto.professorResponsavelId !== professor.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Acesso negado a este projeto',
        })
      }
    }

    if (projeto.status !== 'DRAFT' && projeto.status !== 'PENDING_PROFESSOR_SIGNATURE') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Projeto não pode ser submetido neste status',
      })
    }

    await ctx.db
      .update(projetoTable)
      .set({
        status: 'SUBMITTED',
        updatedAt: new Date(),
      })
      .where(eq(projetoTable.id, input.id))

    log.info({ projetoId: input.id }, 'Projeto submetido para aprovação')
    return { success: true }
  })

export const approveProjetoHandler = adminProtectedProcedure
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
    const projeto = await ctx.db.query.projetoTable.findFirst({
      where: and(eq(projetoTable.id, input.id), isNull(projetoTable.deletedAt)),
    })

    if (!projeto) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Projeto não encontrado',
      })
    }

    if (projeto.status !== 'SUBMITTED') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Projeto não está aguardando aprovação',
      })
    }

    // Admin aprova diretamente (professor já assinou)
    await ctx.db
      .update(projetoTable)
      .set({
        status: 'APPROVED',
        bolsasDisponibilizadas: input.bolsasDisponibilizadas,
        feedbackAdmin: input.feedbackAdmin,
        updatedAt: new Date(),
      })
      .where(eq(projetoTable.id, input.id))

    log.info({ projetoId: input.id }, 'Projeto aprovado pelo admin')

    return { success: true }
  })

export const rejectProjetoHandler = adminProtectedProcedure
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
    const projeto = await ctx.db.query.projetoTable.findFirst({
      where: and(eq(projetoTable.id, input.id), isNull(projetoTable.deletedAt)),
    })

    if (!projeto) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Projeto não encontrado',
      })
    }

    if (projeto.status !== 'SUBMITTED') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Projeto não está aguardando aprovação',
      })
    }

    await ctx.db
      .update(projetoTable)
      .set({
        status: 'REJECTED',
        feedbackAdmin: input.feedbackAdmin,
        updatedAt: new Date(),
      })
      .where(eq(projetoTable.id, input.id))

    log.info({ projetoId: input.id }, 'Projeto rejeitado')
    return { success: true }
  })
