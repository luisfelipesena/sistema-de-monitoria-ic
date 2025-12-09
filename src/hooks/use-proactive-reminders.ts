import { api } from '@/utils/api'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

type ProactiveReminderResult = {
  type: string
  description: string
  sent: boolean
  count: number
  reason: string
}

type UseProactiveRemindersOptions = {
  /**
   * Whether the hook should execute proactive reminders automatically.
   * Set to false to only check status without sending.
   */
  autoExecute?: boolean
  /**
   * Callback when reminders are sent successfully
   */
  onSuccess?: (results: ProactiveReminderResult[], totalSent: number) => void
  /**
   * Whether to show toast notifications
   */
  showToasts?: boolean
}

/**
 * Hook for proactive reminder system.
 * When admin accesses certain pages, this hook automatically checks
 * and executes pending reminders.
 *
 * Usage:
 * ```tsx
 * // In admin dashboard or notifications page
 * useProactiveReminders({ autoExecute: true, showToasts: true })
 * ```
 */
export function useProactiveReminders(options: UseProactiveRemindersOptions = {}) {
  const { autoExecute = true, onSuccess, showToasts = true } = options

  const [hasExecuted, setHasExecuted] = useState(false)
  const executionRef = useRef(false)

  // Get reminder status
  const {
    data: reminderStatus,
    isLoading: isLoadingStatus,
    refetch: refetchStatus,
  } = api.notificacoes.getProactiveReminderStatus.useQuery(undefined, {
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  })

  // Execute proactive reminders mutation
  const executeRemindersMutation = api.notificacoes.executeProactiveReminders.useMutation({
    onSuccess: (data) => {
      setHasExecuted(true)

      // Filter only reminders that actually sent notifications
      const sentReminders = data.executed.filter((r) => r.sent && r.count > 0)

      if (sentReminders.length > 0 && showToasts) {
        // Show summary toast
        const totalSent = sentReminders.reduce((sum, r) => sum + r.count, 0)
        const reminderTypes = sentReminders.map((r) => r.description).join(', ')

        toast.success(`📬 Lembretes automáticos enviados`, {
          description: `${totalSent} notificações enviadas: ${reminderTypes}`,
          duration: 6000,
        })
      }

      onSuccess?.(data.executed, data.totalSent)
      refetchStatus()
    },
    onError: (error) => {
      if (showToasts) {
        toast.error('Erro ao executar lembretes', {
          description: error.message,
        })
      }
    },
  })

  // Auto-execute on mount (only once)
  useEffect(() => {
    if (autoExecute && !executionRef.current && reminderStatus) {
      // Check if there are any reminders that need execution
      const hasPendingReminders = reminderStatus.some((r) => r.shouldExecute)

      if (hasPendingReminders) {
        executionRef.current = true
        executeRemindersMutation.mutate()
      }
    }
  }, [autoExecute, reminderStatus, executeRemindersMutation])

  // Count pending reminders
  const pendingCount = reminderStatus?.filter((r) => r.shouldExecute).length ?? 0

  return {
    /** Status of all reminder types */
    reminderStatus,
    /** Whether status is loading */
    isLoadingStatus,
    /** Whether reminders were executed in this session */
    hasExecuted,
    /** Number of reminders pending execution */
    pendingCount,
    /** Whether execution is in progress */
    isExecuting: executeRemindersMutation.isPending,
    /** Manually trigger reminder execution */
    executeReminders: () => executeRemindersMutation.mutate(),
    /** Refresh the status */
    refetchStatus,
    /** Last execution result */
    lastResult: executeRemindersMutation.data,
  }
}

/**
 * Simpler hook that just executes reminders on mount without returning status.
 * Use this for pages where you just want background execution.
 */
export function useProactiveRemindersBackground() {
  const executedRef = useRef(false)

  const executeRemindersMutation = api.notificacoes.executeProactiveReminders.useMutation({
    onSuccess: (data) => {
      const sentReminders = data.executed.filter((r) => r.sent && r.count > 0)

      if (sentReminders.length > 0) {
        const totalSent = sentReminders.reduce((sum, r) => sum + r.count, 0)
        toast.info(`📬 ${totalSent} lembretes automáticos enviados`, {
          duration: 4000,
        })
      }
    },
  })

  useEffect(() => {
    if (!executedRef.current) {
      executedRef.current = true
      // Small delay to not block initial page load
      const timer = setTimeout(() => {
        executeRemindersMutation.mutate()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [executeRemindersMutation])
}
