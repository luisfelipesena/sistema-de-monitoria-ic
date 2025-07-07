import { editalRouter } from '@/server/api/routers/edital/edital'
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

const mockProfessorUser: User = {
  id: 2,
  username: 'professor',
  email: 'prof@test.com',
  role: 'professor',
  assinaturaDefault: null,
  dataAssinaturaDefault: null,
}

const createMockContext = (user: User | null): TRPCContext => ({
  user,
  db: {
    query: {
      editalTable: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      periodoInscricaoTable: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn(),
  } as any,
})

describe('editalRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createEdital', () => {
    it('should throw FORBIDDEN error for non-admin users', async () => {
      const mockContext = createMockContext(mockProfessorUser)
      const caller = editalRouter.createCaller(mockContext)

      const input = {
        numeroEdital: '001/2024',
        titulo: 'Edital Teste',
        ano: 2024,
        semestre: 'SEMESTRE_1' as const,
        dataInicio: new Date('2024-01-01'),
        dataFim: new Date('2024-01-31'),
      }
      await expect(caller.createEdital(input)).rejects.toThrowError('UNAUTHORIZED')
    })

    it('should throw CONFLICT error if edital number already exists', async () => {
      const mockContext = createMockContext(mockAdminUser)
      const caller = editalRouter.createCaller(mockContext)

      vi.spyOn(mockContext.db.query.editalTable, 'findFirst').mockResolvedValue({ id: 1 } as any)

      const input = {
        numeroEdital: '001/2024',
        titulo: 'Edital Teste',
        ano: 2024,
        semestre: 'SEMESTRE_1' as const,
        dataInicio: new Date('2024-01-01'),
        dataFim: new Date('2024-01-31'),
      }
      await expect(caller.createEdital(input)).rejects.toThrowError('Este número de edital já está em uso.')
    })
  })

  describe('publishEdital', () => {
    it('should throw BAD_REQUEST if edital is not signed', async () => {
      const mockContext = createMockContext(mockAdminUser)
      const caller = editalRouter.createCaller(mockContext)

      vi.spyOn(mockContext.db.query.editalTable, 'findFirst').mockResolvedValue({ id: 1, fileIdAssinado: null } as any)

      await expect(caller.publishEdital({ id: 1 })).rejects.toThrowError(/O edital precisa estar assinado/)
    })

    it('should publish a signed edital successfully', async () => {
      const mockContext = createMockContext(mockAdminUser)
      const caller = editalRouter.createCaller(mockContext)

      const signedEdital = { id: 1, fileIdAssinado: 'signed-file-id', publicado: false, numeroEdital: '001/2024', titulo: 'Edital', criadoPorUserId: 1, createdAt: new Date(), updatedAt: null, descricaoHtml: null, dataPublicacao: null, periodoInscricaoId: 1 }
      vi.spyOn(mockContext.db.query.editalTable, 'findFirst').mockResolvedValue(signedEdital as any)
      vi.spyOn(mockContext.db, 'update').mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ ...signedEdital, publicado: true }])
      } as any)

      const result = await caller.publishEdital({ id: 1 })
      expect(result.publicado).toBe(true)
    })
  })
}) 