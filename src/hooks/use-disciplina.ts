import { DisciplinaResponse } from '@/routes/api/disciplina/-types';
import { apiClient } from '@/utils/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from './query-keys';

export function useDisciplinas(departamentoId?: number) {
  return useQuery<DisciplinaResponse[]>({
    queryKey: departamentoId
      ? [...QueryKeys.disciplina.list, departamentoId]
      : QueryKeys.disciplina.list,
    queryFn: async () => {
      const params = departamentoId ? `?departamentoId=${departamentoId}` : '';
      const response = await apiClient.get<DisciplinaResponse[]>(
        `/disciplina${params}`,
      );
      return response.data;
    },
  });
}

export function useCreateDisciplina() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      nome: string;
      codigo: string;
      departamentoId: number;
    }) => {
      const response = await apiClient.post('/disciplina', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.disciplina.list });
    },
  });
}

export function useUpdateDisciplina() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: { nome: string; codigo: string; departamentoId: number };
    }) => {
      const response = await apiClient.put(`/disciplina/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.disciplina.list });
    },
  });
}

export function useDeleteDisciplina() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.delete(`/disciplina/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.disciplina.list });
    },
  });
}
