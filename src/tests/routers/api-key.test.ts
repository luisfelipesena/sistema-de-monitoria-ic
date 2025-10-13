import { apiKeyRouter } from '@/server/api/routers/api-key/api-key'
import type { ApiKey, User } from '@/server/db/schema'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockContext } from '../setup'

describe('API Key Router', () => {
  const mockUser: User = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    role: 'admin',
    assinaturaDefault: null,
    dataAssinaturaDefault: null,
    passwordHash: null,
    emailVerifiedAt: null,
    verificationToken: null,
    verificationTokenExpiresAt: null,
    passwordResetToken: null,
    passwordResetExpiresAt: null,
  }

  const mockApiKeys: ApiKey[] = [
    {
      id: 1,
      name: 'Test Key 1',
      keyValue: 'hashed-key-1',
      isActive: true,
      description: 'Test description',
      expiresAt: null,
      lastUsedAt: null,
      createdAt: new Date(),
      updatedAt: null,
      userId: 1,
    },
    {
      id: 2,
      name: 'Test Key 2',
      keyValue: 'hashed-key-2',
      isActive: false,
      description: null,
      expiresAt: new Date(),
      lastUsedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 1,
    },
  ]

  let mockContext: ReturnType<typeof createMockContext>

  beforeEach(() => {
    vi.clearAllMocks()
    mockContext = createMockContext(mockUser)
  })

  describe('create', () => {
    it('should create a new API key', async () => {
      const newApiKey = {
        id: 3,
        name: 'New Test Key',
        description: 'New key description',
        createdAt: new Date(),
        expiresAt: null,
      }

      const expectedResult = {
        ...newApiKey,
        key: expect.any(String), // The raw key is generated and returned
      }

      vi.mocked(mockContext.db.query.apiKeyTable.findFirst).mockResolvedValue(undefined) // No existing key
      vi.mocked(mockContext.db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newApiKey]),
        }),
      } as never)

      const caller = apiKeyRouter.createCaller(mockContext)
      const result = await caller.create({
        name: 'New Test Key',
        description: 'New key description',
      })

      expect(result).toEqual(expectedResult)
      expect(typeof result.key).toBe('string')
      expect(result.key).toHaveLength(64) // SHA256 hex string length
    })
  })

  describe('list', () => {
    it('should return all API keys for the user', async () => {
      vi.mocked(mockContext.db.query.apiKeyTable.findMany).mockResolvedValue(mockApiKeys)

      const caller = apiKeyRouter.createCaller(mockContext)
      const result = await caller.list({})

      expect(result).toEqual(mockApiKeys)
      expect(mockContext.db.query.apiKeyTable.findMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        columns: expect.any(Object),
        with: expect.any(Object),
      })
    })
  })

  describe('delete', () => {
    it('should delete an API key', async () => {
      vi.mocked(mockContext.db.query.apiKeyTable.findFirst).mockResolvedValue(mockApiKeys[0])
      vi.mocked(mockContext.db.delete).mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      } as never)

      const caller = apiKeyRouter.createCaller(mockContext)
      const result = await caller.delete({ id: 1 })

      expect(result).toEqual({ success: true })
    })
  })
})
