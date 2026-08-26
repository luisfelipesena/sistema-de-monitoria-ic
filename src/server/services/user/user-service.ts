import { db } from '@/server/db'
import {
  BusinessError,
  ConflictError,
  NotFoundError,
  studentIdentityConflict,
  ValidationError,
} from '@/server/lib/errors'
import { createAuditService } from '@/server/services/audit/audit-service'
import { createAuthRepository } from '@/server/services/auth/auth-repository'
import type { AdminType, Regime, TipoProfessor, UserRole } from '@/types'
import {
  ADMIN,
  AUDIT_ACTION_DELETE,
  AUDIT_ACTION_UPDATE,
  AUDIT_ENTITY_USER,
  PROFESSOR,
  PROFESSOR_STATUS_ATIVO,
  PROFESSOR_STATUS_INATIVO,
  STUDENT,
} from '@/types'
import { createUserRepository, type UpdateProfileData, type UserFilters } from './user-repository'

export const createUserService = (database: typeof db) => {
  const userRepository = createUserRepository(database)
  const authRepository = createAuthRepository(database)
  const auditService = createAuditService(database)

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
              tipoProfessor: user.professorProfile.tipoProfessor as TipoProfessor | null,
              departamentoId: user.professorProfile.departamentoId,
              accountStatus: user.professorProfile.accountStatus as 'PENDING' | 'ACTIVE' | 'INACTIVE' | null,
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
              cursoNome: user.studentProfile.cursoNome,
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
              tipoProfessor: user.professorProfile.tipoProfessor as TipoProfessor | null,
              departamentoId: user.professorProfile.departamentoId,
              curriculumVitaeFileId: user.professorProfile.curriculumVitaeFileId,
              comprovanteVinculoFileId: user.professorProfile.comprovanteVinculoFileId,
            }
          : null,
        studentProfile: user.studentProfile
          ? {
              id: user.studentProfile.id,
              nomeCompleto: user.studentProfile.nomeCompleto,
              matricula: user.studentProfile.matricula,
              cpf: user.studentProfile.cpf,
              cr: user.studentProfile.cr,
              cursoNome: user.studentProfile.cursoNome,
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

      try {
        await userRepository.updateProfile(userId, data)
      } catch (error) {
        throw studentIdentityConflict(error) ?? error
      }
    },

    async getUserById(userId: number) {
      const user = await userRepository.findById(userId)

      if (!user) {
        throw new NotFoundError('User', userId)
      }

      return user
    },

    async updateUser(id: number, data: { username?: string; email?: string; role?: UserRole }, actorId: number) {
      const user = await userRepository.findById(id)

      if (!user) {
        throw new NotFoundError('User', id)
      }

      const email = data.email?.trim().toLowerCase()
      if (email && email !== user.email.toLowerCase()) {
        const existing = await authRepository.findByEmail(email)
        if (existing && existing.id !== id) {
          throw new ConflictError('Já existe outro usuário com este e-mail')
        }
      }

      await userRepository.update(id, email ? { ...data, email } : data)

      await auditService.logAction(actorId, AUDIT_ACTION_UPDATE, AUDIT_ENTITY_USER, id, {
        previous: { username: user.username, email: user.email, role: user.role },
        updated: data,
      })
    },

    async updateProfessorStatus(
      userId: number,
      status: typeof PROFESSOR_STATUS_ATIVO | typeof PROFESSOR_STATUS_INATIVO,
      actorId: number
    ) {
      const user = await userRepository.findById(userId)

      if (!user) {
        throw new NotFoundError('User', userId)
      }

      if (!user.professorProfile) {
        throw new ValidationError('User does not have a professor profile')
      }

      await userRepository.updateProfessorStatus(userId, status)

      await auditService.logAction(actorId, AUDIT_ACTION_UPDATE, AUDIT_ENTITY_USER, userId, {
        operation: 'UPDATE_PROFESSOR_STATUS',
        targetEmail: user.email,
        status,
      })

      return {
        success: true,
        message: `Professor ${status === PROFESSOR_STATUS_ATIVO ? 'ativado' : 'desativado'} com sucesso`,
      }
    },

    async updateAdminType(userId: number, adminType: AdminType) {
      const user = await userRepository.findById(userId)

      if (!user) {
        throw new NotFoundError('User', userId)
      }

      if (user.role !== ADMIN) {
        throw new ValidationError('Usuário não é administrador')
      }

      await userRepository.updateAdminType(userId, adminType)

      await auditService.logAction(userId, AUDIT_ACTION_UPDATE, AUDIT_ENTITY_USER, userId, {
        operation: 'UPDATE_ADMIN_TYPE',
        targetEmail: user.email,
        previousAdminType: user.adminType,
        adminType,
      })

      return {
        success: true,
        message: 'Tipo de administrador atualizado com sucesso',
      }
    },

    async deleteUser(userId: number, currentUserId: number) {
      const user = await userRepository.findById(userId)

      if (!user) {
        throw new NotFoundError('User', userId)
      }

      // Prevent self-deletion
      if (userId === currentUserId) {
        throw new BusinessError('Não é possível excluir seu próprio usuário', 'SELF_DELETION')
      }

      // Prevent deletion of admins
      if (user.role === ADMIN) {
        throw new BusinessError('Não é possível excluir usuários administradores', 'ADMIN_DELETION')
      }

      // Check for blocking constraints and transfer ownership to current admin
      const constraints = await userRepository.checkUserDeletionConstraints(userId)
      if (constraints.hasEditais || constraints.hasTemplates || constraints.hasImportacoes) {
        // Transfer ownership to the current user (admin performing deletion)
        await userRepository.transferUserOwnership(userId, currentUserId)
      }

      // Soft delete professor's projects before deleting user
      if (user.professorProfile) {
        await userRepository.softDeleteProfessorProjects(user.professorProfile.id)
      }

      // Delete student's inscricoes before deleting user
      if (user.studentProfile) {
        await userRepository.deleteStudentInscricoes(user.studentProfile.id)
      }

      await userRepository.deleteUser(userId)

      // Hard delete, so entityId dangles: snapshot the identity into details.
      await auditService.logAction(currentUserId, AUDIT_ACTION_DELETE, AUDIT_ENTITY_USER, userId, {
        username: user.username,
        email: user.email,
        role: user.role,
      })

      return {
        success: true,
        message: 'Usuário excluído com sucesso',
      }
    },
  }
}

export const userService = createUserService(db)
