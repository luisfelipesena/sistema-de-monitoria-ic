import { db } from '@/server/db'
import { ConflictError, ForbiddenError, NotFoundError } from '@/server/lib/errors'
import type { CreateApiKeyData, DeleteApiKeyData, ListApiKeysData, UpdateApiKeyData } from '@/types'
import { ADMIN } from '@/types'
import { createHash, randomBytes } from 'crypto'
import { createApiKeyRepository } from './api-key-repository'

export const createApiKeyService = (database: typeof db) => {
  const apiKeyRepository = createApiKeyRepository(database)

  return {
    async create(input: CreateApiKeyData & { userId?: number }, currentUserId: number, currentUserRole: string) {
      const targetUserId = input.userId || currentUserId

      if (input.userId && currentUserRole !== ADMIN) {
        throw new ForbiddenError('Apenas administradores podem criar chaves para outros usuários')
      }

      const rawKey = randomBytes(32).toString('hex')
      const hashedKey = createHash('sha256').update(rawKey).digest('hex')

      const existingKey = await apiKeyRepository.findByKeyValue(hashedKey)

      if (existingKey) {
        throw new ConflictError('Erro interno ao gerar chave única. Tente novamente.')
      }

      const newApiKey = await apiKeyRepository.create({
        keyValue: hashedKey,
        name: input.name,
        description: input.description,
        userId: targetUserId,
        expiresAt: input.expiresAt,
      })

      return {
        ...newApiKey,
        key: rawKey,
      }
    },

    async list(input: ListApiKeysData, currentUserId: number, currentUserRole: string) {
      const targetUserId = input.userId || currentUserId

      if (input.userId && currentUserRole !== ADMIN) {
        throw new ForbiddenError('Permissão negada')
      }

      return await apiKeyRepository.findByUserId(targetUserId)
    },

    async update(input: UpdateApiKeyData, currentUserId: number, currentUserRole: string) {
      const apiKey = await apiKeyRepository.findById(input.id)

      if (!apiKey) {
        throw new NotFoundError('API key', input.id)
      }

      if (apiKey.userId !== currentUserId && currentUserRole !== 'admin') {
        throw new ForbiddenError('Permissão negada')
      }

      return await apiKeyRepository.update(input.id, {
        name: input.name,
        description: input.description,
        isActive: input.isActive,
      })
    },

    async delete(input: DeleteApiKeyData, currentUserId: number, currentUserRole: string) {
      const apiKey = await apiKeyRepository.findById(input.id)

      if (!apiKey) {
        throw new NotFoundError('API key', input.id)
      }

      if (apiKey.userId !== currentUserId && currentUserRole !== 'admin') {
        throw new ForbiddenError('Permissão negada')
      }

      await apiKeyRepository.delete(input.id)

      return { success: true }
    },

    async listAll() {
      return await apiKeyRepository.findAll()
    },
  }
}

export const apiKeyService = createApiKeyService(db)
