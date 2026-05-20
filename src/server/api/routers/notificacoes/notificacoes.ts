import { adminProtectedProcedure, createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { createNotificacoesService } from '@/server/services/notificacoes/notificacoes-service'
import { createProactiveReminderService } from '@/server/services/notificacoes/proactive-reminder-service'
import { createReminderService } from '@/server/services/notificacoes/reminder-service'
import { notificationPrioritySchema, notificationTypeSchema, semestreSchema, statsPeriodSchema } from '@/types'
import { z } from 'zod'

export const notificacoesRouter = createTRPCRouter({
  // ============================================
  // PROACTIVE REMINDERS (automatic on page load)
  // ============================================

  /**
   * Check and execute all pending proactive reminders.
   * Called automatically when admin accesses dashboard or notifications page.
   */
  executeProactiveReminders: adminProtectedProcedure.mutation(async ({ ctx }) => {
    const service = createProactiveReminderService(ctx.db)
    return service.executeAllPendingReminders(ctx.user.id)
  }),

  /**
   * Get status of all reminder types (whether they need execution).
   * Used to show admin what reminders are pending.
   */
  getProactiveReminderStatus: adminProtectedProcedure.query(async ({ ctx }) => {
    const service = createProactiveReminderService(ctx.db)
    return service.getReminderStatus()
  }),

  /**
   * Get execution history of reminders.
   */
  getReminderExecutionHistory: adminProtectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(50) }).optional())
    .query(async ({ ctx, input }) => {
      const service = createProactiveReminderService(ctx.db)
      return service.getExecutionHistory(input?.limit ?? 50)
    }),

  // ============================================
  // MANUAL REMINDERS
  // ============================================

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

  /**
   * Send certificate availability notifications for a specific period.
   * Admin only - used after semester ends.
   */
  sendCertificateNotifications: adminProtectedProcedure
    .input(
      z.object({
        ano: z.number().min(2020).max(2100),
        semestre: semestreSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      const reminderService = createReminderService(ctx.db)
      const count = await reminderService.sendCertificateAvailableNotifications(input.ano, input.semestre, ctx.user.id)
      return {
        success: true,
        notificacoesEnviadas: count,
        tipo: 'certificado_disponivel',
      }
    }),

  /**
   * Get available reminder types with descriptions.
   */
  getReminderTypes: protectedProcedure.query(() => {
    return [
      {
        tipo: 'assinatura_projeto_pendente',
        descricao: 'Projetos aguardando assinatura do admin',
        diasDefault: 7,
      },
      {
        tipo: 'assinatura_termo_pendente',
        descricao: 'Termos de compromisso pendentes de assinatura',
        diasDefault: 7,
      },
      {
        tipo: 'aceite_vaga_pendente',
        descricao: 'Alunos selecionados que não confirmaram o aceite',
        diasDefault: 3,
      },
      {
        tipo: 'periodo_inscricao_proximo_fim',
        descricao: 'Aviso sobre fim do período de inscrições',
        diasDefault: 3,
      },
      {
        tipo: 'relatorio_final_pendente',
        descricao: 'Relatórios finais de projeto pendentes',
        diasDefault: 14,
      },
      {
        tipo: 'relatorio_monitor_pendente',
        descricao: 'Relatórios individuais de monitores pendentes',
        diasDefault: 14,
      },
    ]
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
