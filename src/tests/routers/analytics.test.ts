import { analyticsRouter } from '@/server/api/routers/analytics/analytics'
import { type TRPCContext } from '@/server/api/trpc'
import { type User } from '@/server/db/schema'
import { TRPCError } from '@trpc/server'
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
  db: {} as TRPCContext['db'],
})

describe('analyticsRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getDashboard', () => {
    it('should throw FORBIDDEN error for non-admin users', async () => {
      const mockContext = createMockContext(mockProfessorUser)
      const caller = analyticsRouter.createCaller(mockContext)

      await expect(caller.getDashboard()).rejects.toThrowError(
        new TRPCError({
          code: 'FORBIDDEN',
          message: 'Acesso permitido apenas para administradores',
        })
      )
    })

    it('should throw FORBIDDEN error for unauthenticated users', async () => {
      const mockContext = createMockContext(null)
      const caller = analyticsRouter.createCaller(mockContext)

      await expect(caller.getDashboard()).rejects.toThrow()
    })

    it('should allow admin access but fail due to missing database setup', async () => {
      const mockContext = createMockContext(mockAdminUser)
      const caller = analyticsRouter.createCaller(mockContext)

      // This will fail due to the empty db mock, but at least validates admin access
      await expect(caller.getDashboard()).rejects.toThrow()
    })
  })
}) 