import { inscricaoRouter } from '@/server/api/routers/inscricao/inscricao'
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
}

const createMockContext = (user: User | null): TRPCContext => ({
  user,
  db: {
    query: {
      alunoTable: {
        findFirst: vi.fn(),
      },
      projetoTable: {
        findFirst: vi.fn(),
      },
      periodoInscricaoTable: {
        findFirst: vi.fn(),
      },
      inscricaoTable: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    },
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn(),
  } as any,
})

describe('inscricaoRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createInscricao', () => {
    it('should throw FORBIDDEN if a non-student tries to apply', async () => {
      const mockContext = createMockContext({ ...mockStudentUser, role: 'professor' })
      const caller = inscricaoRouter.createCaller(mockContext)
      const input = { projetoId: 1, tipo: 'BOLSISTA' as const, motivacao: 'valid motivation' }
      await expect(caller.createInscricao(input)).rejects.toThrowError(/Acesso permitido apenas para estudantes/)
    })

    it('should throw BAD_REQUEST if the application period is not active', async () => {
      const mockContext = createMockContext(mockStudentUser)
      const caller = inscricaoRouter.createCaller(mockContext)
      vi.spyOn(mockContext.db.query.alunoTable, 'findFirst').mockResolvedValue({ id: 1 } as any)
      vi.spyOn(mockContext.db.query.projetoTable, 'findFirst').mockResolvedValue({ id: 1, status: 'APPROVED' } as any)
      vi.spyOn(mockContext.db.query.periodoInscricaoTable, 'findFirst').mockResolvedValue(undefined)

      await expect(
        caller.createInscricao({ projetoId: 1, tipo: 'BOLSISTA', motivacao: 'valid motivation' })
      ).rejects.toThrowError('Período de inscrições não está ativo')
    })

    it('should create an inscription successfully', async () => {
      const mockContext = createMockContext(mockStudentUser)
      const caller = inscricaoRouter.createCaller(mockContext)
      vi.spyOn(mockContext.db.query.alunoTable, 'findFirst').mockResolvedValue({ id: 1, cr: 8.5 } as any)
      vi.spyOn(mockContext.db.query.projetoTable, 'findFirst').mockResolvedValue({ 
        id: 1, 
        status: 'APPROVED',
        bolsasDisponibilizadas: 2,
        voluntariosSolicitados: 1,
        ano: 2024,
        semestre: 'SEMESTRE_1'
      } as any)
      vi.spyOn(mockContext.db.query.periodoInscricaoTable, 'findFirst').mockResolvedValue({ id: 1 } as any)
      vi.spyOn(mockContext.db.query.inscricaoTable, 'findFirst').mockResolvedValue(undefined)
      const insertMock = { returning: vi.fn().mockResolvedValue([{ id: 123 }]) }
      const valuesMock = { values: vi.fn().mockReturnValue(insertMock) }
      vi.spyOn(mockContext.db, 'insert').mockReturnValue(valuesMock as any)

      const result = await caller.createInscricao({ projetoId: 1, tipo: 'BOLSISTA', motivacao: 'My valid motivation' })
      expect(result.success).toBe(true)
      expect(result.inscricaoId).toBe(123)
    })
  })

  describe('acceptPosition', () => {
    it('should throw BAD_REQUEST if trying to accept a scholarship when another is already accepted', async () => {
      const mockContext = createMockContext(mockStudentUser)
      const caller = inscricaoRouter.createCaller(mockContext)
      const currentSemesterProject = { ano: 2024, semestre: 'SEMESTRE_1' }

      vi.spyOn(mockContext.db.query.alunoTable, 'findFirst').mockResolvedValue({ id: 1 } as any)
      vi.spyOn(mockContext.db.query.inscricaoTable, 'findFirst')
        // For the inscription being accepted
        .mockResolvedValueOnce({
          id: 1,
          status: 'SELECTED_BOLSISTA',
          alunoId: 1,
          projeto: currentSemesterProject,
        } as any)
        // For the check of existing scholarships
        .mockResolvedValueOnce({
          id: 2,
          status: 'ACCEPTED_BOLSISTA',
          alunoId: 1,
          projeto: currentSemesterProject,
        } as any)

      await expect(caller.acceptPosition({ inscricaoId: 1 })).rejects.toThrowError(
        /Você já possui uma bolsa neste semestr/
      )
    })
  })
})
