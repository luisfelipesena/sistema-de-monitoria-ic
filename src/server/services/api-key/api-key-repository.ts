import type { db } from '@/server/db'
import { apiKeyTable } from '@/server/db/schema'
import { eq } from 'drizzle-orm'

type Database = typeof db

export interface CreateApiKeyData {
  keyValue: string
  name: string
  description?: string | null
  userId: number
  expiresAt?: Date | null
}

export interface UpdateApiKeyData {
  name?: string
  description?: string | null
  isActive?: boolean
}

export const createApiKeyRepository = (database: Database) => {
  return {
    async findById(id: number) {
      return database.query.apiKeyTable.findFirst({
        where: eq(apiKeyTable.id, id),
      })
    },

    async findByKeyValue(keyValue: string) {
      return database.query.apiKeyTable.findFirst({
        where: eq(apiKeyTable.keyValue, keyValue),
      })
    },

    async findByUserId(userId: number) {
      return database.query.apiKeyTable.findMany({
        where: eq(apiKeyTable.userId, userId),
        columns: {
          id: true,
          name: true,
          description: true,
          isActive: true,
          expiresAt: true,
          lastUsedAt: true,
          createdAt: true,
          updatedAt: true,
        },
        with: {
          user: {
            columns: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      })
    },

    async findAll() {
      return database.query.apiKeyTable.findMany({
        columns: {
          id: true,
          name: true,
          description: true,
          isActive: true,
          expiresAt: true,
          lastUsedAt: true,
          createdAt: true,
          updatedAt: true,
        },
        with: {
          user: {
            columns: {
              id: true,
              username: true,
              email: true,
              role: true,
            },
          },
        },
      })
    },

    async create(data: CreateApiKeyData) {
      const [newApiKey] = await database
        .insert(apiKeyTable)
        .values({
          keyValue: data.keyValue,
          name: data.name,
          description: data.description,
          userId: data.userId,
          expiresAt: data.expiresAt,
        })
        .returning({
          id: apiKeyTable.id,
          name: apiKeyTable.name,
          description: apiKeyTable.description,
          createdAt: apiKeyTable.createdAt,
          expiresAt: apiKeyTable.expiresAt,
        })

      return newApiKey
    },

    async update(id: number, data: UpdateApiKeyData) {
      const [updatedApiKey] = await database.update(apiKeyTable).set(data).where(eq(apiKeyTable.id, id)).returning({
        id: apiKeyTable.id,
        name: apiKeyTable.name,
        description: apiKeyTable.description,
        isActive: apiKeyTable.isActive,
        updatedAt: apiKeyTable.updatedAt,
      })

      return updatedApiKey
    },

    async delete(id: number) {
      await database.delete(apiKeyTable).where(eq(apiKeyTable.id, id))
    },
  }
}
