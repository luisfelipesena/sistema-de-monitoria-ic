import { InscricaoComDetalhes } from '@/routes/api/inscricao/-types';
import { apiClient } from '@/utils/api-client';
import { useQuery } from '@tanstack/react-query';
import { QueryKeys } from './query-keys';

export function useMinhasInscricoes() {
  return useQuery<InscricaoComDetalhes[]>({
    queryKey: QueryKeys.monitoria.inscricoes,
    queryFn: async () => {
      const response =
        await apiClient.get<InscricaoComDetalhes[]>('/inscricao');
      return response.data;
    },
  });
}

export function useInscricoesProjeto(projetoId: number) {
  return useQuery<InscricaoComDetalhes[]>({
    queryKey: [...QueryKeys.projeto.byId(projetoId.toString()), 'inscricoes'],
    queryFn: async () => {
      const response = await apiClient.get<InscricaoComDetalhes[]>(
        `/projeto/${projetoId}/inscricoes`,
      );
      return response.data;
    },
    enabled: !!projetoId,
  });
}
