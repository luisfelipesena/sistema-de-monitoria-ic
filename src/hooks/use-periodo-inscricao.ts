import {
  PeriodoInscricaoComStatus,
  PeriodoInscricaoInput,
  PeriodoInscricaoResponse,
} from '@/routes/api/periodo-inscricao/-types';
import { apiClient } from '@/utils/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from './query-keys';

export function usePeriodosInscricao() {
  return useQuery<PeriodoInscricaoComStatus[]>({
    queryKey: QueryKeys.periodoInscricao.list,
    queryFn: async () => {
      const response =
        await apiClient.get<PeriodoInscricaoComStatus[]>('/periodo-inscricao');
      return response.data;
    },
  });
}

export function usePeriodoInscricao(id: number) {
  return useQuery<PeriodoInscricaoResponse>({
    queryKey: QueryKeys.periodoInscricao.byId(id.toString()),
    queryFn: async () => {
      const response = await apiClient.get<PeriodoInscricaoResponse>(
        `/periodo-inscricao/${id}`,
      );
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreatePeriodoInscricao() {
  const queryClient = useQueryClient();

  return useMutation<PeriodoInscricaoResponse, Error, PeriodoInscricaoInput>({
    mutationFn: async (input) => {
      const response = await apiClient.post<PeriodoInscricaoResponse>(
        '/periodo-inscricao',
        input,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QueryKeys.periodoInscricao.list,
      });
    },
  });
}

export function useUpdatePeriodoInscricao() {
  const queryClient = useQueryClient();

  return useMutation<
    PeriodoInscricaoResponse,
    Error,
    { id: number; data: PeriodoInscricaoInput }
  >({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.put<PeriodoInscricaoResponse>(
        `/periodo-inscricao/${id}`,
        data,
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: QueryKeys.periodoInscricao.list,
      });
      queryClient.invalidateQueries({
        queryKey: QueryKeys.periodoInscricao.byId(variables.id.toString()),
      });
    },
  });
}

export function useDeletePeriodoInscricao() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await apiClient.delete(`/periodo-inscricao/${id}`);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: QueryKeys.periodoInscricao.list,
      });
      queryClient.removeQueries({
        queryKey: QueryKeys.periodoInscricao.byId(id.toString()),
      });
    },
  });
}
