import { inviteProfessorRouter } from '@/server/api/routers/invite-professor/invite-professor'
import { type TRPCContext } from '@/server/api/trpc'
import { type User } from '@/server/db/schema'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/server/lib/email', () => ({
  sendProfessorInvitationEmail: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/server/db', () => ({
  db: {
    query: {
      professorInvitationTable: {
        findFirst: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
      },
      professorTable: {
        findFirst: vi.fn(),
      },
      departamentoTable: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    },
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi
          .fn()
          .mockResolvedValue([{ id: 1, email: 'prof@ufba.br', token: 'token-123', expiresAt: new Date() }]),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
  },
}))

vi.mock('@/utils/env', () => ({
  env: {
    CLIENT_URL: 'http://localhost:3000',
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
      query: {
        userTable: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
        professorInvitationTable: {
          findFirst: vi.fn().mockResolvedValue(null),
          findMany: vi.fn().mockResolvedValue([]),
        },
        professorTable: {
          findFirst: vi.fn(),
        },
        departamentoTable: {
          findMany: vi
            .fn()
            .mockResolvedValue([{ id: 1, nome: 'Ciência da Computação', sigla: 'DCC', unidadeUniversitaria: 'IM' }]),
        },
      },
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi
            .fn()
            .mockResolvedValue([
              { id: 1, userId: 10, email: 'newprof@ufba.br', token: 'token-abc', expiresAt: new Date() },
            ]),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      }),
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
      transaction: vi.fn(async (callback) => await callback(mockTx)),
    } as any,
  }
}

describe('inviteProfessorRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('sendInvitation', () => {
    it('should reject unauthenticated user', async () => {
      const mockContext = createMockContext(null)
      const caller = inviteProfessorRouter.createCaller(mockContext)

      await expect(
        caller.sendInvitation({
          email: 'newprof@ufba.br',
          nomeCompleto: 'Dr. Professor',
          departamentoId: 1,
          regime: 'DE',
          tipoProfessor: 'EFETIVO',
          expiresInDays: 7,
        })
      ).rejects.toThrow()
    })

    it('should reject non-admin user (student)', async () => {
      const mockContext = createMockContext(mockStudentUser)
      const caller = inviteProfessorRouter.createCaller(mockContext)

      await expect(
        caller.sendInvitation({
          email: 'newprof@ufba.br',
          nomeCompleto: 'Dr. Professor',
          departamentoId: 1,
          regime: 'DE',
          tipoProfessor: 'EFETIVO',
          expiresInDays: 7,
        })
      ).rejects.toThrow()
    })

    it('should reject non-admin user (professor)', async () => {
      const mockContext = createMockContext(mockProfessorUser)
      const caller = inviteProfessorRouter.createCaller(mockContext)

      await expect(
        caller.sendInvitation({
          email: 'newprof@ufba.br',
          nomeCompleto: 'Dr. Professor',
          departamentoId: 1,
          regime: 'DE',
          tipoProfessor: 'EFETIVO',
          expiresInDays: 7,
        })
      ).rejects.toThrow()
    })
  })

  describe('getInvitations', () => {
    it('should reject unauthenticated user', async () => {
      const mockContext = createMockContext(null)
      const caller = inviteProfessorRouter.createCaller(mockContext)

      await expect(caller.getInvitations({})).rejects.toThrow()
    })

    it('should reject non-admin user', async () => {
      const mockContext = createMockContext(mockProfessorUser)
      const caller = inviteProfessorRouter.createCaller(mockContext)

      await expect(caller.getInvitations({})).rejects.toThrow()
    })
  })

  describe('resendInvitation', () => {
    it('should reject unauthenticated user', async () => {
      const mockContext = createMockContext(null)
      const caller = inviteProfessorRouter.createCaller(mockContext)

      await expect(caller.resendInvitation({ invitationId: 1, expiresInDays: 7 })).rejects.toThrow()
    })

    it('should reject non-admin user', async () => {
      const mockContext = createMockContext(mockStudentUser)
      const caller = inviteProfessorRouter.createCaller(mockContext)

      await expect(caller.resendInvitation({ invitationId: 1, expiresInDays: 7 })).rejects.toThrow()
    })
  })

  describe('cancelInvitation', () => {
    it('should reject unauthenticated user', async () => {
      const mockContext = createMockContext(null)
      const caller = inviteProfessorRouter.createCaller(mockContext)

      await expect(caller.cancelInvitation({ invitationId: 1 })).rejects.toThrow()
    })

    it('should reject non-admin user', async () => {
      const mockContext = createMockContext(mockProfessorUser)
      const caller = inviteProfessorRouter.createCaller(mockContext)

      await expect(caller.cancelInvitation({ invitationId: 1 })).rejects.toThrow()
    })
  })

  describe('deleteInvitation', () => {
    it('should reject unauthenticated user', async () => {
      const mockContext = createMockContext(null)
      const caller = inviteProfessorRouter.createCaller(mockContext)

      await expect(caller.deleteInvitation({ invitationId: 1 })).rejects.toThrow()
    })

    it('should reject non-admin user', async () => {
      const mockContext = createMockContext(mockStudentUser)
      const caller = inviteProfessorRouter.createCaller(mockContext)

      await expect(caller.deleteInvitation({ invitationId: 1 })).rejects.toThrow()
    })
  })

  describe('getInvitationStats', () => {
    it('should reject unauthenticated user', async () => {
      const mockContext = createMockContext(null)
      const caller = inviteProfessorRouter.createCaller(mockContext)

      await expect(caller.getInvitationStats()).rejects.toThrow()
    })

    it('should reject non-admin user', async () => {
      const mockContext = createMockContext(mockProfessorUser)
      const caller = inviteProfessorRouter.createCaller(mockContext)

      await expect(caller.getInvitationStats()).rejects.toThrow()
    })
  })

  describe('getInvitationByToken (public)', () => {
    it('should allow unauthenticated access (public procedure)', async () => {
      const mockContext = createMockContext(null)

      // Override the mock to simulate finding an invitation via the module-level db mock
      const { db } = await import('@/server/db')
      vi.mocked(db.query.professorInvitationTable.findFirst).mockResolvedValue({
        id: 1,
        email: 'prof@ufba.br',
        nomeCompleto: 'Dr. Professor',
        status: 'pending',
        expiresAt: new Date(Date.now() + 86400000),
        departamento: { id: 1, nome: 'DCC', sigla: 'DCC' },
        regime: 'DE',
        tipoProfessor: 'EFETIVO',
        token: 'valid-token',
        invitedByUserId: 1,
        acceptedByUserId: null,
        professorId: 1,
        departamentoId: 1,
        createdAt: new Date(),
      } as any)

      const caller = inviteProfessorRouter.createCaller(mockContext)
      const result = await caller.getInvitationByToken({ token: 'valid-token' })

      expect(result).toBeDefined()
      expect(result.email).toBe('prof@ufba.br')
    })
  })

  describe('acceptInvitation (public)', () => {
    it('should allow unauthenticated access (public procedure)', async () => {
      const { db } = await import('@/server/db')

      vi.mocked(db.query.professorInvitationTable.findFirst).mockResolvedValue({
        id: 1,
        email: 'prof@ufba.br',
        nomeCompleto: 'Dr. Professor',
        status: 'pending',
        expiresAt: new Date(Date.now() + 86400000),
        token: 'valid-token',
        professorId: 5,
        invitedByUserId: 1,
        acceptedByUserId: null,
        departamentoId: 1,
        regime: 'DE',
        tipoProfessor: 'EFETIVO',
        createdAt: new Date(),
      } as any)

      vi.mocked(db.query.professorTable.findFirst).mockResolvedValue({
        id: 5,
        userId: 10,
        nomeCompleto: 'Dr. Professor',
        departamentoId: 1,
        regime: 'DE',
        tipoProfessor: 'EFETIVO',
        accountStatus: 'pending',
      } as any)

      const mockContext = createMockContext(null)
      const caller = inviteProfessorRouter.createCaller(mockContext)
      const result = await caller.acceptInvitation({
        token: 'valid-token',
        password: 'securepassword123',
      })

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.email).toBe('prof@ufba.br')
    })
  })
})
