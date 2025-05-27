import {
  DepartamentoInput,
  DepartamentoResponse,
} from '@/routes/api/department/-types';
import { apiClient } from '@/utils/api-client';
import { logger } from '@/utils/logger';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from './query-keys';

const log = logger.child({
  context: 'departamento-hooks',
});

/**
 * Hook to list all departamentos
 */
export function useDepartamentoList() {
  return useQuery<DepartamentoResponse[]>({
    queryKey: QueryKeys.departamento.list,
    queryFn: async () => {
      const response =
        await apiClient.get<DepartamentoResponse[]>('/department');
      return response.data;
    },
  });
}

export function useCreateDepartamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: DepartamentoInput) => {
      const response = await apiClient.post('/department', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.departamento.list });
    },
    onError: (error) => {
      log.error({ error }, 'Erro ao criar departamento');
    },
  });
}

export function useUpdateDepartamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: DepartamentoInput;
    }) => {
      const response = await apiClient.put(`/department/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.departamento.list });
    },
    onError: (error) => {
      log.error({ error }, 'Erro ao atualizar departamento');
    },
  });
}

export function useDeleteDepartamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.delete(`/department/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.departamento.list });
    },
    onError: (error) => {
      log.error({ error }, 'Erro ao excluir departamento');
    },
  });
}
