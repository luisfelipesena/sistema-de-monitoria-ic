import type { db } from '@/server/db'
import { auditLogTable } from '@/server/db/schema'
import type { AuditAction, AuditEntity, AuditLogInput, AuditLogListInput } from '@/types'
import { and, count, desc, eq, gte, lte } from 'drizzle-orm'

type Database = typeof db

export function createAuditRepository(database: Database) {
  return {
    async insert(input: AuditLogInput) {
      const [log] = await database
        .insert(auditLogTable)
        .values({
          userId: input.userId,
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId,
          details: input.details ? JSON.stringify(input.details) : null,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
        })
        .returning()
      return log
    },

    async findByEntity(entityType: AuditEntity, entityId: number) {
      return database.query.auditLogTable.findMany({
        where: and(eq(auditLogTable.entityType, entityType), eq(auditLogTable.entityId, entityId)),
        with: {
          user: {
            columns: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
        orderBy: desc(auditLogTable.timestamp),
      })
    },

    async findByUser(userId: number, limit = 50) {
      return database.query.auditLogTable.findMany({
        where: eq(auditLogTable.userId, userId),
        orderBy: desc(auditLogTable.timestamp),
        limit,
      })
    },

    async list(input: AuditLogListInput) {
      const conditions = []

      if (input.entityType) {
        conditions.push(eq(auditLogTable.entityType, input.entityType))
      }
      if (input.entityId) {
        conditions.push(eq(auditLogTable.entityId, input.entityId))
      }
      if (input.userId) {
        conditions.push(eq(auditLogTable.userId, input.userId))
      }
      if (input.action) {
        conditions.push(eq(auditLogTable.action, input.action))
      }
      if (input.startDate) {
        conditions.push(gte(auditLogTable.timestamp, input.startDate))
      }
      if (input.endDate) {
        conditions.push(lte(auditLogTable.timestamp, input.endDate))
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      const [data, totalResult] = await Promise.all([
        database.query.auditLogTable.findMany({
          where: whereClause,
          with: {
            user: {
              columns: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
          orderBy: desc(auditLogTable.timestamp),
          limit: input.limit ?? 50,
          offset: input.offset ?? 0,
        }),
        database.select({ count: count() }).from(auditLogTable).where(whereClause),
      ])

      const total = totalResult[0]?.count ?? 0
      const limit = input.limit ?? 50
      const offset = input.offset ?? 0

      return {
        data,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + data.length < total,
        },
      }
    },

    async countByAction(action: AuditAction, startDate?: Date, endDate?: Date) {
      const conditions = [eq(auditLogTable.action, action)]
      if (startDate) conditions.push(gte(auditLogTable.timestamp, startDate))
      if (endDate) conditions.push(lte(auditLogTable.timestamp, endDate))

      const result = await database
        .select({ count: count() })
        .from(auditLogTable)
        .where(and(...conditions))

      return result[0]?.count ?? 0
    },
  }
}

export type AuditRepository = ReturnType<typeof createAuditRepository>
