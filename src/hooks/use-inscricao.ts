import { InscricaoComDetalhes } from '@/routes/api/inscricao/-types';
import { apiClient } from '@/utils/api-client';
import { logger } from '@/utils/logger';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from './query-keys';

const log = logger.child({
  context: 'inscricao-hooks',
});

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

export function useAceitarInscricao() {
  const queryClient = useQueryClient();

  return useMutation<any, Error, number>({
    mutationFn: async (inscricaoId: number) => {
      const response = await apiClient.post(
        `/inscricao/${inscricaoId}/aceitar`,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QueryKeys.monitoria.inscricoes,
      });
    },
    onError: (error: any) => {
      log.error({ error }, 'Erro ao aceitar inscrição');
    },
  });
}

export function useRecusarInscricao() {
  const queryClient = useQueryClient();

  return useMutation<any, Error, { inscricaoId: number; motivo?: string }>({
    mutationFn: async ({
      inscricaoId,
      motivo,
    }: {
      inscricaoId: number;
      motivo?: string;
    }) => {
      const response = await apiClient.post(
        `/inscricao/${inscricaoId}/recusar`,
        {
          motivo,
        },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QueryKeys.monitoria.inscricoes,
      });
    },
    onError: (error: any) => {
      log.error({ error }, 'Erro ao recusar inscrição');
    },
  });
}

interface ApplicationGrades {
  inscricaoId: number;
  notaDisciplina: number;
  notaSelecao: number;
  coeficienteRendimento: number;
}

export function useApplicationGrading() {
  const queryClient = useQueryClient();

  return useMutation<InscricaoComDetalhes, Error, ApplicationGrades>({
    mutationFn: async ({ inscricaoId, ...grades }) => {
      const response = await apiClient.post<InscricaoComDetalhes>(
        `/inscricao/${inscricaoId}/grades`,
        grades,
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate the list of applications for the specific project
      if (data.projetoId) {
        queryClient.invalidateQueries({
          queryKey: [
            ...QueryKeys.projeto.byId(data.projetoId.toString()),
            'inscricoes',
          ],
        });
      }
    },
    onError: (error) => {
      log.error(error, 'Error submitting application grades');
    },
  });
}
