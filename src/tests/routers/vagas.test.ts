import { vagasRouter } from '@/server/api/routers/vagas/vagas'
import { type TRPCContext } from '@/server/api/trpc'
import { type User } from '@/server/db/schema'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockVagasServiceMethods = {
  validateBolsaLimit: vi.fn(),
  acceptVaga: vi.fn(),
  rejectVaga: vi.fn(),
  getMyVagas: vi.fn(),
  getVagasByProject: vi.fn(),
  statusVagasFinalizadas: vi.fn(),
  finalizarMonitoria: vi.fn(),
}

vi.mock('@/server/services/vagas/vagas-service', () => ({
  createVagasService: vi.fn(() => mockVagasServiceMethods),
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

describe('vagasRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('acceptVaga', () => {
    it('should allow student to accept a vaga with valid inscricaoId and tipoBolsa', async () => {
      const mockContext = createMockContext(mockStudentUser)

      vi.mocked(mockVagasServiceMethods.acceptVaga).mockResolvedValue({
        success: true,
        message: 'Vaga aceita com sucesso.',
      })

      const caller = vagasRouter.createCaller(mockContext)
      const result = await caller.acceptVaga({ inscricaoId: '1', tipoBolsa: 'BOLSISTA' })

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(mockVagasServiceMethods.acceptVaga).toHaveBeenCalledWith('1', 'BOLSISTA', 3, 'student')
    })

    it('should allow student to accept a vaga as VOLUNTARIO', async () => {
      const mockContext = createMockContext(mockStudentUser)

      vi.mocked(mockVagasServiceMethods.acceptVaga).mockResolvedValue({
        success: true,
        message: 'Vaga aceita como voluntário.',
      })

      const caller = vagasRouter.createCaller(mockContext)
      const result = await caller.acceptVaga({ inscricaoId: '2', tipoBolsa: 'VOLUNTARIO' })

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(mockVagasServiceMethods.acceptVaga).toHaveBeenCalledWith('2', 'VOLUNTARIO', 3, 'student')
    })

    it('should reject unauthenticated user', async () => {
      const mockContext = createMockContext(null)
      const caller = vagasRouter.createCaller(mockContext)

      await expect(caller.acceptVaga({ inscricaoId: '1', tipoBolsa: 'BOLSISTA' })).rejects.toThrow()
    })
  })

  describe('rejectVaga', () => {
    it('should allow student to reject a vaga', async () => {
      const mockContext = createMockContext(mockStudentUser)

      vi.mocked(mockVagasServiceMethods.rejectVaga).mockResolvedValue({
        success: true,
        message: 'Vaga rejeitada com sucesso.',
      })

      const caller = vagasRouter.createCaller(mockContext)
      const result = await caller.rejectVaga({ inscricaoId: '1' })

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(mockVagasServiceMethods.rejectVaga).toHaveBeenCalledWith('1', undefined, 3, 'student')
    })

    it('should allow student to reject a vaga with motivo', async () => {
      const mockContext = createMockContext(mockStudentUser)

      vi.mocked(mockVagasServiceMethods.rejectVaga).mockResolvedValue({
        success: true,
        message: 'Vaga rejeitada com sucesso.',
      })

      const caller = vagasRouter.createCaller(mockContext)
      const result = await caller.rejectVaga({ inscricaoId: '1', motivo: 'Não tenho interesse' })

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(mockVagasServiceMethods.rejectVaga).toHaveBeenCalledWith('1', 'Não tenho interesse', 3, 'student')
    })

    it('should reject unauthenticated user', async () => {
      const mockContext = createMockContext(null)
      const caller = vagasRouter.createCaller(mockContext)

      await expect(caller.rejectVaga({ inscricaoId: '1' })).rejects.toThrow()
    })
  })

  describe('getMyVagas', () => {
    it('should allow student to get their vagas', async () => {
      const mockContext = createMockContext(mockStudentUser)

      vi.mocked(mockVagasServiceMethods.getMyVagas).mockResolvedValue([])

      const caller = vagasRouter.createCaller(mockContext)
      const result = await caller.getMyVagas()

      expect(result).toBeDefined()
      expect(mockVagasServiceMethods.getMyVagas).toHaveBeenCalledWith(3, 'student')
    })

    it('should allow professor to get their vagas', async () => {
      const mockContext = createMockContext(mockProfessorUser)

      vi.mocked(mockVagasServiceMethods.getMyVagas).mockResolvedValue([])

      const caller = vagasRouter.createCaller(mockContext)
      const result = await caller.getMyVagas()

      expect(result).toBeDefined()
      expect(mockVagasServiceMethods.getMyVagas).toHaveBeenCalledWith(2, 'professor')
    })

    it('should reject unauthenticated user', async () => {
      const mockContext = createMockContext(null)
      const caller = vagasRouter.createCaller(mockContext)

      await expect(caller.getMyVagas()).rejects.toThrow()
    })
  })

  describe('getVagasByProject', () => {
    it('should allow authenticated user to get vagas by project', async () => {
      const mockContext = createMockContext(mockProfessorUser)

      vi.mocked(mockVagasServiceMethods.getVagasByProject).mockResolvedValue([])

      const caller = vagasRouter.createCaller(mockContext)
      const result = await caller.getVagasByProject({ projetoId: '10' })

      expect(result).toBeDefined()
      expect(mockVagasServiceMethods.getVagasByProject).toHaveBeenCalledWith('10', 2, 'professor')
    })

    it('should reject unauthenticated user', async () => {
      const mockContext = createMockContext(null)
      const caller = vagasRouter.createCaller(mockContext)

      await expect(caller.getVagasByProject({ projetoId: '10' })).rejects.toThrow()
    })
  })
})
