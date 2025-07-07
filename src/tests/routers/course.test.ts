import { courseRouter } from '@/server/api/routers/course/course'
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
      cursoTable: {
        findMany: vi.fn(),
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

describe('courseRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getCourses', () => {
    it('should retrieve a list of courses', async () => {
      const mockContext = createMockContext(mockAdminUser)
      const caller = courseRouter.createCaller(mockContext)

      const mockCourses = [
        { id: 1, nome: 'Ciência da Computação', codigo: 123, tipo: 'BACHARELADO', modalidade: 'PRESENCIAL', duracao: 8, departamentoId: 1, cargaHoraria: 3000, status: 'ATIVO', createdAt: new Date(), updatedAt: null, descricao: null, coordenador: null, emailCoordenacao: null },
      ]
      vi.spyOn(mockContext.db.query.cursoTable, 'findMany').mockResolvedValue(mockCourses as any)

      const result = await caller.getCourses({ includeStats: false })
      expect(result).toHaveLength(1)
      expect(result[0].nome).toBe('Ciência da Computação')
    })
  })

  describe('createCourse', () => {
    it('should forbid a non-admin from creating a course', async () => {
      const mockContext = createMockContext(mockProfessorUser)
      const caller = courseRouter.createCaller(mockContext)

      const input = {
        nome: 'New Course',
        codigo: 101,
        tipo: 'BACHARELADO' as const,
        modalidade: 'PRESENCIAL' as const,
        duracao: 8,
        departamentoId: 1,
        cargaHoraria: 3000,
      }
      // This procedure is admin-only, and should throw UNAUTHORIZED
      await expect(caller.createCourse(input)).rejects.toThrow()
    })
  })

  describe('updateCourse', () => {
    it('should allow an admin to update a course', async () => {
      const mockContext = createMockContext(mockAdminUser)
      const caller = courseRouter.createCaller(mockContext)

      const input = { id: 1, nome: 'Updated Course Name' }
      vi.spyOn(mockContext.db, 'update').mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ ...input, codigo: 123, tipo: 'BACHARELADO', modalidade: 'PRESENCIAL', duracao: 8, departamentoId: 1, cargaHoraria: 3000, status: 'ATIVO', createdAt: new Date(), updatedAt: new Date(), descricao: null, coordenador: null, emailCoordenacao: null }]),
      } as any)

      const result = await caller.updateCourse(input)
      expect(result.nome).toBe('Updated Course Name')
    })
  })

  describe('deleteCourse', () => {
    it('should forbid a non-admin from deleting a course', async () => {
      const mockContext = createMockContext(mockProfessorUser)
      const caller = courseRouter.createCaller(mockContext)

      await expect(caller.deleteCourse({ id: 1 })).rejects.toThrow()
    })
  })
}) 