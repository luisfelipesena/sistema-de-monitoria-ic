import { DashboardMetrics } from '@/routes/api/analytics/dashboard';
import { apiClient } from '@/utils/api-client';
import { useQuery } from '@tanstack/react-query';
import { QueryKeys } from './query-keys';

export function useDashboardMetrics() {
  return useQuery<DashboardMetrics>({
    queryKey: QueryKeys.analytics.dashboard,
    queryFn: async () => {
      const response = await apiClient.get<DashboardMetrics>(
        '/analytics/dashboard',
      );
      return response.data;
    },
    refetchInterval: 5 * 60 * 1000, // Atualizar a cada 5 minutos
    staleTime: 2 * 60 * 1000, // Considerar stale após 2 minutos
  });
}
