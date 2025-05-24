import {
  ProjetoInput,
  ProjetoListItem,
  ProjetoResponse,
} from '@/routes/api/projeto/-types';
import { apiClient } from '@/utils/api-client';
import { logger } from '@/utils/logger';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from './query-keys';

const log = logger.child({
  context: 'projeto-hooks',
});

export function useProjetos() {
  return useQuery<ProjetoListItem[]>({
    queryKey: QueryKeys.projeto.list,
    queryFn: async () => {
      const response = await apiClient.get<ProjetoListItem[]>('/projeto');
      return response.data;
    },
  });
}

export function useProjeto(id: number) {
  return useQuery<ProjetoResponse>({
    queryKey: QueryKeys.projeto.byId(id.toString()),
    queryFn: async () => {
      const response = await apiClient.get<ProjetoResponse>(`/projeto/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateProjeto() {
  const queryClient = useQueryClient();

  return useMutation<ProjetoResponse, Error, ProjetoInput>({
    mutationFn: async (input) => {
      const response = await apiClient.post<ProjetoResponse>('/projeto', input);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.projeto.list });
    },
  });
}

export function useSubmitProjeto() {
  const queryClient = useQueryClient();

  return useMutation<any, Error, number>({
    mutationFn: async (projetoId) => {
      const response = await apiClient.post(`/projeto/${projetoId}/submit`);
      return response.data;
    },
    onSuccess: (_, projetoId) => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.projeto.list });
      queryClient.invalidateQueries({
        queryKey: QueryKeys.projeto.byId(projetoId.toString()),
      });
    },
  });
}

export function useApproveProjeto() {
  const queryClient = useQueryClient();

  return useMutation<
    any,
    Error,
    { projetoId: number; bolsasDisponibilizadas: number; observacoes?: string }
  >({
    mutationFn: async ({ projetoId, bolsasDisponibilizadas, observacoes }) => {
      const response = await apiClient.post(`/projeto/${projetoId}/approve`, {
        bolsasDisponibilizadas,
        observacoes,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.projeto.list });
      queryClient.invalidateQueries({
        queryKey: QueryKeys.projeto.byId(variables.projetoId.toString()),
      });
    },
  });
}

export function useRejectProjeto() {
  const queryClient = useQueryClient();

  return useMutation<any, Error, { projetoId: number; motivo: string }>({
    mutationFn: async ({ projetoId, motivo }) => {
      const response = await apiClient.post(`/projeto/${projetoId}/reject`, {
        motivo,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.projeto.list });
      queryClient.invalidateQueries({
        queryKey: QueryKeys.projeto.byId(variables.projetoId.toString()),
      });
    },
  });
}

export function useUpdateProjeto() {
  const queryClient = useQueryClient();

  return useMutation<
    ProjetoResponse,
    Error,
    { id: number; data: Partial<ProjetoInput> }
  >({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.put<ProjetoResponse>(
        `/projeto/${id}`,
        data,
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.projeto.list });
      queryClient.invalidateQueries({
        queryKey: QueryKeys.projeto.byId(data.id.toString()),
      });
    },
  });
}
