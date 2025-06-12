import { api } from '@/utils/api'

/**
 * Hook para verificar o status de onboarding do usuário
 */
export function useOnboardingStatus() {
  return api.onboarding.getStatus.useQuery()
}
