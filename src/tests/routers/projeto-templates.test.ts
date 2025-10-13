import { projetoTemplatesRouter } from '@/server/api/routers/projeto-templates/projeto-templates'
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

const createMockContext = (user: User | null): TRPCContext => ({
  user,
  db: {
    query: {
      projetoTemplateTable: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      disciplinaTable: {
        findMany: vi.fn(),
      },
    },
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
  } as never,
})

describe('projetoTemplatesRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createTemplate', () => {
    it('should throw an error if a template for the discipline already exists', async () => {
      const mockContext = createMockContext(mockAdminUser)
      const caller = projetoTemplatesRouter.createCaller(mockContext)

      vi.spyOn(mockContext.db.query.projetoTemplateTable, 'findFirst').mockResolvedValue({ id: 1 } as never)

      const input = {
        disciplinaId: 1,
        tituloDefault: 'Template Teste',
      }
      await expect(caller.createTemplate(input)).rejects.toThrowError('Já existe um template para esta disciplina')
    })
  })

  describe('getDisciplinasDisponiveis', () => {
    it('should return only disciplines without a template', async () => {
      const mockContext = createMockContext(mockAdminUser)
      const caller = projetoTemplatesRouter.createCaller(mockContext)

      const mockDisciplinas = [
        { id: 1, nome: 'Disciplina com Template' },
        { id: 2, nome: 'Disciplina sem Template' },
      ]
      const mockTemplates = [{ disciplinaId: 1 }]

      vi.spyOn(mockContext.db.query.disciplinaTable, 'findMany').mockResolvedValue(mockDisciplinas as never)
      vi.spyOn(mockContext.db.query.projetoTemplateTable, 'findMany').mockResolvedValue(mockTemplates as never)

      const result = await caller.getDisciplinasDisponiveis()
      expect(result).toHaveLength(1)
      expect(result[0].nome).toBe('Disciplina sem Template')
    })
  })
})
