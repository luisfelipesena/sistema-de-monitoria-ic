import { apiKeyRouter } from '@/server/api/routers/api-key/api-key'
import { type TRPCContext } from '@/server/api/trpc'
import { type User } from '@/server/db/schema'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockAdminUser: User = {
  id: 1,
  username: 'admin',
  email: 'admin@test.com',
  role: 'admin',
  assinaturaDefault: null,
  dataAssinaturaDefault: null,
}

const mockProfessorUser: User = {
  id: 2,
  username: 'professor',
  email: 'prof@test.com',
  role: 'professor',
  assinaturaDefault: null,
  dataAssinaturaDefault: null,
}

const mockStudentUser: User = {
  id: 3,
  username: 'student',
  email: 'student@test.com',
  role: 'student',
  assinaturaDefault: null,
  dataAssinaturaDefault: null,
}

const createMockContext = (user: User | null): TRPCContext => ({
  user,
  db: {
    query: {
      apiKeyTable: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    },
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn(),
  } as any,
})

describe('apiKeyRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Test suite for 'create' procedure
  describe('create API key', () => {
    it('should allow a professor to create an API key for themselves', async () => {
      const mockContext = createMockContext(mockProfessorUser)
      const caller = apiKeyRouter.createCaller(mockContext)

      const input = { name: 'My Key' }
      vi.spyOn(mockContext.db, 'insert').mockReturnValue({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: 1, ...input, createdAt: new Date() }]),
      } as any)

      const result = await caller.create(input)
      expect(result).toHaveProperty('key')
      expect(result.name).toBe(input.name)
    })

    it('should allow an admin to create an API key for another user', async () => {
      const mockContext = createMockContext(mockAdminUser)
      const caller = apiKeyRouter.createCaller(mockContext)

      const input = { name: 'Student Key', userId: mockStudentUser.id }
      vi.spyOn(mockContext.db, 'insert').mockReturnValue({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: 2, ...input, createdAt: new Date() }]),
      } as any)

      const result = await caller.create(input)
      expect(result).toHaveProperty('key')
      expect(result.name).toBe(input.name)
    })

    it('should forbid a non-admin from creating an API key for another user', async () => {
      const mockContext = createMockContext(mockProfessorUser)
      const caller = apiKeyRouter.createCaller(mockContext)

      const input = { name: 'Forbidden Key', userId: mockStudentUser.id }
      await expect(caller.create(input)).rejects.toThrowError('Apenas administradores podem criar chaves para outros usuários')
    })
  })

  // Test suite for 'list' procedure
  describe('list API keys', () => {
    it('should allow a user to list their own API keys', async () => {
      const mockContext = createMockContext(mockStudentUser)
      const caller = apiKeyRouter.createCaller(mockContext)

      vi.spyOn(mockContext.db.query.apiKeyTable, 'findMany').mockResolvedValue([])

      await caller.list({})
      expect(mockContext.db.query.apiKeyTable.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.anything(),
      }))
    })

    it('should allow an admin to list keys for a specific user', async () => {
      const mockContext = createMockContext(mockAdminUser)
      const caller = apiKeyRouter.createCaller(mockContext)

      vi.spyOn(mockContext.db.query.apiKeyTable, 'findMany').mockResolvedValue([])

      await caller.list({ userId: mockProfessorUser.id })
      expect(mockContext.db.query.apiKeyTable.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.anything(),
      }))
    })

    it('should forbid a non-admin from listing another user\'s keys', async () => {
      const mockContext = createMockContext(mockProfessorUser)
      const caller = apiKeyRouter.createCaller(mockContext)

      await expect(caller.list({ userId: mockStudentUser.id })).rejects.toThrowError('Permissão negada')
    })
  })

  // Test suite for 'update' procedure
  describe('update API key', () => {
    it('should allow a user to update their own API key', async () => {
      const mockContext = createMockContext(mockProfessorUser)
      const caller = apiKeyRouter.createCaller(mockContext)
      const apiKey = { id: 1, userId: mockProfessorUser.id, name: 'Old Name', keyValue: 'hashedkey', isActive: true, createdAt: new Date(), expiresAt: null, lastUsedAt: null, description: null, updatedAt: null }

      vi.spyOn(mockContext.db.query.apiKeyTable, 'findFirst').mockResolvedValue(apiKey)
      vi.spyOn(mockContext.db, 'update').mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ ...apiKey, name: 'Updated Name' }])
      } as any)

      const result = await caller.update({ id: 1, name: 'Updated Name' })
      expect(result.name).toBe('Updated Name')
    })

    it('should forbid a user from updating another user\'s API key', async () => {
      const mockContext = createMockContext(mockProfessorUser)
      const caller = apiKeyRouter.createCaller(mockContext)
      const apiKey = { id: 2, userId: mockStudentUser.id, name: 'Another Key', keyValue: 'hashedkey2', isActive: true, createdAt: new Date(), expiresAt: null, lastUsedAt: null, description: null, updatedAt: null }

      vi.spyOn(mockContext.db.query.apiKeyTable, 'findFirst').mockResolvedValue(apiKey)

      await expect(caller.update({ id: 2, name: 'Forbidden Update' })).rejects.toThrowError('Permissão negada')
    })
  })

  // Test suite for 'delete' procedure
  describe('delete API key', () => {
    it('should allow an admin to delete any API key', async () => {
      const mockContext = createMockContext(mockAdminUser)
      const caller = apiKeyRouter.createCaller(mockContext)
      const apiKey = { id: 2, userId: mockStudentUser.id, name: 'Student Key', keyValue: 'hashedkey3', isActive: true, createdAt: new Date(), expiresAt: null, lastUsedAt: null, description: null, updatedAt: null }

      vi.spyOn(mockContext.db.query.apiKeyTable, 'findFirst').mockResolvedValue(apiKey)
      vi.spyOn(mockContext.db, 'delete').mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined)
      } as any)

      const result = await caller.delete({ id: 2 })
      expect(result.success).toBe(true)
    })

    it('should forbid a user from deleting another user\'s API key', async () => {
      const mockContext = createMockContext(mockProfessorUser)
      const caller = apiKeyRouter.createCaller(mockContext)
      const apiKey = { id: 2, userId: mockStudentUser.id, name: 'Another Key', keyValue: 'hashedkey2', isActive: true, createdAt: new Date(), expiresAt: null, lastUsedAt: null, description: null, updatedAt: null }

      vi.spyOn(mockContext.db.query.apiKeyTable, 'findFirst').mockResolvedValue(apiKey)

      await expect(caller.delete({ id: 2 })).rejects.toThrowError('Permissão negada')
    })
  })
}) 