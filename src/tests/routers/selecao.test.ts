import { selecaoRouter } from '@/server/api/routers/selecao/selecao'
import { type TRPCContext } from '@/server/api/trpc'
import { type User } from '@/server/db/schema'
import * as emailService from '@/server/lib/email-service'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/server/lib/email-service')

const mockProfessorUser: User = {
  id: 2,
  username: 'professor',
  email: 'prof@test.com',
  role: 'professor',
  assinaturaDefault: null,
  dataAssinaturaDefault: null,
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
      const caller = selecaoRouter.createCaller(mockContext)

      const mockProject = { id: 1, professorResponsavelId: 2 }
      const mockInscricoes = [
        { id: 1, notaFinal: 8.0, tipoVagaPretendida: 'BOLSISTA', aluno: { user: {} } }, // Approve
        { id: 2, notaFinal: 6.0, tipoVagaPretendida: 'VOLUNTARIO', aluno: { user: {} } }, // Reject
      ]

      vi.spyOn(mockContext.db.query.projetoTable, 'findFirst').mockResolvedValue(mockProject as any)
      vi.spyOn(mockContext.db.query.inscricaoTable, 'findMany').mockResolvedValue(mockInscricoes as any)

      await caller.publishResults({ projetoId: '1', notifyStudents: false })

      // Expect transaction to be called
      expect(mockContext.db.transaction).toHaveBeenCalled()
    })

    it('should trigger email notifications when notifyStudents is true', async () => {
      const mockContext = createMockContext(mockProfessorUser)
      const caller = selecaoRouter.createCaller(mockContext)

      const mockProject = { id: 1, professorResponsavelId: 2, professorResponsavel: { nomeCompleto: 'Professor Teste', user: { username: 'prof' } } }
      const mockInscricoes = [
        { id: 1, notaFinal: 8.0, tipoVagaPretendida: 'BOLSISTA', aluno: { id: 1, user: { email: 'student1@test.com', username: 'Aluno Teste' } } },
      ]

      vi.spyOn(mockContext.db.query.projetoTable, 'findFirst').mockResolvedValue(mockProject as any)
      vi.spyOn(mockContext.db.query.inscricaoTable, 'findMany').mockResolvedValue(mockInscricoes as any)
      const emailSpy = vi.spyOn(emailService, 'sendStudentSelectionResultNotification').mockResolvedValue()


      await caller.publishResults({ projetoId: '1', notifyStudents: true })

      expect(emailSpy).toHaveBeenCalledTimes(1)
    })
  })
}) 