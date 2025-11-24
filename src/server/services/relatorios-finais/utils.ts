import type { z } from 'zod'
import { BusinessError } from '@/types/errors'

/**
 * Safely parses JSON and validates against a Zod schema.
 * @throws {BusinessError} If JSON is invalid or doesn't match schema
 */
export function safeJsonParse<T>(json: string, schema: z.ZodSchema<T>, errorContext: string): T {
  try {
    const parsed = JSON.parse(json) as unknown
    return schema.parse(parsed)
  } catch (error) {
    const message = error instanceof Error ? ` - ${error.message}` : ''
    throw new BusinessError(`Dados inválidos: ${errorContext}${message}`, 'INVALID_DATA')
  }
}
