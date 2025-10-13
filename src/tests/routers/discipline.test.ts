import { disciplineRouter } from '@/server/api/routers/discipline/discipline'
import { type TRPCContext } from '@/server/api/trpc'
import { type User } from '@/server/db/schema'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockAdminUser: User = {
  id: 1,
  username: 'admin',
  email: 'admin@test.com',
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
      disciplinaTable: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      disciplinaProfessorResponsavelTable: {
        findFirst: vi.fn(),
      },
      projetoDisciplinaTable: {
        findFirst: vi.fn(),
      },
      projetoTemplateTable: {
        findFirst: vi.fn(),
      },
      professorTable: {
        findFirst: vi.fn().mockResolvedValue({ id: 1, departamentoId: 1 }),
      },
    },
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn(),
  } as never,
})

describe('disciplineRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('deleteDiscipline', () => {
    it('should throw CONFLICT error if discipline has dependencies', async () => {
      const mockContext = createMockContext(mockAdminUser)
      const caller = disciplineRouter.createCaller(mockContext)

      vi.spyOn(mockContext.db.query.disciplinaTable, 'findFirst').mockResolvedValue({
        id: 1,
        nome: 'Test Discipline',
        codigo: 'T01',
        departamentoId: 1,
        turma: 'T01',
        createdAt: new Date(),
        updatedAt: null,
        deletedAt: null,
      })
      vi.spyOn(mockContext.db.query.projetoDisciplinaTable, 'findFirst').mockResolvedValue({
        id: 1,
        projetoId: 1,
        disciplinaId: 1,
        createdAt: new Date(),
      }) // Dependency exists
      vi.spyOn(mockContext.db.query.disciplinaProfessorResponsavelTable, 'findFirst').mockResolvedValue(undefined)
      vi.spyOn(mockContext.db.query.projetoTemplateTable, 'findFirst').mockResolvedValue(undefined)

      await expect(caller.deleteDiscipline({ id: 1 })).rejects.toThrowError(
        /Erro ao deletar disciplina e suas dependências/
      )
    })
  })

  describe('associateDiscipline', () => {
    it('should allow a professor to associate with a discipline in their department', async () => {
      const mockContext = createMockContext(mockProfessorUser)
      const caller = disciplineRouter.createCaller(mockContext)

      vi.spyOn(mockContext.db.query.disciplinaTable, 'findFirst').mockResolvedValue({
        id: 1,
        nome: 'Test Discipline',
        codigo: 'T01',
        departamentoId: 1,
        turma: 'T01',
        createdAt: new Date(),
        updatedAt: null,
        deletedAt: null,
      })
      vi.spyOn(mockContext.db.query.disciplinaProfessorResponsavelTable, 'findFirst').mockResolvedValue(undefined)

      const insertReturningMock = { returning: vi.fn().mockResolvedValue([{}]) }
      const valuesMock = { values: vi.fn().mockReturnValue(insertReturningMock) }
      vi.spyOn(mockContext.db, 'insert').mockReturnValue(valuesMock as never)

      const result = await caller.associateDiscipline({ id: 1, ano: 2024, semestre: 'SEMESTRE_1' })
      expect(result.success).toBe(true)
    })

    it('should forbid a professor from associating with a discipline outside their department', async () => {
      const mockContext = createMockContext(mockProfessorUser)
      const caller = disciplineRouter.createCaller(mockContext)

      vi.spyOn(mockContext.db.query.disciplinaTable, 'findFirst').mockResolvedValue({
        id: 1,
        nome: 'Test Discipline',
        codigo: 'T01',
        departamentoId: 2,
        turma: 'T01',
        createdAt: new Date(),
        updatedAt: null,
        deletedAt: null,
      }) // Different departmentId

      await expect(caller.associateDiscipline({ id: 1, ano: 2024, semestre: 'SEMESTRE_1' })).rejects.toThrowError(
        'Você só pode se associar a disciplinas do seu departamento'
      )
    })
  })
})
