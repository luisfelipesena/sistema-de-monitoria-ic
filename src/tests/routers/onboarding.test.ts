import { onboardingRouter, REQUIRED_DOCUMENTS } from '@/server/api/routers/onboarding/onboarding'
import { type TRPCContext } from '@/server/api/trpc'
import { type User } from '@/server/db/schema'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockStudentUser: User = {
  id: 3,
  username: 'student',
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

const createMockContext = (user: User | null): TRPCContext => ({
  user,
  db: {
    query: {
      alunoTable: {
        findFirst: vi.fn(),
      },
      professorTable: {
        findFirst: vi.fn(),
      },
      disciplinaProfessorResponsavelTable: {
        findFirst: vi.fn(),
      },
    },
    update: vi.fn(),
    // biome-ignore lint/suspicious/noExplicitAny: Mock complexo de teste
  } as any,
})

describe('onboardingRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getStatus', () => {
    it('should return pending: true for a new student with no profile', async () => {
      const mockContext = createMockContext(mockStudentUser)
      const caller = onboardingRouter.createCaller(mockContext)

      vi.spyOn(mockContext.db.query.alunoTable, 'findFirst').mockResolvedValue(undefined)

      const result = await caller.getStatus()
      expect(result.pending).toBe(true)
      expect(result.profile.exists).toBe(false)
      expect(result.profile.complete).toBe(false)
    })

    it('should keep onboarding pending for a partial student profile', async () => {
      const mockContext = createMockContext(mockStudentUser)
      const caller = onboardingRouter.createCaller(mockContext)

      vi.spyOn(mockContext.db.query.alunoTable, 'findFirst').mockResolvedValue({
        id: 1,
        nomeCompleto: 'Student',
        matricula: null,
        cpf: null,
        cr: null,
        cursoNome: null,
        genero: null,
        comprovanteMatriculaFileId: 'document.pdf',
        historicoEscolarFileId: null,
      } as never)

      const result = await caller.getStatus()
      expect(result.pending).toBe(true)
      expect(result.profile.exists).toBe(true)
      expect(result.profile.complete).toBe(false)
      expect(result.existingProfileData?.nomeCompleto).toBe('Student')
    })

    it('should accept a legacy student profile with CPF and matrícula', async () => {
      const mockContext = createMockContext(mockStudentUser)
      const caller = onboardingRouter.createCaller(mockContext)

      vi.spyOn(mockContext.db.query.alunoTable, 'findFirst').mockResolvedValue({
        id: 1,
        nomeCompleto: 'Student',
        matricula: '225115868',
        cpf: '529.982.247-25',
        cr: null,
        cursoNome: null,
        genero: null,
        comprovanteMatriculaFileId: 'document.pdf',
        historicoEscolarFileId: null,
      } as never)

      const result = await caller.getStatus()
      expect(result.pending).toBe(false)
      expect(result.profile.complete).toBe(true)
    })

    it('should complete the partial profile created during registration', async () => {
      const mockContext = createMockContext(mockStudentUser)
      const caller = onboardingRouter.createCaller(mockContext)

      vi.spyOn(mockContext.db.query.alunoTable, 'findFirst').mockResolvedValue({ id: 1 } as never)
      vi.spyOn(mockContext.db, 'update').mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 1 }]),
          }),
        }),
      } as never)

      const result = await caller.createStudentProfile({
        nomeCompleto: 'Student',
        matricula: '225115868',
        cpf: '529.982.247-25',
        cr: 8,
        cursoNome: 'Sistemas de Informação',
        genero: 'MASCULINO',
      })

      expect(result).toEqual({ success: true, profileId: 1 })
      expect(mockContext.db.update).toHaveBeenCalled()
    })

    it('should return a clear conflict for duplicate professor identity', async () => {
      const mockContext = createMockContext(mockProfessorUser)
      const caller = onboardingRouter.createCaller(mockContext)

      vi.spyOn(mockContext.db.query.professorTable, 'findFirst').mockResolvedValue({
        id: 1,
        tipoProfessor: 'EFETIVO',
      } as never)
      vi.spyOn(mockContext.db, 'update').mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockRejectedValue({ code: '23505', constraint_name: 'professor_cpf_normalized_unique' }),
          }),
        }),
      } as never)

      await expect(
        caller.createProfessorProfile({
          nomeCompleto: 'Professor',
          matriculaSiape: '1234567',
          cpf: '529.982.247-25',
          regime: 'DE',
          departamentoId: 1,
          genero: 'MASCULINO',
        })
      ).rejects.toMatchObject({
        code: 'CONFLICT',
        message:
          'Este CPF já está vinculado a outra conta. Recupere o acesso à conta anterior ou procure a coordenação antes de continuar.',
      })
    })

    it('should return pending: true for a professor with a profile but missing documents', async () => {
      const mockContext = createMockContext(mockProfessorUser)
      const caller = onboardingRouter.createCaller(mockContext)

      const mockProfile = { id: 1, curriculumVitaeFileId: null, comprovanteVinculoFileId: null }
      vi.spyOn(mockContext.db.query.professorTable, 'findFirst').mockResolvedValue(mockProfile as any)

      const result = await caller.getStatus()
      expect(result.pending).toBe(true)
      expect(result.documents.missing).toEqual(REQUIRED_DOCUMENTS.professor)
    })

    it('should return pending: false for a professor with a complete profile', async () => {
      // Mock user with signature
      const userWithSignature = {
        ...mockProfessorUser,
        assinaturaDefault: 'base64signature',
        dataAssinaturaDefault: new Date(),
      }
      const mockContext = createMockContext(userWithSignature)
      const caller = onboardingRouter.createCaller(mockContext)

      const mockProfile = {
        id: 1,
        assinaturaDefault: null,
        dataAssinaturaDefault: null,
      }
      vi.spyOn(mockContext.db.query.professorTable, 'findFirst').mockResolvedValue(mockProfile as any)

      const result = await caller.getStatus()
      expect(result.pending).toBe(false)
      expect(result.documents.missing).toHaveLength(0)
    })
  })
})
