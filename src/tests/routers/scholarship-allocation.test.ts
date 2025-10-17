import { scholarshipAllocationRouter } from '@/server/api/routers/scholarship-allocation/scholarship-allocation'
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
  passwordHash: null,
  emailVerifiedAt: null,
  verificationToken: null,
  verificationTokenExpiresAt: null,
  passwordResetToken: null,
  passwordResetExpiresAt: null,
}

const mockNonAdminUser: User = {
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

describe('scholarshipAllocationRouter - updateScholarshipAllocation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should allow allocation within PROGRAD limit', async () => {
    const mockProjeto = {
      id: 1,
      titulo: 'Projeto 1',
      ano: 2025,
      semestre: 'SEMESTRE_1',
      bolsasDisponibilizadas: 5,
      status: 'APPROVED',
    }

    const mockPeriodo = {
      id: 1,
      ano: 2025,
      semestre: 'SEMESTRE_1',
      totalBolsasPrograd: 100,
    }

    const mockSummary = [{ totalBolsasDisponibilizadas: '50' }]

    const mockUpdate = vi.fn().mockReturnThis()
    const mockSet = vi.fn().mockReturnThis()
    const mockWhere = vi.fn().mockResolvedValue(undefined)

    const mockContext: TRPCContext = {
      user: mockAdminUser,
      db: {
        transaction: vi.fn(async (callback) => {
          const tx = {
            query: {
              projetoTable: {
                findFirst: vi.fn().mockResolvedValue(mockProjeto),
              },
              periodoInscricaoTable: {
                findFirst: vi.fn().mockResolvedValue(mockPeriodo),
              },
            },
            select: vi.fn().mockReturnThis(),
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockResolvedValue(mockSummary),
            update: mockUpdate.mockReturnValue({
              set: mockSet.mockReturnValue({
                where: mockWhere,
              }),
            }),
          }
          return await callback(tx)
        }),
      } as any,
    }

    const caller = scholarshipAllocationRouter.createCaller(mockContext)
    const result = await caller.updateScholarshipAllocation({
      projetoId: 1,
      bolsasDisponibilizadas: 10,
    })

    expect(result.success).toBe(true)
    expect(mockContext.db.transaction).toHaveBeenCalledTimes(1)
  })

  it('should reject allocation exceeding PROGRAD limit', async () => {
    const mockProjeto = {
      id: 1,
      titulo: 'Projeto 1',
      ano: 2025,
      semestre: 'SEMESTRE_1',
      bolsasDisponibilizadas: 5,
      status: 'APPROVED',
    }

    const mockPeriodo = {
      id: 1,
      ano: 2025,
      semestre: 'SEMESTRE_1',
      totalBolsasPrograd: 100,
    }

    // Current total is 95, trying to add 10 more (total 100) when current project has 5
    const mockSummary = [{ totalBolsasDisponibilizadas: '95' }]

    const mockContext: TRPCContext = {
      user: mockAdminUser,
      db: {
        transaction: vi.fn(async (callback) => {
          const tx = {
            query: {
              projetoTable: {
                findFirst: vi.fn().mockResolvedValue(mockProjeto),
              },
              periodoInscricaoTable: {
                findFirst: vi.fn().mockResolvedValue(mockPeriodo),
              },
            },
            select: vi.fn().mockReturnThis(),
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockResolvedValue(mockSummary),
          }
          return await callback(tx)
        }),
      } as any,
    }

    const caller = scholarshipAllocationRouter.createCaller(mockContext)

    await expect(
      caller.updateScholarshipAllocation({
        projetoId: 1,
        bolsasDisponibilizadas: 10,
      })
    ).rejects.toThrow(/excederia o limite da PROGRAD/)
  })

  it('should handle edge case when PROGRAD limit is 0', async () => {
    const mockProjeto = {
      id: 1,
      titulo: 'Projeto 1',
      ano: 2025,
      semestre: 'SEMESTRE_1',
      bolsasDisponibilizadas: 0,
      status: 'APPROVED',
    }

    const mockPeriodo = {
      id: 1,
      ano: 2025,
      semestre: 'SEMESTRE_1',
      totalBolsasPrograd: 0,
    }

    const mockSummary = [{ totalBolsasDisponibilizadas: '0' }]

    const mockUpdate = vi.fn().mockReturnThis()
    const mockSet = vi.fn().mockReturnThis()
    const mockWhere = vi.fn().mockResolvedValue(undefined)

    const mockContext: TRPCContext = {
      user: mockAdminUser,
      db: {
        transaction: vi.fn(async (callback) => {
          const tx = {
            query: {
              projetoTable: {
                findFirst: vi.fn().mockResolvedValue(mockProjeto),
              },
              periodoInscricaoTable: {
                findFirst: vi.fn().mockResolvedValue(mockPeriodo),
              },
            },
            select: vi.fn().mockReturnThis(),
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockResolvedValue(mockSummary),
            update: mockUpdate.mockReturnValue({
              set: mockSet.mockReturnValue({
                where: mockWhere,
              }),
            }),
          }
          return await callback(tx)
        }),
      } as any,
    }

    const caller = scholarshipAllocationRouter.createCaller(mockContext)
    const result = await caller.updateScholarshipAllocation({
      projetoId: 1,
      bolsasDisponibilizadas: 0,
    })

    expect(result.success).toBe(true)
  })

  it('should throw error when project not found', async () => {
    const mockContext: TRPCContext = {
      user: mockAdminUser,
      db: {
        transaction: vi.fn(async (callback) => {
          const tx = {
            query: {
              projetoTable: {
                findFirst: vi.fn().mockResolvedValue(null),
              },
            },
          }
          return await callback(tx)
        }),
      } as any,
    }

    const caller = scholarshipAllocationRouter.createCaller(mockContext)

    await expect(
      caller.updateScholarshipAllocation({
        projetoId: 999,
        bolsasDisponibilizadas: 5,
      })
    ).rejects.toThrow('Projeto não encontrado')
  })

  it('should reject access for non-admin users', async () => {
    const mockContext: TRPCContext = {
      user: mockNonAdminUser,
      db: {} as any,
    }

    const caller = scholarshipAllocationRouter.createCaller(mockContext)

    await expect(
      caller.updateScholarshipAllocation({
        projetoId: 1,
        bolsasDisponibilizadas: 5,
      })
    ).rejects.toThrow(TRPCError)
  })
})

describe('scholarshipAllocationRouter - bulkUpdateAllocations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should allow bulk allocation within PROGRAD limit', async () => {
    const mockPeriodo = {
      id: 1,
      ano: 2025,
      semestre: 'SEMESTRE_1',
      totalBolsasPrograd: 100,
    }

    // Current total is 40 (10+10+10+10)
    const mockCurrentSummary = [{ total: '40' }]

    // Projects being updated currently have 10+10=20 allocated
    const mockCurrentAllocations = [
      { id: 1, bolsasDisponibilizadas: 10 },
      { id: 2, bolsasDisponibilizadas: 10 },
    ]

    const mockUpdate = vi.fn().mockReturnThis()
    const mockSet = vi.fn().mockReturnThis()
    const mockWhere = vi.fn().mockResolvedValue(undefined)

    const mockContext: TRPCContext = {
      user: mockAdminUser,
      db: {
        transaction: vi.fn(async (callback) => {
          const tx = {
            query: {
              periodoInscricaoTable: {
                findFirst: vi.fn().mockResolvedValue(mockPeriodo),
              },
            },
            select: vi.fn().mockReturnThis(),
            from: vi.fn().mockReturnThis(),
            where: vi.fn()
              .mockResolvedValueOnce(mockCurrentSummary) // First call for current total
              .mockResolvedValueOnce(mockCurrentAllocations), // Second call for current allocations
            update: mockUpdate.mockReturnValue({
              set: mockSet.mockReturnValue({
                where: mockWhere,
              }),
            }),
          }
          return await callback(tx)
        }),
      } as any,
    }

    const caller = scholarshipAllocationRouter.createCaller(mockContext)
    const result = await caller.bulkUpdateAllocations({
      ano: 2025,
      semestre: 'SEMESTRE_1',
      allocations: [
        { projetoId: 1, bolsasDisponibilizadas: 15 },
        { projetoId: 2, bolsasDisponibilizadas: 15 },
      ],
    })

    expect(result.success).toBe(true)
    expect(mockContext.db.transaction).toHaveBeenCalledTimes(1)
  })

  it('should reject bulk allocation exceeding PROGRAD limit', async () => {
    const mockPeriodo = {
      id: 1,
      ano: 2025,
      semestre: 'SEMESTRE_1',
      totalBolsasPrograd: 100,
    }

    // Current total is 90
    const mockCurrentSummary = [{ total: '90' }]

    // Projects being updated currently have 10+10=20 allocated
    const mockCurrentAllocations = [
      { id: 1, bolsasDisponibilizadas: 10 },
      { id: 2, bolsasDisponibilizadas: 10 },
    ]

    const mockContext: TRPCContext = {
      user: mockAdminUser,
      db: {
        transaction: vi.fn(async (callback) => {
          const tx = {
            query: {
              periodoInscricaoTable: {
                findFirst: vi.fn().mockResolvedValue(mockPeriodo),
              },
            },
            select: vi.fn().mockReturnThis(),
            from: vi.fn().mockReturnThis(),
            where: vi.fn()
              .mockResolvedValueOnce(mockCurrentSummary)
              .mockResolvedValueOnce(mockCurrentAllocations),
          }
          return await callback(tx)
        }),
      } as any,
    }

    const caller = scholarshipAllocationRouter.createCaller(mockContext)

    // Trying to allocate 20+20=40, which would make total 90-20+40=110 > 100
    await expect(
      caller.bulkUpdateAllocations({
        ano: 2025,
        semestre: 'SEMESTRE_1',
        allocations: [
          { projetoId: 1, bolsasDisponibilizadas: 20 },
          { projetoId: 2, bolsasDisponibilizadas: 20 },
        ],
      })
    ).rejects.toThrow(/excederia o limite da PROGRAD/)
  })

  it('should correctly calculate when updating existing allocations', async () => {
    const mockPeriodo = {
      id: 1,
      ano: 2025,
      semestre: 'SEMESTRE_1',
      totalBolsasPrograd: 100,
    }

    // Total across all projects is 50
    const mockCurrentSummary = [{ total: '50' }]

    // The 3 projects being updated have 10+15+10 = 35 allocated
    const mockCurrentAllocations = [
      { id: 1, bolsasDisponibilizadas: 10 },
      { id: 2, bolsasDisponibilizadas: 15 },
      { id: 3, bolsasDisponibilizadas: 10 },
    ]

    const mockUpdate = vi.fn().mockReturnThis()
    const mockSet = vi.fn().mockReturnThis()
    const mockWhere = vi.fn().mockResolvedValue(undefined)

    const mockContext: TRPCContext = {
      user: mockAdminUser,
      db: {
        transaction: vi.fn(async (callback) => {
          const tx = {
            query: {
              periodoInscricaoTable: {
                findFirst: vi.fn().mockResolvedValue(mockPeriodo),
              },
            },
            select: vi.fn().mockReturnThis(),
            from: vi.fn().mockReturnThis(),
            where: vi.fn()
              .mockResolvedValueOnce(mockCurrentSummary)
              .mockResolvedValueOnce(mockCurrentAllocations),
            update: mockUpdate.mockReturnValue({
              set: mockSet.mockReturnValue({
                where: mockWhere,
              }),
            }),
          }
          return await callback(tx)
        }),
      } as any,
    }

    const caller = scholarshipAllocationRouter.createCaller(mockContext)

    // New allocation: 5+8+12 = 25
    // Expected total: 50 - 35 + 25 = 40 (should pass)
    const result = await caller.bulkUpdateAllocations({
      ano: 2025,
      semestre: 'SEMESTRE_1',
      allocations: [
        { projetoId: 1, bolsasDisponibilizadas: 5 },
        { projetoId: 2, bolsasDisponibilizadas: 8 },
        { projetoId: 3, bolsasDisponibilizadas: 12 },
      ],
    })

    expect(result.success).toBe(true)
  })

  it('should handle edge case when PROGRAD limit is undefined', async () => {
    const mockPeriodo = {
      id: 1,
      ano: 2025,
      semestre: 'SEMESTRE_1',
      totalBolsasPrograd: undefined,
    }

    const mockCurrentSummary = [{ total: '50' }]
    const mockCurrentAllocations = [{ id: 1, bolsasDisponibilizadas: 10 }]

    const mockUpdate = vi.fn().mockReturnThis()
    const mockSet = vi.fn().mockReturnThis()
    const mockWhere = vi.fn().mockResolvedValue(undefined)

    const mockContext: TRPCContext = {
      user: mockAdminUser,
      db: {
        transaction: vi.fn(async (callback) => {
          const tx = {
            query: {
              periodoInscricaoTable: {
                findFirst: vi.fn().mockResolvedValue(mockPeriodo),
              },
            },
            select: vi.fn().mockReturnThis(),
            from: vi.fn().mockReturnThis(),
            where: vi.fn()
              .mockResolvedValueOnce(mockCurrentSummary)
              .mockResolvedValueOnce(mockCurrentAllocations),
            update: mockUpdate.mockReturnValue({
              set: mockSet.mockReturnValue({
                where: mockWhere,
              }),
            }),
          }
          return await callback(tx)
        }),
      } as any,
    }

    const caller = scholarshipAllocationRouter.createCaller(mockContext)

    // When limit is 0 or undefined, validation should pass
    const result = await caller.bulkUpdateAllocations({
      ano: 2025,
      semestre: 'SEMESTRE_1',
      allocations: [{ projetoId: 1, bolsasDisponibilizadas: 100 }],
    })

    expect(result.success).toBe(true)
  })

  it('should validate correctly across multiple projects', async () => {
    const mockPeriodo = {
      id: 1,
      ano: 2025,
      semestre: 'SEMESTRE_1',
      totalBolsasPrograd: 50,
    }

    // 10 projects with 5 each = 50 total
    const mockCurrentSummary = [{ total: '50' }]

    // Updating 2 projects that currently have 5 each
    const mockCurrentAllocations = [
      { id: 1, bolsasDisponibilizadas: 5 },
      { id: 2, bolsasDisponibilizadas: 5 },
    ]

    const mockContext: TRPCContext = {
      user: mockAdminUser,
      db: {
        transaction: vi.fn(async (callback) => {
          const tx = {
            query: {
              periodoInscricaoTable: {
                findFirst: vi.fn().mockResolvedValue(mockPeriodo),
              },
            },
            select: vi.fn().mockReturnThis(),
            from: vi.fn().mockReturnThis(),
            where: vi.fn()
              .mockResolvedValueOnce(mockCurrentSummary)
              .mockResolvedValueOnce(mockCurrentAllocations),
          }
          return await callback(tx)
        }),
      } as any,
    }

    const caller = scholarshipAllocationRouter.createCaller(mockContext)

    // Trying to change 2 projects from 5 to 3 each
    // Should calculate: 50 - 10 + 6 = 46 (should pass)
    await expect(
      caller.bulkUpdateAllocations({
        ano: 2025,
        semestre: 'SEMESTRE_1',
        allocations: [
          { projetoId: 1, bolsasDisponibilizadas: 10 },
          { projetoId: 2, bolsasDisponibilizadas: 10 },
        ],
      })
    ).rejects.toThrow(/excederia o limite da PROGRAD/)
  })

  it('should reject access for non-admin users', async () => {
    const mockContext: TRPCContext = {
      user: mockNonAdminUser,
      db: {} as any,
    }

    const caller = scholarshipAllocationRouter.createCaller(mockContext)

    await expect(
      caller.bulkUpdateAllocations({
        ano: 2025,
        semestre: 'SEMESTRE_1',
        allocations: [{ projetoId: 1, bolsasDisponibilizadas: 5 }],
      })
    ).rejects.toThrow(TRPCError)
  })
})
