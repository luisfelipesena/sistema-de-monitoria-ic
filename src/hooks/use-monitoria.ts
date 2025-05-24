import {
  CriarInscricaoInput,
  VagaDisponivel,
} from '@/routes/api/monitoria/-types';
import { apiClient } from '@/utils/api-client';
import { logger } from '@/utils/logger';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from './query-keys';

const log = logger.child({
  context: 'monitoria-hooks',
});

export function useVagasDisponiveis() {
  return useQuery<VagaDisponivel[]>({
    queryKey: QueryKeys.monitoria.vagas,
    queryFn: async () => {
      const response =
        await apiClient.get<VagaDisponivel[]>('/monitoria/vagas');
      return response.data;
    },
  });
}

export function useCriarInscricao() {
  const queryClient = useQueryClient();

  return useMutation<any, Error, CriarInscricaoInput>({
    mutationFn: async (input) => {
      const response = await apiClient.post('/monitoria/inscricao', input);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QueryKeys.monitoria.inscricoes,
      });
    },
    onError: (error) => {
      log.error({ error }, 'Erro ao criar inscrição');
    },
  });
}
