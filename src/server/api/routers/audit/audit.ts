import { createTRPCRouter, adminProtectedProcedure } from '@/server/api/trpc'
import { createAuditService } from '@/server/services/audit/audit-service'
import { auditActionSchema, auditEntitySchema } from '@/types'
import { z } from 'zod'

export const auditRouter = createTRPCRouter({
  list: adminProtectedProcedure
    .input(
      z.object({
        entityType: auditEntitySchema.optional(),
        entityId: z.number().optional(),
        userId: z.number().optional(),
        action: auditActionSchema.optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const service = createAuditService(ctx.db)
      return service.list(input)
    }),

  getByEntity: adminProtectedProcedure
    .input(
      z.object({
        entityType: auditEntitySchema,
        entityId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const service = createAuditService(ctx.db)
      return service.getByEntity(input.entityType, input.entityId)
    }),

  getByUser: adminProtectedProcedure
    .input(
      z.object({
        userId: z.number(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const service = createAuditService(ctx.db)
      return service.getByUser(input.userId, input.limit)
    }),

  getStats: adminProtectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const service = createAuditService(ctx.db)

      const [logins, notifications, approvals, rejects, submissions] = await Promise.all([
        service.countByAction('LOGIN', input.startDate, input.endDate),
        service.countByAction('SEND_NOTIFICATION', input.startDate, input.endDate),
        service.countByAction('APPROVE', input.startDate, input.endDate),
        service.countByAction('REJECT', input.startDate, input.endDate),
        service.countByAction('SUBMIT', input.startDate, input.endDate),
      ])

      return {
        logins,
        notifications,
        approvals,
        rejects,
        submissions,
      }
    }),
})
