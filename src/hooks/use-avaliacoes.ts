import { apiClient } from '@/utils/api-client';
import { logger } from '@/utils/logger';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from './query-keys';

const log = logger.child({
  context: 'avaliacoes-hooks',
});

interface AvaliacaoData {
  inscricaoId: number;
  notaDisciplina: number;
  notaFinal: number;
  status: 'PENDENTE' | 'SELECIONADO' | 'REJEITADO';
}

export function useSalvarAvaliacoes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projetoId,
      avaliacoes,
    }: {
      projetoId: number;
      avaliacoes: AvaliacaoData[];
    }) => {
      const response = await apiClient.post(
        `/projeto/${projetoId}/avaliacoes`,
        avaliacoes,
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({
        queryKey: QueryKeys.projeto.inscricoes(variables.projetoId),
      });
      queryClient.invalidateQueries({
        queryKey: QueryKeys.projeto.byId(variables.projetoId.toString()),
      });
    },
    onError: (error) => {
      log.error({ error }, 'Erro ao salvar avaliações');
    },
  });
}
