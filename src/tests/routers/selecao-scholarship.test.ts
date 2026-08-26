import { selecaoRouter } from '@/server/api/routers/selecao/selecao'
import { type TRPCContext } from '@/server/api/trpc'
import { type User } from '@/server/db/schema'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the email services
vi.mock('@/server/lib/email', () => ({
  studentEmailService: {
    sendSelectionResult: vi.fn().mockResolvedValue(undefined),
    sendScholarshipSelectedNotification: vi.fn().mockResolvedValue(undefined),
  },
  professorEmailService: {
    sendStudentConfirmedInterestNotification: vi.fn().mockResolvedValue(undefined),
    sendStudentRejectedInterestNotification: vi.fn().mockResolvedValue(undefined),
    sendScholarshipRejectedNotification: vi.fn().mockResolvedValue(undefined),
  },
}))

const mockSelecaoServiceMethods = {
  confirmInterest: vi.fn(),
  rejectInterest: vi.fn(),
  selectMonitors: vi.fn(),
  publishResults: vi.fn(),
  generateAtaData: vi.fn(),
  createAtaRecord: vi.fn(),
  signAta: vi.fn(),
  getProfessorProjectsWithCandidates: vi.fn(),
  getAtasForSigning: vi.fn(),
}

vi.mock('@/server/services/selecao/selecao-service', () => ({
  createSelecaoService: vi.fn(() => mockSelecaoServiceMethods),
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

describe('selecaoRouter - Scholarship Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('confirmInterest', () => {
    it('should allow student to confirm interest', async () => {
      const mockContext = createMockContext(mockStudentUser)

      vi.mocked(mockSelecaoServiceMethods.confirmInterest).mockResolvedValue({
        success: true,
        message: 'Interesse confirmado com sucesso! O professor será notificado.',
      })

      const caller = selecaoRouter.createCaller(mockContext)
      const result = await caller.confirmInterest({ inscricaoId: 1 })

      expect(result).toBeDefined()
      expect(result!.success).toBe(true)
      expect(mockSelecaoServiceMethods.confirmInterest).toHaveBeenCalledWith(1, 3, 'student')
    })

    it('should reject unauthenticated user', async () => {
      const mockContext = createMockContext(null)
      const caller = selecaoRouter.createCaller(mockContext)

      await expect(caller.confirmInterest({ inscricaoId: 1 })).rejects.toThrow()
    })
  })

  describe('rejectInterest', () => {
    it('should allow student to reject participation', async () => {
      const mockContext = createMockContext(mockStudentUser)

      vi.mocked(mockSelecaoServiceMethods.rejectInterest).mockResolvedValue({
        success: true,
        message: 'Participação no processo seletivo rejeitada.',
      })

      const caller = selecaoRouter.createCaller(mockContext)
      const result = await caller.rejectInterest({ inscricaoId: 1 })

      expect(result).toBeDefined()
      expect(result!.success).toBe(true)
      expect(mockSelecaoServiceMethods.rejectInterest).toHaveBeenCalledWith(1, 3, 'student')
    })
  })

  describe('selectMonitors', () => {
    it('should select monitors with motivoTroca when replacing', async () => {
      const mockContext = createMockContext(mockProfessorUser)

      vi.mocked(mockSelecaoServiceMethods.selectMonitors).mockResolvedValue({
        success: true,
        message: 'Monitores selecionados com sucesso',
        bolsistasSelecionados: 1,
        voluntariosSelecionados: 0,
      })

      const caller = selecaoRouter.createCaller(mockContext)
      const result = await caller.selectMonitors({
        projetoId: 1,
        bolsistas: [2],
        voluntarios: [],
        motivoTroca: 'Sem retorno do aluno anterior',
      })

      expect(result).toBeDefined()
      expect(result!.success).toBe(true)
      expect(mockSelecaoServiceMethods.selectMonitors).toHaveBeenCalledWith({
        projetoId: 1,
        bolsistas: [2],
        voluntarios: [],
        motivoTroca: 'Sem retorno do aluno anterior',
        userId: 2,
        userRole: 'professor',
      })
    })

    it('should allow first selection without motivoTroca', async () => {
      const mockContext = createMockContext(mockProfessorUser)

      vi.mocked(mockSelecaoServiceMethods.selectMonitors).mockResolvedValue({
        success: true,
        message: 'Monitores selecionados com sucesso',
        bolsistasSelecionados: 1,
        voluntariosSelecionados: 0,
      })

      const caller = selecaoRouter.createCaller(mockContext)
      const result = await caller.selectMonitors({
        projetoId: 1,
        bolsistas: [1],
        voluntarios: [],
      })

      expect(result).toBeDefined()
      expect(result!.success).toBe(true)
    })
  })
})
