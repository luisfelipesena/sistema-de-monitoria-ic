import { editalRouter } from '@/server/api/routers/edital/edital'
import { type TRPCContext } from '@/server/api/trpc'
import { type User } from '@/server/db/schema'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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
    // biome-ignore lint/suspicious/noExplicitAny: Mock complexo de teste
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
        dataInicioInscricao: new Date('2024-01-01'),
        dataFimInscricao: new Date('2024-01-31'),
      }
      await expect(caller.createEdital(input)).rejects.toThrowError('Acesso restrito a administradores')
    })

    it('should throw CONFLICT error if edital number already exists', async () => {
      const mockContext = createMockContext(mockAdminUser)
      const caller = editalRouter.createCaller(mockContext)

      // biome-ignore lint/suspicious/noExplicitAny: Mock complexo de teste
      vi.spyOn(mockContext.db.query.editalTable, 'findFirst').mockResolvedValue({ id: 1 } as any)

      const input = {
        numeroEdital: '001/2024',
        titulo: 'Edital Teste',
        ano: 2024,
        semestre: 'SEMESTRE_1' as const,
        dataInicioInscricao: new Date('2024-01-01'),
        dataFimInscricao: new Date('2024-01-31'),
      }
      await expect(caller.createEdital(input)).rejects.toThrowError('Este número de edital já está em uso.')
    })

    it('should reject selection dates that start before the registration period ends', async () => {
      const mockContext = createMockContext(mockAdminUser)
      const caller = editalRouter.createCaller(mockContext)

      vi.spyOn(mockContext.db.query.editalTable, 'findFirst').mockResolvedValue(undefined)

      const input = {
        numeroEdital: '001/2024',
        titulo: 'Edital Teste',
        ano: 2024,
        semestre: 'SEMESTRE_1' as const,
        dataInicioInscricao: new Date('2024-01-01'),
        dataFimInscricao: new Date('2024-01-31'),
        dataInicioSelecao: new Date('2024-01-20'),
        dataFimSelecao: new Date('2024-01-25'),
      }

      await expect(caller.createEdital(input)).rejects.toThrowError(
        'A data de início da seleção deve ser posterior ao fim da inscrição'
      )
    })
  })

  describe('publishEdital', () => {
    it('should throw BAD_REQUEST if edital is not signed', async () => {
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
        // biome-ignore lint/suspicious/noExplicitAny: Mock complexo de teste
      } as any)

      await expect(caller.publishEdital({ id: 1 })).rejects.toThrowError(/O edital precisa estar assinado/)
    })

    it('should publish a signed edital successfully', async () => {
      const mockContext = createMockContext(mockAdminUser)
      const caller = editalRouter.createCaller(mockContext)

      const signedEdital = {
        id: 1,
        titulo: 'Edital Teste',
        descricaoHtml: '<p>Descrição do edital</p>',
        fileIdAssinado: 'signed-file-id',
        fileIdPdfExterno: null,
        tipo: 'DCC' as const,
        publicado: false,
        numeroEdital: '001/2024',
        valorBolsa: '400.00',
        criadoPorUserId: 1,
        createdAt: new Date(),
        updatedAt: null,
        dataPublicacao: null,
        periodoInscricaoId: 1,
        dataInicioSelecao: null,
        dataFimSelecao: null,
        datasProvasDisponiveis: null,
        dataDivulgacaoResultado: null,
        linkFormularioInscricao: null,
        chefeAssinouEm: null,
        chefeAssinatura: null,
        chefeDepartamentoId: null,
      }

      vi.spyOn(mockContext.db.query.editalTable, 'findFirst')
        .mockResolvedValueOnce(signedEdital as any)
        // biome-ignore lint/suspicious/noExplicitAny: Mock complexo de teste
        .mockResolvedValueOnce({ ...signedEdital, periodoInscricao: { id: 1 } } as any)

      // Mock para verificar projetos aprovados
      // biome-ignore lint/suspicious/noExplicitAny: Mock complexo de teste
      vi.spyOn(mockContext.db.query.projetoTable, 'findMany').mockResolvedValue([{ id: 1 }] as any)

      vi.spyOn(mockContext.db, 'update').mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([
          {
            ...signedEdital,
            publicado: true,
          },
        ]),
        // biome-ignore lint/suspicious/noExplicitAny: Mock complexo de teste
      } as any)

      const result = await caller.publishEdital({ id: 1 })
      expect(result.publicado).toBe(true)
    })
  })

  describe('updateEdital', () => {
    it('should reject selection start dates before the registration period ends', async () => {
      const mockContext = createMockContext(mockAdminUser)
      const caller = editalRouter.createCaller(mockContext)

      vi.spyOn(mockContext.db.query.editalTable, 'findFirst').mockResolvedValue({
        id: 1,
        titulo: 'Edital Teste',
        descricaoHtml: '<p>Descrição do edital</p>',
        fileIdAssinado: 'signed-file-id',
        fileIdPdfExterno: null,
        tipo: 'DCC' as const,
        publicado: false,
        numeroEdital: '001/2024',
        valorBolsa: '400.00',
        criadoPorUserId: 1,
        createdAt: new Date(),
        updatedAt: null,
        dataPublicacao: null,
        periodoInscricaoId: 1,
        dataInicioSelecao: null,
        dataFimSelecao: null,
        datasProvasDisponiveis: null,
        dataDivulgacaoResultado: null,
        linkFormularioInscricao: null,
        chefeAssinouEm: null,
        chefeAssinatura: null,
        chefeDepartamentoId: null,
        periodoInscricao: {
          id: 1,
          createdAt: new Date(),
          updatedAt: null,
          ano: 2024,
          semestre: 'SEMESTRE_1' as const,
          dataInicio: new Date('2024-01-01'),
          dataFim: new Date('2024-01-31'),
          totalBolsasPrograd: null,
          numeroEditalPrograd: null,
          status: 'ATIVO' as const,
          totalProjetos: 0,
          totalInscricoes: 0,
        },
        criadoPor: {
          id: 1,
          username: 'admin',
          email: 'admin@test.com',
        },
      } as any)

      await expect(
        caller.updateEdital({
          id: 1,
          dataInicioSelecao: new Date('2024-01-20'),
          dataFimSelecao: new Date('2024-02-05'),
        })
      ).rejects.toThrowError('A data de início da seleção deve ser posterior ao fim da inscrição')
    })

    it('should reject result disclosure dates before the selection ends', async () => {
      const mockContext = createMockContext(mockAdminUser)
      const caller = editalRouter.createCaller(mockContext)

      vi.spyOn(mockContext.db.query.editalTable, 'findFirst').mockResolvedValue({
        id: 1,
        titulo: 'Edital Teste',
        descricaoHtml: '<p>Descrição do edital</p>',
        fileIdAssinado: 'signed-file-id',
        fileIdPdfExterno: null,
        tipo: 'DCC' as const,
        publicado: false,
        numeroEdital: '001/2024',
        valorBolsa: '400.00',
        criadoPorUserId: 1,
        createdAt: new Date(),
        updatedAt: null,
        dataPublicacao: null,
        periodoInscricaoId: 1,
        dataInicioSelecao: new Date('2024-03-01'),
        dataFimSelecao: new Date('2024-03-10'),
        datasProvasDisponiveis: null,
        dataDivulgacaoResultado: null,
        linkFormularioInscricao: null,
        chefeAssinouEm: null,
        chefeAssinatura: null,
        chefeDepartamentoId: null,
        periodoInscricao: {
          id: 1,
          createdAt: new Date(),
          updatedAt: null,
          ano: 2024,
          semestre: 'SEMESTRE_1' as const,
          dataInicio: new Date('2024-01-01'),
          dataFim: new Date('2024-01-31'),
          totalBolsasPrograd: null,
          numeroEditalPrograd: null,
          status: 'ATIVO' as const,
          totalProjetos: 0,
          totalInscricoes: 0,
        },
        criadoPor: {
          id: 1,
          username: 'admin',
          email: 'admin@test.com',
        },
      } as any)

      await expect(
        caller.updateEdital({
          id: 1,
          dataDivulgacaoResultado: new Date('2024-03-05'),
        })
      ).rejects.toThrowError(
        'A data de divulgação dos resultados deve ser posterior ou igual ao fim da seleção'
      )
    })
  })
})
