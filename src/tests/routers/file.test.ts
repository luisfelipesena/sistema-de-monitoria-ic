import { fileRouter } from '@/server/api/routers/file/file'
import { type TRPCContext } from '@/server/api/trpc'
import { type User } from '@/server/db/schema'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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

const mockStudentUser: User = {
  id: 3,
  username: 'student',
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

const createMockContext = (user: User | null): TRPCContext => ({
  user,
  db: {
    query: {
      alunoTable: {
        findFirst: vi.fn(),
      },
      professorTable: {
        findFirst: vi.fn(),
      },
      projetoDocumentoTable: {
        findFirst: vi.fn(),
      },
    },
    // biome-ignore lint/suspicious/noExplicitAny: Mock complexo de teste
  } as any,
})

describe('fileRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mock('@/server/lib/minio', () => ({
      default: {
        putObject: vi.fn().mockResolvedValue({ etag: 'test-etag' }),
        presignedGetObject: vi.fn().mockResolvedValue('https://test-url.com/file'),
      },
      bucketName: 'test-bucket',
      ensureBucketExists: vi.fn().mockResolvedValue(true),
    }))
  })

  describe('uploadFile', () => {
    it('should successfully upload a file', async () => {
      const mockContext = createMockContext(mockStudentUser)
      const caller = fileRouter.createCaller(mockContext)

      const input = {
        fileName: 'test.pdf',
        fileData: 'dGVzdA==', // "test" in base64
        mimeType: 'application/pdf',
        entityType: 'test-entity',
        entityId: '123',
      }

      const result = await caller.uploadFile(input)
      expect(result.fileName).toBe(input.fileName)
      expect(result.objectName).toContain(input.entityType)
      expect(result.objectName).toContain(input.entityId)
    })
  })

  describe('getPresignedUrlMutation', () => {
    it('should forbid access if user is not authorized', async () => {
      const mockContext = createMockContext(mockStudentUser)
      const caller = fileRouter.createCaller(mockContext)

      // Mock DB calls to return no association
      vi.spyOn(mockContext.db.query.alunoTable, 'findFirst').mockResolvedValue(undefined)
      vi.spyOn(mockContext.db.query.professorTable, 'findFirst').mockResolvedValue(undefined)
      vi.spyOn(mockContext.db.query.projetoDocumentoTable, 'findFirst').mockResolvedValue(undefined)

      await expect(caller.getPresignedUrlMutation({ fileId: 'some-file', action: 'view' })).rejects.toThrow()
    })

    it('should allow access for an admin', async () => {
      const mockContext = createMockContext(mockAdminUser)
      const caller = fileRouter.createCaller(mockContext)

      const result = await caller.getPresignedUrlMutation({ fileId: 'some-file', action: 'view' })
      expect(result).toBe('https://test-url.com/file')
    })

    it('should allow a student to access their own document', async () => {
      const mockContext = createMockContext(mockStudentUser)
      const caller = fileRouter.createCaller(mockContext)

      // biome-ignore lint/suspicious/noExplicitAny: Mock complexo de teste
      vi.spyOn(mockContext.db.query.alunoTable, 'findFirst').mockResolvedValue({ userId: mockStudentUser.id } as any)

      const result = await caller.getPresignedUrlMutation({ fileId: 'some-file', action: 'download' })
      expect(result).toBe('https://test-url.com/file')
    })
  })
})
