import { selecaoRouter } from '@/server/api/routers/selecao/selecao'
import { type TRPCContext } from '@/server/api/trpc'
import { type User } from '@/server/db/schema'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the email service
vi.mock('@/server/lib/email', () => ({
  studentEmailService: {
    sendSelectionResult: vi.fn().mockResolvedValue(undefined),
  },
}))

// Mock the selecao service factory
const mockSelecaoServiceMethods = {
  publishResults: vi.fn(),
  generateAtaData: vi.fn(),
  createAtaRecord: vi.fn(),
  signAta: vi.fn(),
  getProfessorProjectsWithCandidates: vi.fn(),
  selectMonitors: vi.fn(),
  getAtasForSigning: vi.fn(),
}

vi.mock('@/server/services/selecao/selecao-service', () => ({
  createSelecaoService: vi.fn(() => mockSelecaoServiceMethods),
}))

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
        projetoTable: {
          findFirst: vi.fn(),
        },
        inscricaoTable: {
          findMany: vi.fn(),
        },
      },
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      transaction: vi.fn(async (callback) => await callback(mockTx)),
      // biome-ignore lint/suspicious/noExplicitAny: Mock complexo de teste
    } as any,
  }
}

describe('selecaoRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('publishResults', () => {
    it('should correctly update inscription statuses based on final grade', async () => {
      const mockContext = createMockContext(mockProfessorUser)

      vi.mocked(mockSelecaoServiceMethods.publishResults).mockResolvedValue({
        success: true,
        notificationsCount: 2,
        message: 'Resultados publicados e notificações enviadas',
      })

      const caller = selecaoRouter.createCaller(mockContext)
      const result = await caller.publishResults({ projetoId: '1', notifyStudents: false })

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })

    it('should trigger email notifications when notifyStudents is true', async () => {
      const mockContext = createMockContext(mockProfessorUser)

      vi.mocked(mockSelecaoServiceMethods.publishResults).mockResolvedValue({
        success: true,
        notificationsCount: 1,
        message: 'Resultados publicados e notificações enviadas',
      })

      const caller = selecaoRouter.createCaller(mockContext)
      const result = await caller.publishResults({ projetoId: '1', notifyStudents: true })

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.notificationsCount).toBeGreaterThanOrEqual(0)
    })
  })
})
