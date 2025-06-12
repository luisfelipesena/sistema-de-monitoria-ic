import { describe, it, expect, vi } from 'vitest'
import { departamentoRouter } from '@/server/api/routers/departamento/departamento'
import { type TRPCContext } from '@/server/api/trpc'
import { type User } from '@/server/db/schema'

const mockUserAdmin: User = { id: 1, username: 'admin', email: 'admin@test.com', role: 'admin', assinaturaDefault: null, dataAssinaturaDefault: null }
const mockUserProfessor: User = { id: 2, username: 'professor', email: 'prof@test.com', role: 'professor', assinaturaDefault: null, dataAssinaturaDefault: null }

// Mock the context
const createMockContext = (user: User | null): TRPCContext => ({
  user,
  db: {
    query: {
      departamentoTable: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      // Mock other tables as needed
    },
    insert: vi.fn(() => ({
      values: vi.fn().mockReturnThis(),
      returning: vi.fn(),
    })),
    update: vi.fn(() => ({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn(),
    })),
    delete: vi.fn(() => ({
      where: vi.fn().mockReturnThis(),
    })),
  } as any,
})

describe('departamentoRouter', () => {
  it('getDepartamentos - should retrieve all departments', async () => {
    const mockContext = createMockContext(mockUserAdmin)
    
    const mockDepartamentos = [
      { id: 1, nome: 'Ciência da Computação', sigla: 'DCC', unidadeUniversitaria: 'UFBA', createdAt: new Date(), updatedAt: null },
      { id: 2, nome: 'Matemática', sigla: 'MAT', unidadeUniversitaria: 'UFBA', createdAt: new Date(), updatedAt: null },
    ]
    
    vi.spyOn(mockContext.db.query.departamentoTable, 'findMany').mockResolvedValue(mockDepartamentos as any)

    const caller = departamentoRouter.createCaller(mockContext)
    const result = await caller.getDepartamentos({ includeStats: false })

    expect(result).toHaveLength(2)
    expect(result[0].nome).toBe('Ciência da Computação')
    expect(mockContext.db.query.departamentoTable.findMany).toHaveBeenCalledTimes(1)
  })

  it('createDepartamento - should require admin role', async () => {
    const mockContext = createMockContext(mockUserProfessor)

    const caller = departamentoRouter.createCaller(mockContext)

    await expect(caller.createDepartamento({
      nome: 'Novo Dept',
      sigla: 'ND',
      unidadeUniversitaria: 'UFBA',
    })).rejects.toThrowError('UNAUTHORIZED')
  })
  
  it('createDepartamento - admin should be able to create a department', async () => {
    const mockContext = createMockContext(mockUserAdmin)
    
    const newDept = { id: 3, nome: 'Física', sigla: 'FIS', unidadeUniversitaria: 'UFBA', createdAt: new Date(), updatedAt: null }
    
    vi.spyOn(mockContext.db, 'insert').mockReturnValue({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([newDept]),
    } as any)

    const caller = departamentoRouter.createCaller(mockContext)
    const result = await caller.createDepartamento({
      nome: 'Física',
      sigla: 'FIS',
      unidadeUniversitaria: 'UFBA',
    })

    expect(result).toBeDefined()
    expect(result.nome).toBe('Física')
    expect(mockContext.db.insert).toHaveBeenCalledTimes(1)
  })
}) 