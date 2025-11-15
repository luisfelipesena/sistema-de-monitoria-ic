import { apiKeyRouter } from '@/server/api/routers/api-key/api-key'
import type { ApiKey, User } from '@/server/db/schema'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockContext } from '../setup'

// Mock the service singleton
vi.mock('@/server/services/api-key/api-key-service', () => ({
  apiKeyService: {
    create: vi.fn(),
    list: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    listAll: vi.fn(),
  },
}))

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

  beforeEach(async () => {
    vi.clearAllMocks()
    mockContext = createMockContext(mockUser)

    const { apiKeyService } = await import('@/server/services/api-key/api-key-service')

    // Reset all mocks
    vi.mocked(apiKeyService.create).mockReset()
    vi.mocked(apiKeyService.list).mockReset()
    vi.mocked(apiKeyService.update).mockReset()
    vi.mocked(apiKeyService.delete).mockReset()
    vi.mocked(apiKeyService.listAll).mockReset()
  })

  describe('create', () => {
    it('should create a new API key', async () => {
      const newApiKey = {
        id: 3,
        name: 'New Test Key',
        description: 'New key description',
        createdAt: new Date(),
        expiresAt: null,
        userId: 1,
        keyValue: 'hashed-key',
        isActive: true,
        lastUsedAt: null,
        updatedAt: null,
        key: 'raw-key-value-64-chars-long',
      }

      const { apiKeyService } = await import('@/server/services/api-key/api-key-service')
      vi.mocked(apiKeyService.create).mockResolvedValue(newApiKey)

      const caller = apiKeyRouter.createCaller(mockContext)
      const result = await caller.create({
        name: 'New Test Key',
        description: 'New key description',
      })

      expect(result).toBeDefined()
      expect(result?.key).toBeDefined()
      expect(typeof result?.key).toBe('string')
    })
  })

  describe('list', () => {
    it('should return all API keys for the user', async () => {
      const { apiKeyService } = await import('@/server/services/api-key/api-key-service')
      vi.mocked(apiKeyService.list).mockResolvedValue(mockApiKeys.map((key) => ({ ...key, user: mockUser })))

      const caller = apiKeyRouter.createCaller(mockContext)
      const result = await caller.list({})

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(apiKeyService.list).toHaveBeenCalled()
    })
  })

  describe('delete', () => {
    it('should delete an API key', async () => {
      const { apiKeyService } = await import('@/server/services/api-key/api-key-service')
      vi.mocked(apiKeyService.delete).mockResolvedValue({ success: true })

      const caller = apiKeyRouter.createCaller(mockContext)

      await expect(caller.delete({ id: 1 })).resolves.toBeDefined()
      expect(apiKeyService.delete).toHaveBeenCalled()
    })
  })
})
