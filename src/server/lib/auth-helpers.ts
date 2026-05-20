import { ForbiddenError } from './errors'
import { ADMIN, PROFESSOR, STUDENT, type UserRole } from '@/types'

/**
 * Authorization helpers for role-based access control
 * Use these instead of manual role checks for consistency and maintainability
 */

/**
 * Generic role validation
 * @throws ForbiddenError if user role is not in allowed roles
 */
export function requireRole(userRole: UserRole, allowedRoles: UserRole[], message?: string): void {
  if (!allowedRoles.includes(userRole)) {
    throw new ForbiddenError(message || `Acesso não autorizado para ${userRole}`)
  }
}

/**
 * Require admin role
 * @throws ForbiddenError if user is not admin
 */
export function requireAdmin(userRole: UserRole): void {
  requireRole(userRole, [ADMIN], 'Apenas administradores têm acesso')
}

/**
 * Require professor role (admin has access too)
 * @throws ForbiddenError if user is not professor or admin
 */
export function requireProfessor(userRole: UserRole): void {
  requireRole(userRole, [PROFESSOR, ADMIN], 'Apenas professores têm acesso')
}

/**
 * Require student role
 * @throws ForbiddenError if user is not student
 */
export function requireStudent(userRole: UserRole): void {
  requireRole(userRole, [STUDENT], 'Apenas estudantes têm acesso')
}

/**
 * Require admin or professor role
 * @throws ForbiddenError if user is neither admin nor professor
 */
export function requireAdminOrProfessor(userRole: UserRole): void {
  requireRole(userRole, [ADMIN, PROFESSOR], 'Acesso restrito a administradores e professores')
}

/**
 * Check if user is admin (non-throwing)
 */
export function isAdmin(userRole: UserRole): boolean {
  return userRole === ADMIN
}

/**
 * Check if user is professor or admin (non-throwing)
 */
export function isProfessor(userRole: UserRole): boolean {
  return userRole === PROFESSOR || userRole === ADMIN
}

/**
 * Check if user is student (non-throwing)
 */
export function isStudent(userRole: UserRole): boolean {
  return userRole === STUDENT
}
