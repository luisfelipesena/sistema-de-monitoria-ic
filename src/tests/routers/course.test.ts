import { courseRouter } from '@/server/api/routers/course/course'
import type { Curso, User } from '@/server/db/schema'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockContext } from '../setup'

describe('Course Router', () => {
  const mockUser: User = {
    id: 1,
    username: 'admin',
    email: 'admin@test.com',
    role: 'admin',
    assinaturaDefault: null,
    dataAssinaturaDefault: null,
  }

  const mockCourse: Curso = {
    id: 1,
    nome: 'Computer Science',
    codigo: 12345,
    tipo: 'BACHARELADO',
    modalidade: 'PRESENCIAL',
    duracao: 8,
    departamentoId: 1,
    cargaHoraria: 3200,
    descricao: 'Computer Science course description',
    coordenador: 'Dr. Smith',
    emailCoordenacao: 'coord@example.com',
    status: 'ATIVO',
    createdAt: new Date(),
    updatedAt: null,
  }

  const mockCourses: Curso[] = [mockCourse]

  let mockContext: ReturnType<typeof createMockContext>

  beforeEach(() => {
    vi.clearAllMocks()
    mockContext = createMockContext(mockUser)
  })

  describe('getCourses', () => {
    it('should return all courses', async () => {
      vi.mocked(mockContext.db.query.cursoTable.findMany).mockResolvedValue(mockCourses)

      const caller = courseRouter.createCaller(mockContext)
      const result = await caller.getCourses({ includeStats: false })

      expect(result).toEqual(mockCourses)
      expect(mockContext.db.query.cursoTable.findMany).toHaveBeenCalledWith({
        orderBy: expect.any(Function),
      })
    })
  })

  describe('getCourse', () => {
    it('should return course by id', async () => {
      vi.mocked(mockContext.db.query.cursoTable.findFirst).mockResolvedValue(mockCourse)

      const caller = courseRouter.createCaller(mockContext)
      const result = await caller.getCourse({ id: 1 })

      expect(result).toEqual(mockCourse)
      expect(mockContext.db.query.cursoTable.findFirst).toHaveBeenCalledWith({
        where: expect.any(Object),
      })
    })
  })
})
