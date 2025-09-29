import { importProjectsRouter } from '@/server/api/routers/import-projects/import-projects'
import * as processDCC from '@/server/api/routers/import-projects/process-dcc'
import { type TRPCContext } from '@/server/api/trpc'
import { type User } from '@/server/db/schema'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock do process-dcc inteiro
vi.mock('@/server/api/routers/import-projects/process-dcc', () => ({
  processImportedFileDCC: vi.fn(),
}))

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
}

const createMockContext = (user: User | null): TRPCContext => ({
  user,
  db: {} as any,
})

describe('importProjectsRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('processImportedFileDCC', () => {
    it('should successfully import valid DCC projects', async () => {
      const mockContext = createMockContext(mockAdminUser)
      const caller = importProjectsRouter.createCaller(mockContext)

      // Mock successful processing
      vi.spyOn(processDCC, 'processImportedFileDCC').mockResolvedValue({
        success: true,
        projetosCriados: 1,
        projetosComErro: 0,
        totalProjetos: 1,
        erros: [],
        warnings: [],
      })

      const result = await caller.processImportedFileDCC({ importacaoId: 1 })

      expect(result.success).toBe(true)
      expect(result.projetosCriados).toBe(1)
      expect(result.projetosComErro).toBe(0)
      expect(result.erros).toHaveLength(0)
      expect(processDCC.processImportedFileDCC).toHaveBeenCalledWith(1, mockContext)
    })

    it('should handle professor not found in DCC format', async () => {
      const mockContext = createMockContext(mockAdminUser)
      const caller = importProjectsRouter.createCaller(mockContext)

      // Mock processing with errors
      vi.spyOn(processDCC, 'processImportedFileDCC').mockResolvedValue({
        success: true,
        projetosCriados: 0,
        projetosComErro: 1,
        totalProjetos: 1,
        erros: ['Professor(es) Professor Desconhecido não encontrado(s) para a disciplina MATA01. Projeto não criado.'],
        warnings: [],
      })

      const result = await caller.processImportedFileDCC({ importacaoId: 1 })

      expect(result.success).toBe(true)
      expect(result.projetosCriados).toBe(0)
      expect(result.projetosComErro).toBe(1)
      expect(result.erros.length).toBeGreaterThan(0)
      expect(result.erros.some((e) => e.includes('não encontrado'))).toBe(true)
      expect(processDCC.processImportedFileDCC).toHaveBeenCalledWith(1, mockContext)
    })

    it('should handle partial imports with some valid and some invalid projects', async () => {
      const mockContext = createMockContext(mockAdminUser)
      const caller = importProjectsRouter.createCaller(mockContext)

      // Mock processing with partial success
      vi.spyOn(processDCC, 'processImportedFileDCC').mockResolvedValue({
        success: true,
        projetosCriados: 2,
        projetosComErro: 1,
        totalProjetos: 3,
        erros: ['Disciplina MATA99 (Disciplina Inexistente) não encontrada no sistema. Projeto não criado.'],
        warnings: ['Linha 5: Carga horária não informada. Será usado 0 como padrão.'],
      })

      const result = await caller.processImportedFileDCC({ importacaoId: 1 })

      expect(result.success).toBe(true)
      expect(result.projetosCriados).toBe(2)
      expect(result.projetosComErro).toBe(1)
      expect(result.totalProjetos).toBe(3)
      expect(result.erros).toHaveLength(1)
      expect(result.warnings).toHaveLength(1)
      expect(processDCC.processImportedFileDCC).toHaveBeenCalledWith(1, mockContext)
    })
  })
})