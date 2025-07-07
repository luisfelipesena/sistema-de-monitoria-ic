import { adminProtectedProcedure, createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { apiKeyTable } from '@/server/db/schema'
import {
  createApiKeySchema,
  deleteApiKeySchema,
  listApiKeysSchema,
  updateApiKeySchema,
} from '@/types'
import { TRPCError } from '@trpc/server'
import { createHash, randomBytes } from 'crypto'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export const apiKeyRouter = createTRPCRouter({
  // Criar nova API key (usuários podem criar suas próprias, admins podem criar para qualquer usuário)
  create: protectedProcedure
    .input(
      createApiKeySchema.extend({
        userId: z.number().int().positive().optional(), // Apenas admins podem especificar userId
      })
    )
    .mutation(async ({ ctx, input }) => {
      const targetUserId = input.userId || ctx.user.id

      // Apenas admins podem criar chaves para outros usuários
      if (input.userId && ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Apenas administradores podem criar chaves para outros usuários',
        })
      }

      // Gerar API key única
      const rawKey = randomBytes(32).toString('hex')
      const hashedKey = createHash('sha256').update(rawKey).digest('hex')

      // Verificar se a chave já existe (muito improvável, mas por segurança)
      const existingKey = await ctx.db.query.apiKeyTable.findFirst({
        where: eq(apiKeyTable.keyValue, hashedKey),
      })

      if (existingKey) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Erro interno ao gerar chave única. Tente novamente.' })
      }

      // Criar a API key no banco
      const [newApiKey] = await ctx.db
        .insert(apiKeyTable)
        .values({
          keyValue: hashedKey,
          name: input.name,
          description: input.description,
          userId: targetUserId,
          expiresAt: input.expiresAt,
        })
        .returning({
          id: apiKeyTable.id,
          name: apiKeyTable.name,
          description: apiKeyTable.description,
          createdAt: apiKeyTable.createdAt,
          expiresAt: apiKeyTable.expiresAt,
        })

      return {
        ...newApiKey,
        key: rawKey, // Retornar a chave raw apenas na criação
      }
    }),

  // Listar API keys do usuário (admins podem ver de todos)
  list: protectedProcedure.input(listApiKeysSchema).query(async ({ ctx, input }) => {
    let whereCondition

    if (input.userId) {
      // Apenas admins podem listar chaves de outros usuários
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Permissão negada' })
      }
      whereCondition = eq(apiKeyTable.userId, input.userId)
    } else {
      whereCondition = eq(apiKeyTable.userId, ctx.user.id)
    }

    const apiKeys = await ctx.db.query.apiKeyTable.findMany({
      where: whereCondition,
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

    return apiKeys
  }),

  // Atualizar API key
  update: protectedProcedure.input(updateApiKeySchema).mutation(async ({ ctx, input }) => {
    // Buscar a API key
    const apiKey = await ctx.db.query.apiKeyTable.findFirst({
      where: eq(apiKeyTable.id, input.id),
    })

    if (!apiKey) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'API key não encontrada' })
    }

    // Verificar permissões (apenas o dono ou admin pode atualizar)
    if (apiKey.userId !== ctx.user.id && ctx.user.role !== 'admin') {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Permissão negada' })
    }

    // Atualizar a API key
    const [updatedApiKey] = await ctx.db
      .update(apiKeyTable)
      .set({
        name: input.name,
        description: input.description,
        isActive: input.isActive,
      })
      .where(eq(apiKeyTable.id, input.id))
      .returning({
        id: apiKeyTable.id,
        name: apiKeyTable.name,
        description: apiKeyTable.description,
        isActive: apiKeyTable.isActive,
        updatedAt: apiKeyTable.updatedAt,
      })

    return updatedApiKey
  }),

  // Deletar API key
  delete: protectedProcedure.input(deleteApiKeySchema).mutation(async ({ ctx, input }) => {
    // Buscar a API key
    const apiKey = await ctx.db.query.apiKeyTable.findFirst({
      where: eq(apiKeyTable.id, input.id),
    })

    if (!apiKey) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'API key não encontrada' })
    }

    // Verificar permissões (apenas o dono ou admin pode deletar)
    if (apiKey.userId !== ctx.user.id && ctx.user.role !== 'admin') {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Permissão negada' })
    }

    // Deletar a API key
    await ctx.db.delete(apiKeyTable).where(eq(apiKeyTable.id, input.id))

    return { success: true }
  }),

  // Listar todas as API keys (apenas admins)
  listAll: adminProtectedProcedure.query(async ({ ctx }) => {
    const apiKeys = await ctx.db.query.apiKeyTable.findMany({
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

    return apiKeys
  }),
})
