import { relatoriosFinaisRouter } from '@/server/api/routers/relatorios-finais/relatorios-finais'
import { type TRPCContext } from '@/server/api/trpc'
import { type User } from '@/server/db/schema'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockRelatoriosFinaisServiceMethods = {
  listRelatoriosDisciplinaForProfessor: vi.fn(),
  getRelatorioDisciplina: vi.fn(),
  createRelatorioDisciplina: vi.fn(),
  updateRelatorioDisciplina: vi.fn(),
  signRelatorioDisciplina: vi.fn(),
  getRelatorioMonitor: vi.fn(),
  createRelatorioMonitor: vi.fn(),
  updateRelatorioMonitor: vi.fn(),
  signRelatorioMonitorAsProfessor: vi.fn(),
  listRelatoriosPendentesParaAluno: vi.fn(),
  getRelatorioMonitorParaAluno: vi.fn(),
  signRelatorioMonitorAsAluno: vi.fn(),
  listAllDisciplinaReportsForAdmin: vi.fn(),
  listAllMonitorReportsForAdmin: vi.fn(),
}

vi.mock('@/server/services/relatorios-finais', () => ({
  createRelatoriosFinaisService: vi.fn(() => mockRelatoriosFinaisServiceMethods),
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

describe('relatoriosFinaisRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ========================================
  // PROFESSOR - RELATORIO DISCIPLINA
  // ========================================

  describe('listRelatoriosDisciplina', () => {
    it('should allow professor to list relatorios', async () => {
      const mockContext = createMockContext(mockProfessorUser)

      mockRelatoriosFinaisServiceMethods.listRelatoriosDisciplinaForProfessor.mockResolvedValue([
        { id: 1, projetoId: 10, status: 'rascunho' },
      ])

      const caller = relatoriosFinaisRouter.createCaller(mockContext)
      const result = await caller.listRelatoriosDisciplina({})

      expect(result).toBeDefined()
      expect(result).toHaveLength(1)
      expect(mockRelatoriosFinaisServiceMethods.listRelatoriosDisciplinaForProfessor).toHaveBeenCalledWith(
        2,
        undefined,
        undefined
      )
    })

    it('should reject unauthenticated user', async () => {
      const mockContext = createMockContext(null)
      const caller = relatoriosFinaisRouter.createCaller(mockContext)

      await expect(caller.listRelatoriosDisciplina({})).rejects.toThrow()
    })

    it('should reject student role', async () => {
      const mockContext = createMockContext(mockStudentUser)
      const caller = relatoriosFinaisRouter.createCaller(mockContext)

      await expect(caller.listRelatoriosDisciplina({})).rejects.toThrow('Apenas professores podem acessar esta funcionalidade')
    })

    it('should allow admin to list relatorios', async () => {
      const mockContext = createMockContext(mockAdminUser)

      mockRelatoriosFinaisServiceMethods.listRelatoriosDisciplinaForProfessor.mockResolvedValue([])

      const caller = relatoriosFinaisRouter.createCaller(mockContext)
      const result = await caller.listRelatoriosDisciplina({})

      expect(result).toBeDefined()
    })
  })

  describe('createRelatorioDisciplina', () => {
    it('should allow professor to create relatorio', async () => {
      const mockContext = createMockContext(mockProfessorUser)

      mockRelatoriosFinaisServiceMethods.createRelatorioDisciplina.mockResolvedValue({
        id: 1,
        projetoId: 10,
        status: 'rascunho',
      })

      const caller = relatoriosFinaisRouter.createCaller(mockContext)
      const result = await caller.createRelatorioDisciplina({
        projetoId: 10,
        conteudo: {
          resumoAtividades: 'Atividades de monitoria realizadas no semestre',
          avaliacaoGeral: 'Avaliação geral das atividades do período',
          dificuldadesEncontradas: 'Nenhuma dificuldade relevante',
        },
      })

      expect(result).toBeDefined()
      expect(result!.id).toBe(1)
      expect(mockRelatoriosFinaisServiceMethods.createRelatorioDisciplina).toHaveBeenCalledWith(2, expect.any(Object))
    })

    it('should reject unauthenticated user', async () => {
      const mockContext = createMockContext(null)
      const caller = relatoriosFinaisRouter.createCaller(mockContext)

      await expect(
        caller.createRelatorioDisciplina({
          projetoId: 10,
          conteudo: {
            resumoAtividades: 'Atividades de monitoria realizadas no semestre',
            avaliacaoGeral: 'Avaliação geral das atividades do período',
          },
        })
      ).rejects.toThrow()
    })

    it('should reject student from creating relatorio disciplina', async () => {
      const mockContext = createMockContext(mockStudentUser)
      const caller = relatoriosFinaisRouter.createCaller(mockContext)

      await expect(
        caller.createRelatorioDisciplina({
          projetoId: 10,
          conteudo: {
            resumoAtividades: 'Atividades de monitoria realizadas no semestre',
            avaliacaoGeral: 'Avaliação geral das atividades do período',
          },
        })
      ).rejects.toThrow('Apenas professores podem criar relatórios')
    })
  })

  describe('signRelatorioDisciplina', () => {
    it('should allow professor to sign relatorio', async () => {
      const mockContext = createMockContext(mockProfessorUser)

      mockRelatoriosFinaisServiceMethods.signRelatorioDisciplina.mockResolvedValue({
        success: true,
      })

      const caller = relatoriosFinaisRouter.createCaller(mockContext)
      const result = await caller.signRelatorioDisciplina({ relatorioId: 1 })

      expect(result).toBeDefined()
      expect((result as any).success).toBe(true)
      expect(mockRelatoriosFinaisServiceMethods.signRelatorioDisciplina).toHaveBeenCalledWith(2, 1)
    })

    it('should reject student from signing relatorio disciplina', async () => {
      const mockContext = createMockContext(mockStudentUser)
      const caller = relatoriosFinaisRouter.createCaller(mockContext)

      await expect(caller.signRelatorioDisciplina({ relatorioId: 1 })).rejects.toThrow('Apenas professores podem assinar relatórios')
    })
  })

  // ========================================
  // ALUNO - RELATORIO MONITOR
  // ========================================

  describe('listRelatoriosPendentesAluno', () => {
    it('should allow student to list pending relatorios', async () => {
      const mockContext = createMockContext(mockStudentUser)

      mockRelatoriosFinaisServiceMethods.listRelatoriosPendentesParaAluno.mockResolvedValue([
        { id: 1, status: 'pendente_assinatura_aluno' },
      ])

      const caller = relatoriosFinaisRouter.createCaller(mockContext)
      const result = await caller.listRelatoriosPendentesAluno()

      expect(result).toBeDefined()
      expect(result).toHaveLength(1)
      expect(mockRelatoriosFinaisServiceMethods.listRelatoriosPendentesParaAluno).toHaveBeenCalledWith(3)
    })

    it('should reject unauthenticated user', async () => {
      const mockContext = createMockContext(null)
      const caller = relatoriosFinaisRouter.createCaller(mockContext)

      await expect(caller.listRelatoriosPendentesAluno()).rejects.toThrow()
    })

    it('should reject professor from accessing student endpoint', async () => {
      const mockContext = createMockContext(mockProfessorUser)
      const caller = relatoriosFinaisRouter.createCaller(mockContext)

      await expect(caller.listRelatoriosPendentesAluno()).rejects.toThrow('Apenas alunos podem acessar esta funcionalidade')
    })
  })

  describe('signRelatorioMonitorAsAluno', () => {
    it('should allow student to sign relatorio', async () => {
      const mockContext = createMockContext(mockStudentUser)

      mockRelatoriosFinaisServiceMethods.signRelatorioMonitorAsAluno.mockResolvedValue({
        success: true,
      })

      const caller = relatoriosFinaisRouter.createCaller(mockContext)
      const result = await caller.signRelatorioMonitorAsAluno({ relatorioId: 1 })

      expect(result).toBeDefined()
      expect((result as any).success).toBe(true)
      expect(mockRelatoriosFinaisServiceMethods.signRelatorioMonitorAsAluno).toHaveBeenCalledWith(3, 1)
    })

    it('should reject professor from signing as student', async () => {
      const mockContext = createMockContext(mockProfessorUser)
      const caller = relatoriosFinaisRouter.createCaller(mockContext)

      await expect(caller.signRelatorioMonitorAsAluno({ relatorioId: 1 })).rejects.toThrow('Apenas alunos podem assinar relatórios')
    })
  })

  // ========================================
  // ADMIN ENDPOINTS
  // ========================================

  describe('listAllDisciplinaReportsForAdmin', () => {
    it('should allow admin to list all disciplina reports', async () => {
      const mockContext = createMockContext(mockAdminUser)

      mockRelatoriosFinaisServiceMethods.listAllDisciplinaReportsForAdmin.mockResolvedValue({
        reports: [],
        total: 0,
      })

      const caller = relatoriosFinaisRouter.createCaller(mockContext)
      const result = await caller.listAllDisciplinaReportsForAdmin({})

      expect(result).toBeDefined()
      expect(mockRelatoriosFinaisServiceMethods.listAllDisciplinaReportsForAdmin).toHaveBeenCalled()
    })

    it('should reject unauthenticated user', async () => {
      const mockContext = createMockContext(null)
      const caller = relatoriosFinaisRouter.createCaller(mockContext)

      await expect(caller.listAllDisciplinaReportsForAdmin({})).rejects.toThrow()
    })

    it('should reject non-admin user (professor)', async () => {
      const mockContext = createMockContext(mockProfessorUser)
      const caller = relatoriosFinaisRouter.createCaller(mockContext)

      await expect(caller.listAllDisciplinaReportsForAdmin({})).rejects.toThrow()
    })

    it('should reject non-admin user (student)', async () => {
      const mockContext = createMockContext(mockStudentUser)
      const caller = relatoriosFinaisRouter.createCaller(mockContext)

      await expect(caller.listAllDisciplinaReportsForAdmin({})).rejects.toThrow()
    })
  })

  describe('listAllMonitorReportsForAdmin', () => {
    it('should allow admin to list all monitor reports', async () => {
      const mockContext = createMockContext(mockAdminUser)

      mockRelatoriosFinaisServiceMethods.listAllMonitorReportsForAdmin.mockResolvedValue({
        reports: [],
        total: 0,
      })

      const caller = relatoriosFinaisRouter.createCaller(mockContext)
      const result = await caller.listAllMonitorReportsForAdmin({})

      expect(result).toBeDefined()
      expect(mockRelatoriosFinaisServiceMethods.listAllMonitorReportsForAdmin).toHaveBeenCalled()
    })

    it('should reject non-admin user', async () => {
      const mockContext = createMockContext(mockStudentUser)
      const caller = relatoriosFinaisRouter.createCaller(mockContext)

      await expect(caller.listAllMonitorReportsForAdmin({})).rejects.toThrow()
    })
  })
})
