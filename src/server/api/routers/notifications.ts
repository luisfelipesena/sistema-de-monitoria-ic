import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc"
import {
  notificationTable,
  professorTable,
  projetoTable,
} from "@/server/db/schema"
import { TipoNotificacao } from "@/types/enums"
import { and, desc, eq, inArray, sql } from "drizzle-orm"
import { z } from "zod"

export const notificationsRouter = createTRPCRouter({
  sendBulkNotification: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/notifications/bulk',
        tags: ['notifications'],
        summary: 'Send bulk notification',
        description: 'Send notifications to multiple users',
      },
    })
    .input(
      z.object({
        userIds: z.array(z.number()),
        tipo: z.nativeEnum(TipoNotificacao),
        titulo: z.string(),
        mensagem: z.string(),
        metadata: z.record(z.any()).optional(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        sentCount: z.number(),
        error: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const notifications = input.userIds.map((userId) => ({
          userId,
          tipo: input.tipo,
          titulo: input.titulo,
          mensagem: input.mensagem,
          metadata: input.metadata ? JSON.stringify(input.metadata) : null,
          lida: false,
        }))

        await ctx.db.insert(notificationTable).values(notifications)

        return {
          success: true,
          sentCount: notifications.length,
        }
      } catch (error) {
        console.error("Error sending bulk notification:", error)
        return {
          success: false,
          sentCount: 0,
          error: "Failed to send bulk notification",
        }
      }
    }),

  sendProjectSubmissionReminder: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/notifications/project-submission-reminder',
        tags: ['notifications'],
        summary: 'Send project submission reminder',
        description: 'Send reminder to professors who haven\'t submitted projects',
      },
    })
    .input(
      z.object({
        periodoId: z.number(),
        adminUserId: z.number(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        sentCount: z.number(),
        error: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Find professors who don't have projects for this period
        const allProfessors = await ctx.db
          .select({
            userId: professorTable.userId,
            professorId: professorTable.id,
            nomeCompleto: professorTable.nomeCompleto,
          })
          .from(professorTable)

        const professorsWithProjects = await ctx.db
          .select({
            professorId: projetoTable.professorResponsavelId,
          })
          .from(projetoTable)
          .where(eq(projetoTable.periodoInscricaoId, input.periodoId))

        const professorsWithProjectIds = new Set(
          professorsWithProjects.map((p) => p.professorId)
        )

        const professorsWithoutProjects = allProfessors.filter(
          (prof) => !professorsWithProjectIds.has(prof.professorId)
        )

        const notifications = professorsWithoutProjects.map((professor) => ({
          userId: professor.userId,
          tipo: TipoNotificacao.LEMBRETE_PROJETO,
          titulo: "Lembrete: Submissão de Projeto de Monitoria",
          mensagem: `Olá ${professor.nomeCompleto}, o prazo para submissão de projetos de monitoria está se aproximando. Por favor, acesse o sistema e submeta seu projeto.`,
          metadata: JSON.stringify({
            periodoId: input.periodoId,
            action: "submit_project",
          }),
          lida: false,
        }))

        if (notifications.length > 0) {
          await ctx.db.insert(notificationTable).values(notifications)
        }

        return {
          success: true,
          sentCount: notifications.length,
        }
      } catch (error) {
        console.error("Error sending project submission reminder:", error)
        return {
          success: false,
          sentCount: 0,
          error: "Failed to send project submission reminder",
        }
      }
    }),

  sendSelectionProcessReminder: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/notifications/selection-reminder',
        tags: ['notifications'],
        summary: 'Send selection process reminder',
        description: 'Send reminder to professors about pending selections',
      },
    })
    .input(
      z.object({
        professorIds: z.array(z.number()),
        adminUserId: z.number(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        sentCount: z.number(),
        error: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const professors = await ctx.db
          .select({
            userId: professorTable.userId,
            nomeCompleto: professorTable.nomeCompleto,
          })
          .from(professorTable)
          .where(inArray(professorTable.id, input.professorIds))

        const notifications = professors.map((professor) => ({
          userId: professor.userId,
          tipo: TipoNotificacao.LEMBRETE_SELECAO,
          titulo: "Lembrete: Processo de Seleção de Monitores",
          mensagem: `Olá ${professor.nomeCompleto}, você tem candidatos pendentes de avaliação para seus projetos de monitoria. Por favor, acesse o sistema e finalize o processo de seleção.`,
          metadata: JSON.stringify({
            action: "selection_process",
          }),
          lida: false,
        }))

        await ctx.db.insert(notificationTable).values(notifications)

        return {
          success: true,
          sentCount: notifications.length,
        }
      } catch (error) {
        console.error("Error sending selection process reminder:", error)
        return {
          success: false,
          sentCount: 0,
          error: "Failed to send selection process reminder",
        }
      }
    }),

  getUserNotifications: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/notifications/user/{userId}',
        tags: ['notifications'],
        summary: 'Get user notifications',
        description: 'Get all notifications for a specific user',
      },
    })
    .input(
      z.object({
        userId: z.number(),
        limit: z.number().default(50),
        offset: z.number().default(0),
        onlyUnread: z.boolean().default(false),
      })
    )
    .output(
      z.array(
        z.object({
          id: z.number(),
          tipo: z.nativeEnum(TipoNotificacao),
          titulo: z.string(),
          mensagem: z.string(),
          metadata: z.record(z.any()).nullable(),
          lida: z.boolean(),
          createdAt: z.date(),
        })
      )
    )
    .query(async ({ ctx, input }) => {
      const whereConditions = [eq(notificationTable.userId, input.userId)]

      if (input.onlyUnread) {
        whereConditions.push(eq(notificationTable.lida, false))
      }

      const notifications = await ctx.db
        .select({
          id: notificationTable.id,
          tipo: notificationTable.tipo,
          titulo: notificationTable.titulo,
          mensagem: notificationTable.mensagem,
          metadata: notificationTable.metadata,
          lida: notificationTable.lida,
          createdAt: notificationTable.createdAt,
        })
        .from(notificationTable)
        .where(and(...whereConditions))
        .orderBy(desc(notificationTable.createdAt))
        .limit(input.limit)
        .offset(input.offset)

      return notifications.map((notification) => ({
        ...notification,
        tipo: notification.tipo as TipoNotificacao,
        metadata: notification.metadata ? JSON.parse(notification.metadata) : null,
      }))
    }),

  markAsRead: protectedProcedure
    .meta({
      openapi: {
        method: 'PUT',
        path: '/notifications/{id}/read',
        tags: ['notifications'],
        summary: 'Mark notification as read',
        description: 'Mark a specific notification as read',
      },
    })
    .input(
      z.object({
        id: z.number(),
        userId: z.number(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        error: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.db
          .update(notificationTable)
          .set({ lida: true })
          .where(
            and(
              eq(notificationTable.id, input.id),
              eq(notificationTable.userId, input.userId)
            )
          )

        return { success: true }
      } catch (error) {
        console.error("Error marking notification as read:", error)
        return {
          success: false,
          error: "Failed to mark notification as read",
        }
      }
    }),

  markAllAsRead: protectedProcedure
    .meta({
      openapi: {
        method: 'PUT',
        path: '/notifications/user/{userId}/read-all',
        tags: ['notifications'],
        summary: 'Mark all notifications as read',
        description: 'Mark all notifications for a user as read',
      },
    })
    .input(
      z.object({
        userId: z.number(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        updatedCount: z.number(),
        error: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.db
          .update(notificationTable)
          .set({ lida: true })
          .where(
            and(
              eq(notificationTable.userId, input.userId),
              eq(notificationTable.lida, false)
            )
          )

        return {
          success: true,
          updatedCount: 0, // Row count not available in this context
        }
      } catch (error) {
        console.error("Error marking all notifications as read:", error)
        return {
          success: false,
          updatedCount: 0,
          error: "Failed to mark all notifications as read",
        }
      }
    }),

  getUnreadCount: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/notifications/user/{userId}/unread-count',
        tags: ['notifications'],
        summary: 'Get unread notification count',
        description: 'Get the count of unread notifications for a user',
      },
    })
    .input(
      z.object({
        userId: z.number(),
      })
    )
    .output(
      z.object({
        count: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(notificationTable)
        .where(
          and(
            eq(notificationTable.userId, input.userId),
            eq(notificationTable.lida, false)
          )
        )

      return {
        count: result[0]?.count || 0,
      }
    }),
})