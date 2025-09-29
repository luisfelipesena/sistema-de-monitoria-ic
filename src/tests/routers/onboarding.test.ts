import { onboardingRouter, REQUIRED_DOCUMENTS } from '@/server/api/routers/onboarding/onboarding'
import { type TRPCContext } from '@/server/api/trpc'
import { type User } from '@/server/db/schema'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockStudentUser: User = {
  id: 3,
  username: 'student',
  email: 'student@test.com',
  role: 'student',
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
      disciplinaProfessorResponsavelTable: {
        findFirst: vi.fn(),
      },
    },
  } as any,
})

describe('onboardingRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getStatus', () => {
    it('should return pending: true for a new student with no profile', async () => {
      const mockContext = createMockContext(mockStudentUser)
      const caller = onboardingRouter.createCaller(mockContext)

      vi.spyOn(mockContext.db.query.alunoTable, 'findFirst').mockResolvedValue(undefined)

      const result = await caller.getStatus()
      expect(result.pending).toBe(true)
      expect(result.profile.exists).toBe(false)
    })

    it('should return pending: true for a professor with a profile but missing documents', async () => {
      const mockContext = createMockContext(mockProfessorUser)
      const caller = onboardingRouter.createCaller(mockContext)

      const mockProfile = { id: 1, curriculumVitaeFileId: null, comprovanteVinculoFileId: null }
      vi.spyOn(mockContext.db.query.professorTable, 'findFirst').mockResolvedValue(mockProfile as any)

      const result = await caller.getStatus()
      expect(result.pending).toBe(true)
      expect(result.documents.missing).toEqual(REQUIRED_DOCUMENTS.professor)
    })

    it('should return pending: false for a professor with a complete profile', async () => {
      const mockContext = createMockContext(mockProfessorUser)
      const caller = onboardingRouter.createCaller(mockContext)

      const mockProfile = {
        id: 1,
        assinaturaDefault: 'base64signature',
        dataAssinaturaDefault: new Date(),
      }
      vi.spyOn(mockContext.db.query.professorTable, 'findFirst').mockResolvedValue(mockProfile as any)

      const result = await caller.getStatus()
      expect(result.pending).toBe(false)
      expect(result.documents.missing).toHaveLength(0)
    })
  })
})
