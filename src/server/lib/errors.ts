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

function uniqueConstraint(error: unknown): unknown {
  let current = error
  for (let depth = 0; depth < 3 && current && typeof current === 'object'; depth += 1) {
    if ('code' in current && current.code === '23505') {
      if ('constraint_name' in current) return current.constraint_name
      if ('constraint' in current) return current.constraint
    }
    current = 'cause' in current ? current.cause : null
  }
  return null
}

export function profileIdentityConflict(error: unknown): ConflictError | null {
  const constraint = uniqueConstraint(error)
  if (constraint === 'aluno_matricula_unique') {
    return new ConflictError(
      'Esta matrícula já está vinculada a outra conta. Recupere o acesso à conta anterior ou procure a coordenação antes de continuar.'
    )
  }
  if (constraint === 'professor_matricula_siape_normalized_unique') {
    return new ConflictError(
      'Esta matrícula SIAPE já está vinculada a outra conta. Recupere o acesso à conta anterior ou procure a coordenação antes de continuar.'
    )
  }
  if (constraint === 'aluno_cpf_unique' || constraint === 'aluno_cpf_normalized_unique') {
    return new ConflictError(
      'Este CPF já está vinculado a outra conta. Recupere o acesso à conta anterior ou procure a coordenação antes de continuar.'
    )
  }
  if (constraint === 'professor_cpf_normalized_unique') {
    return new ConflictError(
      'Este CPF já está vinculado a outra conta. Recupere o acesso à conta anterior ou procure a coordenação antes de continuar.'
    )
  }
  return null
}
