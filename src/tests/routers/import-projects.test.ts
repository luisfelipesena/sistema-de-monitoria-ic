import { importProjectsRouter } from '@/server/api/routers/import-projects/import-projects'
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
}

const createMockContext = (user: User | null): TRPCContext => ({
  user,
  db: {
    query: {
      professorTable: {
        findFirst: vi.fn(),
      },
      disciplinaTable: {
        findFirst: vi.fn(),
      },
      importacaoPlanejamentoTable: {
        findFirst: vi.fn(),
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

describe('importProjectsRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('processImportedFile', () => {
    it('should successfully import valid projects', async () => {
      const mockContext = createMockContext(mockAdminUser)
      const caller = importProjectsRouter.createCaller(mockContext)

      const mockProfessor = { id: 1, departamentoId: 1 }
      const mockDisciplina = { id: 1 }
      const mockImportacao = { id: 1, ano: 2024, semestre: 'SEMESTRE_1' as const, status: 'PROCESSANDO' }

      vi.spyOn(mockContext.db.query.professorTable, 'findFirst').mockResolvedValue(mockProfessor as any)
      vi.spyOn(mockContext.db.query.disciplinaTable, 'findFirst').mockResolvedValue(mockDisciplina as any)
      vi.spyOn(mockContext.db.query.importacaoPlanejamentoTable, 'findFirst').mockResolvedValue(mockImportacao as any)

      const insertReturningMock = { returning: vi.fn().mockResolvedValue([{ id: 1 }]) }
      const valuesMock = { values: vi.fn().mockReturnValue(insertReturningMock) }
      vi.spyOn(mockContext.db, 'insert').mockReturnValue(valuesMock as any)

      const input = {
        importacaoId: 1,
        projetos: [
          {
            titulo: 'Projeto Válido',
            descricao: 'Descrição',
            professorSiape: '123456',
            disciplinaCodigo: 'MATA01',
            cargaHorariaSemana: 12,
            numeroSemanas: 16,
            publicoAlvo: 'Alunos',
          },
        ],
      }

      const result = await caller.processImportedFile(input)
      expect(result.projetosCriados).toBe(1)
      expect(result.projetosComErro).toBe(0)
    })

    it('should handle partial imports with invalid data', async () => {
      const mockContext = createMockContext(mockAdminUser)
      const caller = importProjectsRouter.createCaller(mockContext)

      const mockProfessor = { id: 1, departamentoId: 1 }
      const mockImportacao = { id: 1, ano: 2024, semestre: 'SEMESTRE_1' as const, status: 'PROCESSANDO' }

      vi.spyOn(mockContext.db.query.professorTable, 'findFirst')
        .mockResolvedValueOnce(mockProfessor as any) // For the valid project
        .mockResolvedValueOnce(undefined) // For the invalid project

      vi.spyOn(mockContext.db.query.disciplinaTable, 'findFirst').mockResolvedValue({ id: 1 } as any)
      vi.spyOn(mockContext.db.query.importacaoPlanejamentoTable, 'findFirst').mockResolvedValue(mockImportacao as any)

      const insertReturningMock = { returning: vi.fn().mockResolvedValue([{ id: 1 }]) }
      const valuesMock = { values: vi.fn().mockReturnValue(insertReturningMock) }
      vi.spyOn(mockContext.db, 'insert').mockReturnValue(valuesMock as any)

      const input = {
        importacaoId: 1,
        projetos: [
          {
            titulo: 'Projeto Válido',
            descricao: 'Descrição',
            professorSiape: '123456',
            disciplinaCodigo: 'MATA01',
            cargaHorariaSemana: 12,
            numeroSemanas: 16,
            publicoAlvo: 'Alunos',
          },
          {
            titulo: 'Projeto Inválido',
            descricao: 'Descrição',
            professorSiape: '999999', // Invalid SIAPE
            disciplinaCodigo: 'MATA02',
            cargaHorariaSemana: 12,
            numeroSemanas: 16,
            publicoAlvo: 'Alunos',
          },
        ],
      }

      const result = await caller.processImportedFile(input)
      expect(result.projetosCriados).toBe(1)
      expect(result.projetosComErro).toBe(1)
      expect(result.erros).toContain('Professor com SIAPE 999999 não encontrado')
    })
  })
})
