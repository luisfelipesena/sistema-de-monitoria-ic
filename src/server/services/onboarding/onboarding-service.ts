import type { db } from '@/server/db'
import { ConflictError, ForbiddenError, NotFoundError } from '@/server/lib/errors'
import type { DocumentType, Genero, Regime, UserRole } from '@/types'
import { ADMIN, PROFESSOR, STUDENT } from '@/types'
import { logger } from '@/utils/logger'
import { createOnboardingRepository } from './onboarding-repository'

const log = logger.child({ context: 'OnboardingService' })

type Database = typeof db

type StudentProfile = {
  comprovanteMatriculaFileId: string | null
  historicoEscolarFileId: string | null
}

type ProfessorProfile = {
  curriculumVitaeFileId: string | null
  comprovanteVinculoFileId: string | null
}

const REQUIRED_DOCUMENTS = {
  student: ['comprovante_matricula'],
  professor: [],
} as const

interface CreateStudentProfileInput {
  nomeCompleto: string
  matricula: string
  cpf: string
  cr: number
  cursoId: number
  telefone?: string
  genero: Genero
  especificacaoGenero?: string
  nomeSocial?: string
  rg?: string
}

interface CreateProfessorProfileInput {
  nomeCompleto: string
  matriculaSiape: string
  cpf: string
  telefone?: string
  telefoneInstitucional?: string
  regime: Regime
  departamentoId: number
  genero: Genero
  especificacaoGenero?: string
  nomeSocial?: string
}

export function createOnboardingService(db: Database) {
  const repo = createOnboardingRepository(db)

  return {
    async getStatus(userId: number, userRole: UserRole, userSignature: string | null) {
      if (userRole === ADMIN) {
        return {
          pending: false,
          profile: { exists: false, type: ADMIN },
          documents: { required: [], uploaded: [], missing: [] },
        }
      }

      let hasProfile = false
      let profileData: StudentProfile | ProfessorProfile | null = null
      let hasSignature = false

      if (userRole === STUDENT) {
        const alunoProfile = await repo.findStudentProfile(userId)
        profileData = alunoProfile
          ? {
              comprovanteMatriculaFileId: alunoProfile.comprovanteMatriculaFileId,
              historicoEscolarFileId: alunoProfile.historicoEscolarFileId,
            }
          : null
        hasProfile = alunoProfile != null
      } else if (userRole === PROFESSOR) {
        const professorProfile = await repo.findProfessorProfile(userId)
        profileData = professorProfile
          ? {
              curriculumVitaeFileId: professorProfile.curriculumVitaeFileId,
              comprovanteVinculoFileId: professorProfile.comprovanteVinculoFileId,
            }
          : null
        hasProfile = professorProfile != null
        hasSignature = !!userSignature
      }

      const requiredDocs = userRole === STUDENT ? [...REQUIRED_DOCUMENTS.student] : [...REQUIRED_DOCUMENTS.professor]

      const uploadedDocTypes: string[] = []

      if (userRole === STUDENT && profileData && 'comprovanteMatriculaFileId' in profileData) {
        if (profileData.comprovanteMatriculaFileId) {
          uploadedDocTypes.push('comprovante_matricula')
        }
        if (profileData.historicoEscolarFileId) {
          uploadedDocTypes.push('historico_escolar')
        }
      }

      if (userRole === PROFESSOR && profileData && 'curriculumVitaeFileId' in profileData) {
        if (profileData.curriculumVitaeFileId) {
          uploadedDocTypes.push('curriculum_vitae')
        }
        if (profileData.comprovanteVinculoFileId) {
          uploadedDocTypes.push('comprovante_vinculo')
        }
      }

      const uniqueUploadedDocs = [...new Set(uploadedDocTypes)]
      const missingDocs = requiredDocs.filter((doc) => !uniqueUploadedDocs.includes(doc))

      let pending = !hasProfile || missingDocs.length > 0
      if (userRole === PROFESSOR) {
        pending = pending || !hasSignature
      }

      const result = {
        pending,
        profile: {
          exists: hasProfile,
          type: userRole,
        },
        documents: {
          required: requiredDocs,
          uploaded: uniqueUploadedDocs,
          missing: missingDocs,
        },
      }

      if (userRole === PROFESSOR) {
        return {
          ...result,
          signature: { configured: hasSignature },
        }
      }

      return result
    },

    async createStudentProfile(
      input: CreateStudentProfileInput,
      userId: number,
      userRole: UserRole,
      userEmail: string
    ) {
      if (userRole !== STUDENT) {
        throw new ForbiddenError('Only students can create student profiles')
      }

      const existingProfile = await repo.findStudentProfile(userId)

      if (existingProfile) {
        throw new ConflictError('Student profile already exists')
      }

      const newProfile = await repo.createStudentProfile({
        userId,
        nomeCompleto: input.nomeCompleto,
        matricula: input.matricula,
        cpf: input.cpf,
        cr: input.cr,
        cursoId: input.cursoId,
        telefone: input.telefone,
        genero: input.genero,
        especificacaoGenero: input.especificacaoGenero,
        nomeSocial: input.nomeSocial,
        rg: input.rg,
        emailInstitucional: userEmail,
      })

      log.info({ userId, profileId: newProfile.id }, 'Student profile created successfully')
      return { success: true, profileId: newProfile.id }
    },

    async createProfessorProfile(
      input: CreateProfessorProfileInput,
      userId: number,
      userRole: UserRole,
      userEmail: string
    ) {
      if (userRole !== PROFESSOR) {
        throw new ForbiddenError('Only professors can create professor profiles')
      }

      const existingProfile = await repo.findProfessorProfile(userId)

      if (existingProfile) {
        throw new ConflictError('Professor profile already exists')
      }

      const newProfile = await repo.createProfessorProfile({
        userId,
        nomeCompleto: input.nomeCompleto,
        matriculaSiape: input.matriculaSiape,
        cpf: input.cpf,
        telefone: input.telefone,
        telefoneInstitucional: input.telefoneInstitucional,
        regime: input.regime,
        departamentoId: input.departamentoId,
        genero: input.genero,
        especificacaoGenero: input.especificacaoGenero,
        nomeSocial: input.nomeSocial,
        emailInstitucional: userEmail,
      })

      log.info({ userId, profileId: newProfile.id }, 'Professor profile created successfully')
      return { success: true, profileId: newProfile.id }
    },

    async updateDocument(documentType: DocumentType, fileId: string, userId: number, userRole: UserRole) {
      if (userRole === STUDENT) {
        const profile = await repo.findStudentProfile(userId)

        if (!profile) {
          throw new NotFoundError('Student profile', 'not found')
        }

        const updateData: Partial<typeof profile> = {}
        if (documentType === 'comprovante_matricula') {
          updateData.comprovanteMatriculaFileId = fileId
        } else if (documentType === 'historico_escolar') {
          updateData.historicoEscolarFileId = fileId
        } else {
          throw new ForbiddenError('Invalid document type for student')
        }

        await repo.updateStudentDocument(userId, updateData)
      } else if (userRole === PROFESSOR) {
        const profile = await repo.findProfessorProfile(userId)

        if (!profile) {
          throw new NotFoundError('Professor profile', 'not found')
        }

        const updateData: Partial<typeof profile> = {}
        if (documentType === 'curriculum_vitae') {
          updateData.curriculumVitaeFileId = fileId
        } else if (documentType === 'comprovante_vinculo') {
          updateData.comprovanteVinculoFileId = fileId
        } else {
          throw new ForbiddenError('Invalid document type for professor')
        }

        await repo.updateProfessorDocument(userId, updateData)
      } else {
        throw new ForbiddenError('Only students and professors can update documents')
      }

      log.info({ userId, documentType, fileId }, 'Document updated successfully')
      return { success: true }
    },
  }
}

export type OnboardingService = ReturnType<typeof createOnboardingService>
