import type { AlunoInput, AlunoResponse } from '@/routes/api/aluno';
import { apiClient } from '@/utils/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from './query-keys';

/**
 * Hook para obter dados do aluno
 */
export function useAluno() {
  return useQuery<AlunoResponse>({
    queryKey: QueryKeys.aluno.all,
    queryFn: async () => {
      const response = await apiClient.get<AlunoResponse>('/aluno');
      return response.data;
    },
    retry: false,
  });
}

/**
 * Hook para atualizar dados do aluno
 */
export function useSetAluno() {
  const queryClient = useQueryClient();

  return useMutation<AlunoResponse, Error, AlunoInput>({
    mutationFn: async (data: AlunoInput) => {
      const response = await apiClient.post<AlunoResponse>('/aluno', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.aluno.all });
    },
  });
} 