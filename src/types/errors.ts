import type { TRPCClientError } from '@trpc/client'
import type { AppRouter } from '@/server/api/root'
import type { ErrorResponse } from './schemas'

/**
 * Typed tRPC error from client-side mutations/queries
 */
export type TRPCError = TRPCClientError<AppRouter>

/**
 * Error type discriminator for catch blocks
 */
export type CatchError = Error | TRPCError | unknown

/**
 * Type guard for tRPC errors
 */
export function isTRPCError(error: unknown): error is TRPCError {
  return typeof error === 'object' && error !== null && 'data' in error && 'shape' in error
}

/**
 * Type guard for standard Error objects
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error
}

/**
 * Type guard for errors with message property
 */
export function hasMessage(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  )
}

/**
 * Safe error message extractor
 */
export function getErrorMessage(error: unknown): string {
  if (isTRPCError(error)) {
    return error.message
  }

  if (isError(error)) {
    return error.message
  }

  if (hasMessage(error)) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return 'Ocorreu um erro inesperado'
}

/**
 * Format error for user display
 */
export function formatErrorResponse(error: unknown): ErrorResponse {
  if (isTRPCError(error)) {
    return {
      title: 'Erro na requisição',
      message: error.message,
      code: error.data?.code,
      details: error.data?.zodError || undefined,
    }
  }

  if (isError(error)) {
    return {
      title: 'Erro',
      message: error.message,
    }
  }

  return {
    title: 'Erro inesperado',
    message: getErrorMessage(error),
  }
}

/**
 * Generic async error handler for mutations
 */
export async function handleAsyncError<T>(
  asyncFn: () => Promise<T>,
  onError?: (error: ErrorResponse) => void
): Promise<T | null> {
  try {
    return await asyncFn()
  } catch (error) {
    const errorResponse = formatErrorResponse(error)
    onError?.(errorResponse)
    return null
  }
}

/**
 * Re-export ErrorResponse from schemas for convenience
 */
export type { ErrorResponse }

/**
 * Server-side domain errors (single source of truth)
 * Re-exported from @/server/lib/errors for convenience
 */
export {
  BusinessError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
  ConflictError,
  ForbiddenError,
} from '@/server/lib/errors'
