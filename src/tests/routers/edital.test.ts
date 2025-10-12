import { editalRouter } from '@/server/api/routers/edital'
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
      editalTable: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      periodoInscricaoTable: {
        findFirst: vi.fn(),
      },
      projetoTable: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    },
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
  } as any,
})

describe('editalRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('create', () => {
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
      await expect(caller.create({...input, tipo: 'DCC' as const})).rejects.toThrowError('UNAUTHORIZED')
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
      await expect(caller.create({...input, tipo: 'DCC' as const})).rejects.toThrowError('Este número de edital já está em uso.')
    })
  })

  describe('publish', () => {
    it.skip('should throw BAD_REQUEST if edital is not signed', async () => {
      const mockContext = createMockContext(mockAdminUser)
      const caller = editalRouter.createCaller(mockContext)

      vi.spyOn(mockContext.db.query.editalTable, 'findFirst').mockResolvedValue({
        id: 1,
        titulo: 'Edital Teste',
        descricaoHtml: '<p>Descrição do edital</p>',
        fileIdAssinado: null,
        publicado: false,
        numeroEdital: '001/2024',
        criadoPorUserId: 1,
        createdAt: new Date(),
        updatedAt: null,
        dataPublicacao: null,
        periodoInscricaoId: 1,
      } as any)

      await expect(caller.publish({ id: 1 })).rejects.toThrowError(/precisa ser assinado/)
    })

    it.skip('should publish a signed edital successfully', async () => {
      const mockContext = createMockContext(mockAdminUser)
      const caller = editalRouter.createCaller(mockContext)

      const signedEdital = {
        id: 1,
        titulo: 'Edital Teste',
        descricaoHtml: '<p>Descrição do edital</p>',
        fileIdAssinado: 'signed-file-id',
        fileIdProgradOriginal: null,
        tipo: 'DCC' as const,
        publicado: false,
        numeroEdital: '001/2024',
        valorBolsa: '400.00',
        criadoPorUserId: 1,
        createdAt: new Date(),
        updatedAt: null,
        dataPublicacao: null,
        periodoInscricaoId: 1,
        datasProvasDisponiveis: null,
        dataDivulgacaoResultado: null,
        chefeAssinouEm: null,
        chefeAssinatura: null,
        chefeDepartamentoId: null,
      }

      vi.spyOn(mockContext.db.query.editalTable, 'findFirst')
        .mockResolvedValueOnce(signedEdital as any)
        .mockResolvedValueOnce({ ...signedEdital, periodoInscricao: { id: 1 } } as any)

      // Mock para verificar projetos aprovados
      vi.spyOn(mockContext.db.query.projetoTable, 'findMany').mockResolvedValue([{ id: 1 }] as any)

      vi.spyOn(mockContext.db, 'update').mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([
          {
            ...signedEdital,
            publicado: true,
            chefeAssinouEm: null,
            chefeAssinatura: null,
            chefeDepartamentoId: null,
          },
        ]),
      } as any)

      const result = await caller.publish({ id: 1 })
      expect(result.success).toBe(true)
    })
  })
})
