import { AlunoInput, AlunoResponse } from '@/routes/api/aluno/-types';
import { apiClient } from '@/utils/api-client';
import { logger } from '@/utils/logger';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from './query-keys';

const log = logger.child({
  context: 'aluno-hooks',
});

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
 * Hook para criar/atualizar perfil de aluno
 */
export function useSetAluno() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AlunoInput) => {
      const response = await apiClient.post('/aluno', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.aluno.all });
      queryClient.invalidateQueries({ queryKey: QueryKeys.onboarding.status });
    },
    onError: (error) => {
      log.error({ error }, 'Erro ao salvar aluno');
    },
  });
} 