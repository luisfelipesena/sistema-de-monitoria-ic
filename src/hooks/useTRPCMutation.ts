import { useToast } from '@/hooks/use-toast'
import { useQueryClient } from '@tanstack/react-query'
import type { TRPCClientErrorLike } from '@trpc/client'
import type { UseMutationResult } from '@tanstack/react-query'
import type { AppRouter } from '@/server/api/root'

type TRPCError = TRPCClientErrorLike<AppRouter>

interface MutationConfig<TData, _TVariables> {
  successMessage?: string | ((data: TData) => string)
  errorMessage?: string | ((error: TRPCError) => string)
  onSuccess?: (data: TData) => void | Promise<void>
  onError?: (error: TRPCError) => void
  invalidateQueries?: string[] | boolean
}

export function useTRPCMutation<TData = unknown, TVariables = unknown, TContext = unknown>(
  mutationHook: (opts?: {
    onSuccess?: (data: TData) => void | Promise<void>
    onError?: (error: TRPCError) => void
  }) => UseMutationResult<TData, TRPCError, TVariables, TContext>,
  config: MutationConfig<TData, TVariables> = {}
) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return mutationHook({
    onSuccess: async (data: TData) => {
      if (config.successMessage) {
        const message =
          typeof config.successMessage === 'function' ? config.successMessage(data) : config.successMessage

        toast({
          title: 'Sucesso!',
          description: message,
        })
      }

      if (config.invalidateQueries === true) {
        await queryClient.invalidateQueries()
      } else if (Array.isArray(config.invalidateQueries)) {
        await Promise.all(config.invalidateQueries.map((key) => queryClient.invalidateQueries({ queryKey: [key] })))
      }

      await config.onSuccess?.(data)
    },

    onError: (error: TRPCError) => {
      const message = config.errorMessage
        ? typeof config.errorMessage === 'function'
          ? config.errorMessage(error)
          : config.errorMessage
        : error.message || 'Ocorreu um erro inesperado'

      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      })

      config.onError?.(error)
    },
  })
}
