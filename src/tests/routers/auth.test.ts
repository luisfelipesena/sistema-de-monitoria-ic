import { authRouter } from '@/server/api/routers/auth/auth'
import { type TRPCContext } from '@/server/api/trpc'
import { type User } from '@/server/db/schema'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/server/lib/lucia', () => ({
  lucia: {
    sessionCookieName: 'session',
  },
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue(undefined),
  }),
  headers: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue(null),
  }),
}))

const mockAuthServiceMethods = {
  register: vi.fn(),
  resendVerification: vi.fn(),
  verifyEmail: vi.fn(),
  login: vi.fn(),
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
  setPassword: vi.fn(),
  logout: vi.fn(),
}

vi.mock('@/server/services/auth/auth-service', () => ({
  authService: {
    register: (...args: any[]) => mockAuthServiceMethods.register(...args),
    resendVerification: (...args: any[]) => mockAuthServiceMethods.resendVerification(...args),
    verifyEmail: (...args: any[]) => mockAuthServiceMethods.verifyEmail(...args),
    login: (...args: any[]) => mockAuthServiceMethods.login(...args),
    requestPasswordReset: (...args: any[]) => mockAuthServiceMethods.requestPasswordReset(...args),
    resetPassword: (...args: any[]) => mockAuthServiceMethods.resetPassword(...args),
    setPassword: (...args: any[]) => mockAuthServiceMethods.setPassword(...args),
    logout: (...args: any[]) => mockAuthServiceMethods.logout(...args),
  },
}))

vi.mock('@/server/lib/rate-limit', () => ({
  consume: vi.fn().mockReturnValue({ allowed: true }),
  RATE_LIMITS: {
    login: { keyPrefix: 'login', limit: 5, windowMs: 60000 },
    register: { keyPrefix: 'register', limit: 3, windowMs: 60000 },
    resendVerification: { keyPrefix: 'resend', limit: 3, windowMs: 60000 },
    requestPasswordReset: { keyPrefix: 'reset', limit: 3, windowMs: 60000 },
  },
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

describe('authRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const mockContext = createMockContext(null)

      mockAuthServiceMethods.register.mockResolvedValue({
        success: true,
        message: 'Usuário registrado com sucesso',
      })

      const caller = authRouter.createCaller(mockContext)
      const result = await caller.register({
        email: 'newuser@ufba.br',
        name: 'New User',
        password: 'Password123!',
        role: 'student',
      })

      expect(result).toBeDefined()
      expect(result!.success).toBe(true)
      expect(mockAuthServiceMethods.register).toHaveBeenCalled()
    })

    it('should allow unauthenticated user to register (public procedure)', async () => {
      const mockContext = createMockContext(null)

      mockAuthServiceMethods.register.mockResolvedValue({
        success: true,
        message: 'Registro realizado',
      })

      const caller = authRouter.createCaller(mockContext)
      const result = await caller.register({
        email: 'test@ufba.br',
        name: 'Test User',
        password: 'Password123!',
        role: 'student',
      })

      expect(result).toBeDefined()
      expect(result!.success).toBe(true)
    })
  })

  describe('login', () => {
    it('should login a user successfully', async () => {
      const mockContext = createMockContext(null)

      mockAuthServiceMethods.login.mockResolvedValue({
        success: true,
        sessionId: 'session-123',
      })

      const caller = authRouter.createCaller(mockContext)
      const result = await caller.login({
        email: 'user@ufba.br',
        password: 'Password123!',
      })

      expect(result).toBeDefined()
      expect(result!.success).toBe(true)
      expect(mockAuthServiceMethods.login).toHaveBeenCalledWith({
        email: 'user@ufba.br',
        password: 'Password123!',
      })
    })

    it('should allow unauthenticated user to login (public procedure)', async () => {
      const mockContext = createMockContext(null)

      mockAuthServiceMethods.login.mockResolvedValue({
        success: true,
        sessionId: 'session-456',
      })

      const caller = authRouter.createCaller(mockContext)
      const result = await caller.login({
        email: 'user@ufba.br',
        password: 'Password123!',
      })

      expect(result).toBeDefined()
      expect(result!.success).toBe(true)
    })
  })

  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      const mockContext = createMockContext(null)

      mockAuthServiceMethods.verifyEmail.mockResolvedValue({
        success: true,
        message: 'Email verificado com sucesso',
      })

      const caller = authRouter.createCaller(mockContext)
      const result = await caller.verifyEmail({ token: 'valid-token-123' })

      expect(result).toBeDefined()
      expect(result!.success).toBe(true)
      expect(mockAuthServiceMethods.verifyEmail).toHaveBeenCalledWith({ token: 'valid-token-123' })
    })
  })

  describe('requestPasswordReset', () => {
    it('should request password reset successfully', async () => {
      const mockContext = createMockContext(null)

      mockAuthServiceMethods.requestPasswordReset.mockResolvedValue({
        success: true,
        message: 'Email enviado',
      })

      const caller = authRouter.createCaller(mockContext)
      const result = await caller.requestPasswordReset({ email: 'user@ufba.br' })

      expect(result).toBeDefined()
      expect(result!.success).toBe(true)
      expect(mockAuthServiceMethods.requestPasswordReset).toHaveBeenCalledWith({ email: 'user@ufba.br' })
    })
  })

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const mockContext = createMockContext(null)

      mockAuthServiceMethods.resetPassword.mockResolvedValue({
        success: true,
        message: 'Senha redefinida',
      })

      const caller = authRouter.createCaller(mockContext)
      const result = await caller.resetPassword({
        token: 'reset-token-123',
        password: 'NewPassword123!',
      })

      expect(result).toBeDefined()
      expect(result!.success).toBe(true)
      expect(mockAuthServiceMethods.resetPassword).toHaveBeenCalled()
    })
  })

  describe('setPassword', () => {
    it('should allow authenticated user to set password', async () => {
      const mockContext = createMockContext(mockStudentUser)

      mockAuthServiceMethods.setPassword.mockResolvedValue({
        success: true,
        message: 'Senha definida',
      })

      const caller = authRouter.createCaller(mockContext)
      const result = await caller.setPassword({
        password: 'NewPassword123!',
      })

      expect(result).toBeDefined()
      expect(result!.success).toBe(true)
      expect(mockAuthServiceMethods.setPassword).toHaveBeenCalledWith(3, {
        password: 'NewPassword123!',
      })
    })

    it('should reject unauthenticated user for setPassword', async () => {
      const mockContext = createMockContext(null)
      const caller = authRouter.createCaller(mockContext)

      await expect(
        caller.setPassword({
          password: 'NewPassword123!',
        })
      ).rejects.toThrow()
    })
  })

  describe('logout', () => {
    it('should logout authenticated user', async () => {
      const mockContext = createMockContext(mockStudentUser)

      mockAuthServiceMethods.logout.mockResolvedValue({ success: true })

      const caller = authRouter.createCaller(mockContext)
      const result = await caller.logout()

      expect(result).toBeDefined()
    })

    it('should reject unauthenticated user for logout', async () => {
      const mockContext = createMockContext(null)
      const caller = authRouter.createCaller(mockContext)

      await expect(caller.logout()).rejects.toThrow()
    })
  })

  describe('resendVerification', () => {
    it('should resend verification email successfully', async () => {
      const mockContext = createMockContext(null)

      mockAuthServiceMethods.resendVerification.mockResolvedValue({
        success: true,
        message: 'Email de verificação reenviado',
      })

      const caller = authRouter.createCaller(mockContext)
      const result = await caller.resendVerification({ email: 'user@ufba.br' })

      expect(result).toBeDefined()
      expect(result!.success).toBe(true)
      expect(mockAuthServiceMethods.resendVerification).toHaveBeenCalledWith({ email: 'user@ufba.br' })
    })
  })
})
