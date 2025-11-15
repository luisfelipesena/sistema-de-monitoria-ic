import { db } from '@/server/db'
import { NotFoundError, ValidationError } from '@/server/lib/errors'
import type { Regime, UserRole } from '@/types'
import { PROFESSOR, PROFESSOR_STATUS_ATIVO, PROFESSOR_STATUS_INATIVO, STUDENT } from '@/types'
import { createUserRepository, type UpdateProfileData, type UserFilters } from './user-repository'

export const createUserService = (database: typeof db) => {
  const userRepository = createUserRepository(database)

  return {
    async listUsers(filters: UserFilters) {
      const [users, total] = await Promise.all([userRepository.findMany(filters), userRepository.count(filters)])

      const enrichedUsers = await Promise.all(
        users.map(async (user) => {
          let professorStats = null
          let studentStats = null

          if (user.professorProfile) {
            const stats = await userRepository.getProfessorStats(user.professorProfile.id)
            professorStats = {
              id: user.professorProfile.id,
              nomeCompleto: user.professorProfile.nomeCompleto,
              cpf: user.professorProfile.cpf,
              telefone: user.professorProfile.telefone,
              telefoneInstitucional: user.professorProfile.telefoneInstitucional,
              emailInstitucional: user.professorProfile.emailInstitucional,
              matriculaSiape: user.professorProfile.matriculaSiape,
              regime: user.professorProfile.regime as Regime,
              departamentoId: user.professorProfile.departamentoId,
              assinaturaDefault: user.professorProfile.assinaturaDefault,
              dataAssinaturaDefault: user.professorProfile.dataAssinaturaDefault,
              ...stats,
            }
          }

          if (user.studentProfile) {
            const stats = await userRepository.getStudentStats(user.studentProfile.id)
            studentStats = {
              id: user.studentProfile.id,
              nomeCompleto: user.studentProfile.nomeCompleto,
              matricula: user.studentProfile.matricula,
              cpf: user.studentProfile.cpf,
              cr: user.studentProfile.cr,
              cursoId: user.studentProfile.cursoId,
              telefone: user.studentProfile.telefone,
              emailInstitucional: user.studentProfile.emailInstitucional,
              historicoEscolarFileId: user.studentProfile.historicoEscolarFileId,
              comprovanteMatriculaFileId: user.studentProfile.comprovanteMatriculaFileId,
              banco: user.studentProfile.banco,
              agencia: user.studentProfile.agencia,
              conta: user.studentProfile.conta,
              digitoConta: user.studentProfile.digitoConta,
              ...stats,
            }
          }

          return {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role as UserRole,
            assinaturaDefault: user.assinaturaDefault,
            dataAssinaturaDefault: user.dataAssinaturaDefault,
            professorProfile: professorStats,
            studentProfile: studentStats,
            createdAt: user.professorProfile?.createdAt || user.studentProfile?.createdAt || null,
            updatedAt: user.professorProfile?.updatedAt || user.studentProfile?.updatedAt || null,
          }
        })
      )

      return { users: enrichedUsers, total }
    },

    async getProfile(userId: number) {
      const user = await userRepository.findById(userId)

      if (!user) {
        throw new NotFoundError('User', userId)
      }

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role as UserRole,
        assinaturaDefault: user.assinaturaDefault,
        dataAssinaturaDefault: user.dataAssinaturaDefault,
        professorProfile: user.professorProfile
          ? {
              id: user.professorProfile.id,
              nomeCompleto: user.professorProfile.nomeCompleto,
              cpf: user.professorProfile.cpf,
              telefone: user.professorProfile.telefone,
              telefoneInstitucional: user.professorProfile.telefoneInstitucional,
              emailInstitucional: user.professorProfile.emailInstitucional,
              matriculaSiape: user.professorProfile.matriculaSiape,
              regime: user.professorProfile.regime as Regime,
              departamentoId: user.professorProfile.departamentoId,
              curriculumVitaeFileId: user.professorProfile.curriculumVitaeFileId,
              comprovanteVinculoFileId: user.professorProfile.comprovanteVinculoFileId,
              assinaturaDefault: user.professorProfile.assinaturaDefault,
              dataAssinaturaDefault: user.professorProfile.dataAssinaturaDefault,
            }
          : null,
        studentProfile: user.studentProfile
          ? {
              id: user.studentProfile.id,
              nomeCompleto: user.studentProfile.nomeCompleto,
              matricula: user.studentProfile.matricula,
              cpf: user.studentProfile.cpf,
              cr: user.studentProfile.cr,
              cursoId: user.studentProfile.cursoId,
              telefone: user.studentProfile.telefone,
              emailInstitucional: user.studentProfile.emailInstitucional,
              historicoEscolarFileId: user.studentProfile.historicoEscolarFileId,
              comprovanteMatriculaFileId: user.studentProfile.comprovanteMatriculaFileId,
              banco: user.studentProfile.banco,
              agencia: user.studentProfile.agencia,
              conta: user.studentProfile.conta,
              digitoConta: user.studentProfile.digitoConta,
            }
          : null,
      }
    },

    async updateProfile(userId: number, data: UpdateProfileData) {
      const user = await userRepository.findById(userId)

      if (!user) {
        throw new NotFoundError('User', userId)
      }

      // Validate professor data
      if (data.professorData) {
        if (user.role !== PROFESSOR) {
          throw new ValidationError('User is not a professor')
        }
        if (!user.professorProfile) {
          throw new ValidationError('Professor profile not found')
        }
      }

      // Validate student data
      if (data.studentData) {
        if (user.role !== STUDENT) {
          throw new ValidationError('User is not a student')
        }
        if (!user.studentProfile) {
          throw new ValidationError('Student profile not found')
        }
      }

      await userRepository.updateProfile(userId, data)
    },

    async getUserById(userId: number) {
      const user = await userRepository.findById(userId)

      if (!user) {
        throw new NotFoundError('User', userId)
      }

      return user
    },

    async updateUser(id: number, data: { username?: string; email?: string; role?: UserRole }) {
      const user = await userRepository.findById(id)

      if (!user) {
        throw new NotFoundError('User', id)
      }

      await userRepository.update(id, data)
    },

    async updateProfessorStatus(
      userId: number,
      status: typeof PROFESSOR_STATUS_ATIVO | typeof PROFESSOR_STATUS_INATIVO
    ) {
      const user = await userRepository.findById(userId)

      if (!user) {
        throw new NotFoundError('User', userId)
      }

      if (!user.professorProfile) {
        throw new ValidationError('User does not have a professor profile')
      }

      await userRepository.updateProfessorStatus(userId, status)

      return {
        success: true,
        message: `Professor ${status === PROFESSOR_STATUS_ATIVO ? 'ativado' : 'desativado'} com sucesso`,
      }
    },
  }
}

export const userService = createUserService(db)
