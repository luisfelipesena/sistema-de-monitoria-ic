import type { OnboardingStatus } from '@/routes/api/onboarding/status';
import { apiClient } from '@/utils/api-client';
import { useQuery } from '@tanstack/react-query';
import { QueryKeys } from './query-keys';

/**
 * Hook para verificar o status de onboarding do usuário
 */
export function useOnboardingStatus() {
  return useQuery<OnboardingStatus>({
    queryKey: QueryKeys.onboarding.status,
    queryFn: async () => {
      const response = await apiClient.get<OnboardingStatus>('/onboarding/status');
      return response.data;
    },
    retry: false,
  });
} 