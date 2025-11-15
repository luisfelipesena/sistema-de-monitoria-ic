import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { notificationTypeSchema, notificationPrioritySchema, statsPeriodSchema } from '@/types'
import { createNotificacoesService } from '@/server/services/notificacoes/notificacoes-service'
import { z } from 'zod'

export const notificacoesRouter = createTRPCRouter({
  sendReminders: protectedProcedure
    .input(
      z.object({
        tipo: notificationTypeSchema,
        filtros: z
          .object({
            dias: z.number().min(1).max(30).default(7),
            departamentoId: z.string().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const service = createNotificacoesService(ctx.db)
      return service.sendReminders(input, ctx.user.id, ctx.user.role)
    }),

  getHistory: protectedProcedure
    .input(
      z.object({
        limite: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        userId: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const service = createNotificacoesService(ctx.db)
      const userId = input.userId ? parseInt(input.userId) : undefined
      return service.getHistory(input.limite, input.offset, userId, ctx.user.role)
    }),

  markAsRead: protectedProcedure
    .input(
      z.object({
        notificacaoId: z.string(),
      })
    )
    .mutation(async () => {
      return { success: true }
    }),

  markAllAsRead: protectedProcedure.mutation(async () => {
    return {
      success: true,
      message: 'Todas as notificações foram marcadas como lidas',
    }
  }),

  getUnread: protectedProcedure.query(async () => {
    return []
  }),

  create: protectedProcedure
    .input(
      z.object({
        tipo: notificationPrioritySchema,
        titulo: z.string().min(1).max(200),
        conteudo: z.string().min(1).max(1000),
        destinatarioIds: z.array(z.string()).min(1),
        enviarEmail: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const service = createNotificacoesService(ctx.db)
      return service.createNotification(input, ctx.user.id, ctx.user.role, ctx.user.username)
    }),

  getStats: protectedProcedure
    .input(
      z.object({
        periodo: statsPeriodSchema.default('30d'),
      })
    )
    .query(async ({ input, ctx }) => {
      const service = createNotificacoesService(ctx.db)
      return service.getStats(input.periodo, ctx.user.role)
    }),
})
