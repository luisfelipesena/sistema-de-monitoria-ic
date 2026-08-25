/**
 * Domain-specific error classes for business logic validation
 * Used in service layer, transformed to TRPCError in router layer
 */

export class BusinessError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message)
    this.name = 'BusinessError'
  }
}

export class NotFoundError extends BusinessError {
  constructor(resource: string, id: number | string) {
    super(`${resource} not found: ${id}`, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends BusinessError {
  constructor(message: string) {
    super(message, 'UNAUTHORIZED')
    this.name = 'UnauthorizedError'
  }
}

export class ValidationError extends BusinessError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

export class ConflictError extends BusinessError {
  constructor(message: string) {
    super(message, 'CONFLICT')
    this.name = 'ConflictError'
  }
}

export class ForbiddenError extends BusinessError {
  constructor(message: string) {
    super(message, 'FORBIDDEN')
    this.name = 'ForbiddenError'
  }
}

export function studentIdentityConflict(error: unknown): ConflictError | null {
  if (!error || typeof error !== 'object' || !('code' in error) || error.code !== '23505') return null

  const constraint = 'constraint_name' in error ? error.constraint_name : null
  if (constraint === 'aluno_matricula_unique') {
    return new ConflictError(
      'Esta matrícula já está vinculada a outra conta. Entre com a conta anterior ou procure a coordenação.'
    )
  }
  if (constraint === 'aluno_cpf_unique' || constraint === 'aluno_cpf_normalized_unique') {
    return new ConflictError(
      'Este CPF já está vinculado a outra conta. Entre com a conta anterior ou procure a coordenação.'
    )
  }
  return null
}
