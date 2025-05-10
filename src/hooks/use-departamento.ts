;
import { DepartamentoResponse } from '@/routes/api/departamento/-types';
import { apiClient } from '@/utils/api-client';
import { useQuery } from '@tanstack/react-query';
import { QueryKeys } from './query-keys';

/**
 * Hook to list all departamentos
 */
export function useDepartamentoList() {
  return useQuery<DepartamentoResponse[]>({
    queryKey: QueryKeys.departamento.list,
    queryFn: async () => {
      const response = await apiClient.get<DepartamentoResponse[]>('/departamento');
      return response.data;
    },
  });
} 