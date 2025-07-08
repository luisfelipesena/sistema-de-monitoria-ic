import { termosRouter } from '@/server/api/routers/termos/termos'
import { type TRPCContext } from '@/server/api/trpc'
import { type User } from '@/server/db/schema'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockDb = vi.mocked(await import('@/server/db')).db

const mockProfessorUser: User = {
  id: 2,
  username: 'professor',
  email: 'prof@test.com',
  role: 'professor',
  assinaturaDefault: null,
  dataAssinaturaDefault: null,
}

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
  db: mockDb,
})

describe('termosRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('signTermo', () => {
    it('should forbid a student from signing a term for a vaga they do not own', async () => {
      const mockContext = createMockContext(mockStudentUser)
      const caller = termosRouter.createCaller(mockContext)

      const mockVaga = {
        id: 1,
        aluno: { userId: 999 }, // Different user ID
        projeto: {
          professorResponsavelId: 1,
          ano: 2024,
          semestre: 'SEMESTRE_1',
        },
      }
      vi.mocked(mockDb.query.vagaTable.findFirst).mockResolvedValue(mockVaga as any)
      vi.mocked(mockDb.query.assinaturaDocumentoTable.findFirst).mockResolvedValue(undefined)

      const input = {
        vagaId: '1',
        assinaturaData: 'base64-signature-data',
        tipoAssinatura: 'TERMO_COMPROMISSO_ALUNO' as const,
      }

      await expect(caller.signTermo(input)).rejects.toThrowError(/Apenas o aluno pode assinar como alun/)
    })

    it('should throw an error if the document is already signed', async () => {
      const mockContext = createMockContext(mockStudentUser)
      const caller = termosRouter.createCaller(mockContext)

      const mockVaga = {
        id: 1,
        aluno: { userId: mockStudentUser.id },
        projeto: {
          professorResponsavelId: 2,
          ano: 2024,
          semestre: 'SEMESTRE_1',
        },
      }
      const mockSignature = { tipoAssinatura: 'TERMO_COMPROMISSO_ALUNO' }

      vi.mocked(mockDb.query.vagaTable.findFirst).mockResolvedValue(mockVaga as any)
      vi.mocked(mockDb.query.assinaturaDocumentoTable.findFirst).mockResolvedValue(mockSignature as any)

      const input = {
        vagaId: '1',
        assinaturaData: 'base64-signature-data',
        tipoAssinatura: 'TERMO_COMPROMISSO_ALUNO' as const,
      }

      await expect(caller.signTermo(input)).rejects.toThrowError(/Este documento já foi assinado por voc/)
    })
  })

  describe('validateTermoReady', () => {
    it('should return pendencias if signatures are missing', async () => {
      const mockContext = createMockContext(mockProfessorUser)
      const caller = termosRouter.createCaller(mockContext)

      const mockVaga = {
        id: 1,
        aluno: { userId: 3, user: { username: 'student' } },
        projeto: {
          professorResponsavelId: 2,
          professorResponsavel: { user: { username: 'professor' } },
        },
      }
      vi.mocked(mockDb.query.vagaTable.findFirst).mockResolvedValue(mockVaga as any)
      // Mock that only the professor has signed
      vi.mocked(mockDb.query.assinaturaDocumentoTable.findMany).mockResolvedValue([
        { tipoAssinatura: 'ATA_SELECAO_PROFESSOR' },
      ] as any)

      const result = await caller.validateTermoReady({ vagaId: '1' })
      expect(result.termoCompleto).toBe(false)
      expect(result.pendencias).toContain('Assinatura do aluno')
      expect(result.pendencias).not.toContain('Assinatura do professor responsável')
    })

    it('should return termoCompleto: true if both signatures are present', async () => {
      const mockContext = createMockContext(mockProfessorUser)
      const caller = termosRouter.createCaller(mockContext)

      const mockVaga = {
        id: 1,
        aluno: { userId: 3, user: { username: 'student' } },
        projeto: {
          professorResponsavelId: 2,
          professorResponsavel: { user: { username: 'professor' } },
        },
      }
      vi.mocked(mockDb.query.vagaTable.findFirst).mockResolvedValue(mockVaga as any)
      // Mock that both parties have signed
      vi.mocked(mockDb.query.assinaturaDocumentoTable.findMany).mockResolvedValue([
        { tipoAssinatura: 'ATA_SELECAO_PROFESSOR' },
        { tipoAssinatura: 'TERMO_COMPROMISSO_ALUNO' },
      ] as any)

      const result = await caller.validateTermoReady({ vagaId: '1' })
      expect(result.termoCompleto).toBe(true)
      expect(result.pendencias).toHaveLength(0)
    })
  })
})
