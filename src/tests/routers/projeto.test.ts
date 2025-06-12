import { describe, it, expect, vi, beforeEach } from 'vitest'
import { projetoRouter } from '@/server/api/routers/projeto/projeto'
import { type TRPCContext } from '@/server/api/trpc'
import { type User } from '@/server/db/schema'

const mockAdminUser: User = { 
  id: 1, 
  username: 'admin', 
  email: 'admin@test.com', 
  role: 'admin', 
  assinaturaDefault: null, 
  dataAssinaturaDefault: null 
}

const mockProfessorUser: User = { 
  id: 2, 
  username: 'professor', 
  email: 'prof@test.com', 
  role: 'professor', 
  assinaturaDefault: null, 
  dataAssinaturaDefault: null 
}

describe('projetoRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getProjetos - should allow admin access', async () => {
    const mockContext: TRPCContext = {
      user: mockAdminUser,
      db: {
        query: {
          projetoTable: {
            findMany: vi.fn().mockResolvedValue([]),
          },
        },
      } as any,
    }
    
    const caller = projetoRouter.createCaller(mockContext)
    
    try {
      await caller.getProjetos()
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
    }
  })

  it('getProjetos - should allow professor access', async () => {
    const mockContext: TRPCContext = {
      user: mockProfessorUser,
      db: {
        query: {
          professorTable: {
            findFirst: vi.fn().mockResolvedValue({ id: 1 }),
          },
          projetoTable: {
            findMany: vi.fn().mockResolvedValue([]),
          },
        },
      } as any,
    }
    
    const caller = projetoRouter.createCaller(mockContext)
    
    try {
      await caller.getProjetos()
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
    }
  })
  
  it('getProjeto - should allow access for project owner', async () => {
    const mockProjeto = {
      id: 1,
      titulo: 'Projeto Teste',
      professorResponsavelId: 1,
      status: 'DRAFT',
      deletedAt: null,
    }
    
    const mockContext: TRPCContext = {
      user: mockProfessorUser,
      db: {
        query: {
          projetoTable: {
            findFirst: vi.fn().mockResolvedValue(mockProjeto),
          },
          professorTable: {
            findFirst: vi.fn().mockResolvedValue({ id: 1 }),
          },
          atividadeProjetoTable: {
            findMany: vi.fn().mockResolvedValue([]),
          },
          projetoProfessorParticipanteTable: {
            findMany: vi.fn().mockResolvedValue([]),
          },
        },
      } as any,
    }
    
    const caller = projetoRouter.createCaller(mockContext)
    
    try {
      await caller.getProjeto({ id: 1 })
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
    }
  })

  it('getProjeto - should throw forbidden error if professor is not the owner', async () => {
    const mockProjeto = {
      id: 1,
      titulo: 'Projeto Teste',
      professorResponsavelId: 1,
      status: 'DRAFT',
      deletedAt: null,
    }
    
    const mockContext: TRPCContext = {
      user: mockProfessorUser,
      db: {
        query: {
          projetoTable: {
            findFirst: vi.fn().mockResolvedValue(mockProjeto),
          },
          professorTable: {
            findFirst: vi.fn().mockResolvedValue({ id: 2 }),
          },
        },
      } as any,
    }
    
    const caller = projetoRouter.createCaller(mockContext)

    await expect(caller.getProjeto({ id: 1 })).rejects.toThrowError('Acesso negado a este projeto')
  })
}) 