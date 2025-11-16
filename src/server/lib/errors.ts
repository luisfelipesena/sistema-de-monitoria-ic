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
