import { api } from '@/utils/api'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

/**
 * Hook that triggers a check for pending scholarship reminders
 * (e.g., bolsistas who haven't responded in 24h).
 *
 * Runs on:
 * - Initial page load (login/refresh)
 * - Route changes (navigation between pages)
 *
 * Throttled to run at most once every 15 minutes per session
 * to avoid excessive API calls.
 */
const CHECK_INTERVAL_MS = 15 * 60 * 1000 // 15 minutes

export function useScholarshipReminders() {
  const pathname = usePathname()
  const lastCheckRef = useRef<number>(0)

  const checkRemindersMutation = api.notificacoes.checkScholarshipReminders.useMutation()

  useEffect(() => {
    const now = Date.now()
    const elapsed = now - lastCheckRef.current

    if (elapsed >= CHECK_INTERVAL_MS) {
      lastCheckRef.current = now
      checkRemindersMutation.mutate()
    }
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps
}
