import { useToast } from '@/hooks/use-toast'
import { formatErrorResponse, handleAsyncError } from '@/types'
import { useCallback } from 'react'

/**
 * Hook for consistent error handling with toast notifications
 */
export function useErrorHandler() {
  const { toast } = useToast()

  const handleError = useCallback(
    (error: unknown) => {
      const { title, message } = formatErrorResponse(error)
      toast({ title, description: message, variant: 'destructive' })
    },
    [toast]
  )

  const handleSuccess = useCallback(
    (message: string, title = 'Sucesso') => {
      toast({ title, description: message })
    },
    [toast]
  )

  /**
   * Execute async operation with automatic error handling
   */
  const execute = useCallback(
    async <T>(asyncFn: () => Promise<T>, successMessage?: string): Promise<T | null> => {
      const result = await handleAsyncError(asyncFn, handleError)

      if (result && successMessage) {
        handleSuccess(successMessage)
      }

      return result
    },
    [handleError, handleSuccess]
  )

  return { handleError, handleSuccess, execute }
}
