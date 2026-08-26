import { scholarshipAllocationRouter } from '@/server/api/routers/scholarship-allocation/scholarship-allocation'
import { type TRPCContext } from '@/server/api/trpc'
import { type User } from '@/server/db/schema'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockScholarshipAllocationServiceMethods = {
  getApprovedProjects: vi.fn(),
  updateScholarshipAllocation: vi.fn(),
  bulkUpdateAllocations: vi.fn(),
  getAllocationSummary: vi.fn(),
  getCandidatesForProject: vi.fn(),
  allocateScholarshipToCandidate: vi.fn(),
  setTotalScholarshipsFromPrograd: vi.fn(),
  getTotalProgradScholarships: vi.fn(),
}

const mockScholarshipAllocationNotifierMethods = {
  notifyProfessorsAfterAllocation: vi.fn(),
}

vi.mock('@/server/services/scholarship-allocation/scholarship-allocation-service', () => ({
  createScholarshipAllocationService: vi.fn(() => mockScholarshipAllocationServiceMethods),
}))

vi.mock('@/server/services/scholarship-allocation/scholarship-allocation-notifier', () => ({
  createScholarshipAllocationNotifier: vi.fn(() => mockScholarshipAllocationNotifierMethods),
}))

const mockStudentUser: User = {
  id: 3,
  username: 'student_test',
  email: 'student@test.com',
  role: 'student',
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

const createMockContext = (user: User | null): TRPCContext => {
  const mockTx = {
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
  }
  return {
    user,
    db: {
      query: {},
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      transaction: vi.fn(async (callback) => await callback(mockTx)),
    } as any,
  }
}

describe('scholarshipAllocationRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getApprovedProjects', () => {
    it('should allow admin to get approved projects', async () => {
      const mockContext = createMockContext(mockAdminUser)

      mockScholarshipAllocationServiceMethods.getApprovedProjects.mockResolvedValue([
        { id: 1, nome: 'Projeto A', bolsasDisponibilizadas: 2 },
        { id: 2, nome: 'Projeto B', bolsasDisponibilizadas: 1 },
      ])

      const caller = scholarshipAllocationRouter.createCaller(mockContext)
      const result = await caller.getApprovedProjects({ ano: 2024, semestre: 'SEMESTRE_1' })

      expect(result).toBeDefined()
      expect(result).toHaveLength(2)
      expect(mockScholarshipAllocationServiceMethods.getApprovedProjects).toHaveBeenCalledWith(2024, 'SEMESTRE_1')
    })

    it('should reject unauthenticated user', async () => {
      const mockContext = createMockContext(null)
      const caller = scholarshipAllocationRouter.createCaller(mockContext)

      await expect(caller.getApprovedProjects({ ano: 2024, semestre: 'SEMESTRE_1' })).rejects.toThrow()
    })

    it('should reject non-admin user (student)', async () => {
      const mockContext = createMockContext(mockStudentUser)
      const caller = scholarshipAllocationRouter.createCaller(mockContext)

      await expect(caller.getApprovedProjects({ ano: 2024, semestre: 'SEMESTRE_1' })).rejects.toThrow()
    })

    it('should reject non-admin user (professor)', async () => {
      const mockContext = createMockContext(mockProfessorUser)
      const caller = scholarshipAllocationRouter.createCaller(mockContext)

      await expect(caller.getApprovedProjects({ ano: 2024, semestre: 'SEMESTRE_1' })).rejects.toThrow()
    })
  })

  describe('updateScholarshipAllocation', () => {
    it('should allow admin to update allocation', async () => {
      const mockContext = createMockContext(mockAdminUser)

      mockScholarshipAllocationServiceMethods.updateScholarshipAllocation.mockResolvedValue({
        success: true,
        projetoId: 1,
        bolsasDisponibilizadas: 3,
      })

      const caller = scholarshipAllocationRouter.createCaller(mockContext)
      const result = await caller.updateScholarshipAllocation({
        projetoId: 1,
        bolsasDisponibilizadas: 3,
      })

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(mockScholarshipAllocationServiceMethods.updateScholarshipAllocation).toHaveBeenCalledWith(1, 3)
    })

    it('should reject unauthenticated user', async () => {
      const mockContext = createMockContext(null)
      const caller = scholarshipAllocationRouter.createCaller(mockContext)

      await expect(caller.updateScholarshipAllocation({ projetoId: 1, bolsasDisponibilizadas: 3 })).rejects.toThrow()
    })

    it('should reject non-admin user', async () => {
      const mockContext = createMockContext(mockProfessorUser)
      const caller = scholarshipAllocationRouter.createCaller(mockContext)

      await expect(caller.updateScholarshipAllocation({ projetoId: 1, bolsasDisponibilizadas: 3 })).rejects.toThrow()
    })
  })

  describe('bulkUpdateAllocations', () => {
    it('should allow admin to bulk update allocations', async () => {
      const mockContext = createMockContext(mockAdminUser)

      mockScholarshipAllocationServiceMethods.bulkUpdateAllocations.mockResolvedValue({
        success: true,
        updatedCount: 2,
      })

      const caller = scholarshipAllocationRouter.createCaller(mockContext)
      const result = await caller.bulkUpdateAllocations({
        allocations: [
          { projetoId: 1, bolsasDisponibilizadas: 2 },
          { projetoId: 2, bolsasDisponibilizadas: 1 },
        ],
      })

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(mockScholarshipAllocationServiceMethods.bulkUpdateAllocations).toHaveBeenCalledWith([
        { projetoId: 1, bolsasDisponibilizadas: 2 },
        { projetoId: 2, bolsasDisponibilizadas: 1 },
      ])
    })

    it('should reject unauthenticated user', async () => {
      const mockContext = createMockContext(null)
      const caller = scholarshipAllocationRouter.createCaller(mockContext)

      await expect(
        caller.bulkUpdateAllocations({
          allocations: [{ projetoId: 1, bolsasDisponibilizadas: 2 }],
        })
      ).rejects.toThrow()
    })

    it('should reject non-admin user', async () => {
      const mockContext = createMockContext(mockStudentUser)
      const caller = scholarshipAllocationRouter.createCaller(mockContext)

      await expect(
        caller.bulkUpdateAllocations({
          allocations: [{ projetoId: 1, bolsasDisponibilizadas: 2 }],
        })
      ).rejects.toThrow()
    })
  })

  describe('getAllocationSummary', () => {
    it('should allow admin to get allocation summary', async () => {
      const mockContext = createMockContext(mockAdminUser)

      mockScholarshipAllocationServiceMethods.getAllocationSummary.mockResolvedValue({
        totalBolsas: 10,
        bolsasAlocadas: 7,
        bolsasDisponiveis: 3,
      })

      const caller = scholarshipAllocationRouter.createCaller(mockContext)
      const result = await caller.getAllocationSummary({ ano: 2024, semestre: 'SEMESTRE_1' })

      expect(result).toBeDefined()
      expect((result as any).totalBolsas).toBe(10)
      expect(mockScholarshipAllocationServiceMethods.getAllocationSummary).toHaveBeenCalledWith(2024, 'SEMESTRE_1')
    })

    it('should reject unauthenticated user', async () => {
      const mockContext = createMockContext(null)
      const caller = scholarshipAllocationRouter.createCaller(mockContext)

      await expect(caller.getAllocationSummary({ ano: 2024, semestre: 'SEMESTRE_1' })).rejects.toThrow()
    })
  })

  describe('setTotalScholarshipsFromPrograd', () => {
    it('should allow admin to set total scholarships', async () => {
      const mockContext = createMockContext(mockAdminUser)

      mockScholarshipAllocationServiceMethods.setTotalScholarshipsFromPrograd.mockResolvedValue({
        success: true,
        totalBolsas: 50,
      })

      const caller = scholarshipAllocationRouter.createCaller(mockContext)
      const result = await caller.setTotalScholarshipsFromPrograd({
        ano: 2024,
        semestre: 'SEMESTRE_1',
        totalBolsas: 50,
      })

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect((result as any).totalBolsas).toBe(50)
      expect(mockScholarshipAllocationServiceMethods.setTotalScholarshipsFromPrograd).toHaveBeenCalledWith(
        2024,
        'SEMESTRE_1',
        50
      )
    })

    it('should reject unauthenticated user', async () => {
      const mockContext = createMockContext(null)
      const caller = scholarshipAllocationRouter.createCaller(mockContext)

      await expect(
        caller.setTotalScholarshipsFromPrograd({ ano: 2024, semestre: 'SEMESTRE_1', totalBolsas: 50 })
      ).rejects.toThrow()
    })

    it('should reject non-admin user', async () => {
      const mockContext = createMockContext(mockProfessorUser)
      const caller = scholarshipAllocationRouter.createCaller(mockContext)

      await expect(
        caller.setTotalScholarshipsFromPrograd({ ano: 2024, semestre: 'SEMESTRE_1', totalBolsas: 50 })
      ).rejects.toThrow()
    })
  })

  describe('notifyProfessorsAfterAllocation', () => {
    it('should allow admin to notify professors', async () => {
      const mockContext = createMockContext(mockAdminUser)

      mockScholarshipAllocationNotifierMethods.notifyProfessorsAfterAllocation.mockResolvedValue({
        success: true,
        notifiedCount: 5,
      })

      const caller = scholarshipAllocationRouter.createCaller(mockContext)
      const result = await caller.notifyProfessorsAfterAllocation({ ano: 2024, semestre: 'SEMESTRE_1' })

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(mockScholarshipAllocationNotifierMethods.notifyProfessorsAfterAllocation).toHaveBeenCalledWith(
        2024,
        'SEMESTRE_1'
      )
    })

    it('should reject unauthenticated user', async () => {
      const mockContext = createMockContext(null)
      const caller = scholarshipAllocationRouter.createCaller(mockContext)

      await expect(caller.notifyProfessorsAfterAllocation({ ano: 2024, semestre: 'SEMESTRE_1' })).rejects.toThrow()
    })

    it('should reject non-admin user', async () => {
      const mockContext = createMockContext(mockStudentUser)
      const caller = scholarshipAllocationRouter.createCaller(mockContext)

      await expect(caller.notifyProfessorsAfterAllocation({ ano: 2024, semestre: 'SEMESTRE_1' })).rejects.toThrow()
    })
  })
})
