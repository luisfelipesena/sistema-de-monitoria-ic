import { signatureRouter } from '@/server/api/routers/signature/signature'
import { type TRPCContext } from '@/server/api/trpc'
import { type User } from '@/server/db/schema'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockSignatureServiceMethods = {
  getDefaultSignature: vi.fn(),
  saveDefaultSignature: vi.fn(),
  deleteDefaultSignature: vi.fn(),
}

vi.mock('@/server/services/signature/signature-service', () => ({
  signatureService: {
    getDefaultSignature: (...args: any[]) => mockSignatureServiceMethods.getDefaultSignature(...args),
    saveDefaultSignature: (...args: any[]) => mockSignatureServiceMethods.saveDefaultSignature(...args),
    deleteDefaultSignature: (...args: any[]) => mockSignatureServiceMethods.deleteDefaultSignature(...args),
  },
}))

const mockStudentUser: User = {
  id: 3,
  username: 'student_test',
  email: 'student@test.com',
  role: 'student',
  adminType: null,
  assinaturaDefault: null,
  dataAssinaturaDefault: null,
  passwordHash: null,
  emailVerifiedAt: null,
  verificationToken: null,
  verificationTokenExpiresAt: null,
  passwordResetToken: null,
  passwordResetExpiresAt: null,
}

const mockProfessorUser: User = {
  id: 2,
  username: 'professor',
  email: 'prof@test.com',
  role: 'professor',
  adminType: null,
  assinaturaDefault: null,
  dataAssinaturaDefault: null,
  passwordHash: null,
  emailVerifiedAt: null,
  verificationToken: null,
  verificationTokenExpiresAt: null,
  passwordResetToken: null,
  passwordResetExpiresAt: null,
}

const mockAdminUser: User = {
  id: 1,
  username: 'admin',
  email: 'admin@test.com',
  role: 'admin',
  adminType: 'DCC',
  assinaturaDefault: null,
  dataAssinaturaDefault: null,
  passwordHash: null,
  emailVerifiedAt: null,
  verificationToken: null,
  verificationTokenExpiresAt: null,
  passwordResetToken: null,
  passwordResetExpiresAt: null,
}

const createMockContext = (user: User | null): TRPCContext => {
  const mockTx = {
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
  }
  return {
    user,
    db: {
      query: {},
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      transaction: vi.fn(async (callback) => await callback(mockTx)),
    } as any,
  }
}

describe('signatureRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getDefaultSignature', () => {
    it('should return signature for authenticated user', async () => {
      const mockContext = createMockContext(mockStudentUser)
      const mockSignature = {
        signatureData: 'base64-signature-data',
        dataAssinatura: new Date('2024-01-01'),
      }

      mockSignatureServiceMethods.getDefaultSignature.mockResolvedValue(mockSignature)

      const caller = signatureRouter.createCaller(mockContext)
      const result = await caller.getDefaultSignature()

      expect(result).toBeDefined()
      expect(result!.signatureData).toBe('base64-signature-data')
      expect(mockSignatureServiceMethods.getDefaultSignature).toHaveBeenCalledWith(3)
    })

    it('should return null when user has no signature', async () => {
      const mockContext = createMockContext(mockProfessorUser)

      mockSignatureServiceMethods.getDefaultSignature.mockResolvedValue(null)

      const caller = signatureRouter.createCaller(mockContext)
      const result = await caller.getDefaultSignature()

      expect(result).toBeNull()
      expect(mockSignatureServiceMethods.getDefaultSignature).toHaveBeenCalledWith(2)
    })

    it('should reject unauthenticated user', async () => {
      const mockContext = createMockContext(null)
      const caller = signatureRouter.createCaller(mockContext)

      await expect(caller.getDefaultSignature()).rejects.toThrow()
    })
  })

  describe('saveDefaultSignature', () => {
    it('should save signature for authenticated user', async () => {
      const mockContext = createMockContext(mockProfessorUser)

      mockSignatureServiceMethods.saveDefaultSignature.mockResolvedValue(undefined)

      const caller = signatureRouter.createCaller(mockContext)
      const result = await caller.saveDefaultSignature({
        signatureData: 'new-signature-data',
      })

      expect(result).toEqual({ success: true })
      expect(mockSignatureServiceMethods.saveDefaultSignature).toHaveBeenCalledWith(2, 'new-signature-data')
    })

    it('should reject unauthenticated user', async () => {
      const mockContext = createMockContext(null)
      const caller = signatureRouter.createCaller(mockContext)

      await expect(
        caller.saveDefaultSignature({ signatureData: 'some-data' })
      ).rejects.toThrow()
    })

    it('should allow any authenticated role to save signature', async () => {
      const mockContext = createMockContext(mockAdminUser)

      mockSignatureServiceMethods.saveDefaultSignature.mockResolvedValue(undefined)

      const caller = signatureRouter.createCaller(mockContext)
      const result = await caller.saveDefaultSignature({
        signatureData: 'admin-signature-data',
      })

      expect(result).toEqual({ success: true })
      expect(mockSignatureServiceMethods.saveDefaultSignature).toHaveBeenCalledWith(1, 'admin-signature-data')
    })
  })

  describe('deleteDefaultSignature', () => {
    it('should delete signature for authenticated user', async () => {
      const mockContext = createMockContext(mockStudentUser)

      mockSignatureServiceMethods.deleteDefaultSignature.mockResolvedValue(undefined)

      const caller = signatureRouter.createCaller(mockContext)
      const result = await caller.deleteDefaultSignature()

      expect(result).toEqual({ success: true })
      expect(mockSignatureServiceMethods.deleteDefaultSignature).toHaveBeenCalledWith(3)
    })

    it('should reject unauthenticated user', async () => {
      const mockContext = createMockContext(null)
      const caller = signatureRouter.createCaller(mockContext)

      await expect(caller.deleteDefaultSignature()).rejects.toThrow()
    })

    it('should allow professor to delete signature', async () => {
      const mockContext = createMockContext(mockProfessorUser)

      mockSignatureServiceMethods.deleteDefaultSignature.mockResolvedValue(undefined)

      const caller = signatureRouter.createCaller(mockContext)
      const result = await caller.deleteDefaultSignature()

      expect(result).toEqual({ success: true })
      expect(mockSignatureServiceMethods.deleteDefaultSignature).toHaveBeenCalledWith(2)
    })

    it('should handle service error gracefully', async () => {
      const mockContext = createMockContext(mockStudentUser)

      mockSignatureServiceMethods.deleteDefaultSignature.mockRejectedValue(new Error('DB error'))

      const caller = signatureRouter.createCaller(mockContext)

      await expect(caller.deleteDefaultSignature()).rejects.toThrow()
    })
  })
})
