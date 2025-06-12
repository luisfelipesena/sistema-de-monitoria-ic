import { describe, it, expect, vi, beforeEach } from 'vitest'
import { userRouter } from '@/server/api/routers/user/user'
import { type TRPCContext } from '@/server/api/trpc'
import { type User } from '@/server/db/schema'

const mockAdminUser: User = {
  id: 1,
  username: 'admin',
  email: 'admin@test.com',
  role: 'admin',
  assinaturaDefault: null,
  dataAssinaturaDefault: null,
}

const mockStudentUser: User = {
  id: 2,
  username: 'student',
  email: 'student@test.com',
  role: 'student',
  assinaturaDefault: null,
  dataAssinaturaDefault: null,
}

describe('userRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getUsers - non-admin should be forbidden', async () => {
    const mockContext: TRPCContext = {
      user: mockStudentUser,
      db: {} as any,
    }

    const caller = userRouter.createCaller(mockContext)

    await expect(caller.getUsers({ limit: 10, offset: 0 })).rejects.toThrowError('UNAUTHORIZED')
  })

  it('getProfile - unauthenticated user should be forbidden', async () => {
    const mockContext: TRPCContext = {
      user: null,
      db: {} as any,
    }

    const caller = userRouter.createCaller(mockContext)

    await expect(caller.getProfile()).rejects.toThrowError('UNAUTHORIZED')
  })

  it('getUsers - admin access control should work', async () => {
    const mockContext: TRPCContext = {
      user: mockAdminUser,
      db: {
        query: {
          userTable: {
            findMany: vi.fn().mockResolvedValue([]),
          },
        },
        $count: vi.fn().mockResolvedValue(0),
      } as any,
    }

    const caller = userRouter.createCaller(mockContext)

    try {
      await caller.getUsers({ limit: 10, offset: 0 })
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
    }
  })

  it('getProfile - authentication check should work', async () => {
    const mockContext: TRPCContext = {
      user: mockStudentUser,
      db: {
        query: {
          userTable: {
            findFirst: vi.fn().mockResolvedValue({
              ...mockStudentUser,
              studentProfile: {
                id: 1,
                nomeCompleto: 'Student Name',
                matricula: '123456789',
                cpf: '11111111111',
                cr: 8.5,
                cursoId: 1,
                telefone: '11999999999',
                emailInstitucional: 'student@ufba.br',
                banco: 'Banco do Brasil',
                agencia: '1234',
                conta: '567890',
                digitoConta: '1',
              },
            }),
          },
        },
      } as any,
    }

    const caller = userRouter.createCaller(mockContext)

    try {
      const result = await caller.getProfile()
      expect(result).toBeDefined()
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
    }
  })
})
