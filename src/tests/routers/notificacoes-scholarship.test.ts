import { notificacoesRouter } from '@/server/api/routers/notificacoes/notificacoes'
import { type TRPCContext } from '@/server/api/trpc'
import { type User } from '@/server/db/schema'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockProactiveReminderServiceMethods = {
  executeReminderIfNeeded: vi.fn(),
  executeAllPendingReminders: vi.fn(),
  getReminderStatus: vi.fn(),
}

vi.mock('@/server/services/notificacoes/proactive-reminder-service', () => ({
  createProactiveReminderService: vi.fn(() => mockProactiveReminderServiceMethods),
}))

// Mock other services used by the notificacoes router
vi.mock('@/server/services/notificacoes/notificacoes-service', () => ({
  createNotificacoesService: vi.fn(() => ({})),
}))

vi.mock('@/server/services/notificacoes/reminder-service', () => ({
  createReminderService: vi.fn(() => ({})),
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

describe('notificacoesRouter - Scholarship Reminders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('checkScholarshipReminders', () => {
    it('should allow authenticated student to check scholarship reminders', async () => {
      const mockContext = createMockContext(mockStudentUser)

      vi.mocked(mockProactiveReminderServiceMethods.executeReminderIfNeeded).mockResolvedValue({
        executed: true,
        message: 'Reminder sent successfully',
      })

      const caller = notificacoesRouter.createCaller(mockContext)
      const result = await caller.checkScholarshipReminders()

      expect(result).toBeDefined()
      expect((result as any).executed).toBe(true)
      expect(mockProactiveReminderServiceMethods.executeReminderIfNeeded).toHaveBeenCalledWith(
        'bolsa_sem_resposta_24h',
        3
      )
    })

    it('should allow authenticated professor to check scholarship reminders', async () => {
      const mockContext = createMockContext(mockProfessorUser)

      vi.mocked(mockProactiveReminderServiceMethods.executeReminderIfNeeded).mockResolvedValue({
        executed: false,
        message: 'Reminder already sent recently',
      })

      const caller = notificacoesRouter.createCaller(mockContext)
      const result = await caller.checkScholarshipReminders()

      expect(result).toBeDefined()
      expect((result as any).executed).toBe(false)
      expect(mockProactiveReminderServiceMethods.executeReminderIfNeeded).toHaveBeenCalledWith(
        'bolsa_sem_resposta_24h',
        2
      )
    })

    it('should reject unauthenticated user', async () => {
      const mockContext = createMockContext(null)
      const caller = notificacoesRouter.createCaller(mockContext)

      await expect(caller.checkScholarshipReminders()).rejects.toThrow()
    })
  })
})
