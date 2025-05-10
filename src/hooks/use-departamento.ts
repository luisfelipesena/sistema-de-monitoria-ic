import { apiClient } from '@/utils/api-client';
import { useQuery } from '@tanstack/react-query';
import { QueryKeys } from './query-keys';

export interface Departamento {
  id: number;
  nome: string;
  sigla: string;
  // Add other fields that exist in your departamento table
}

/**
 * Hook to list all departamentos
 */
export function useDepartamentoList() {
  return useQuery<Departamento[]>({
    queryKey: QueryKeys.departamento.list,
    queryFn: async () => {
      const response = await apiClient.get<Departamento[]>('/departamento');
      return response.data;
    },
  });
} 