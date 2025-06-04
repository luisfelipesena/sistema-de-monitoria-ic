import {
  ProjetoTemplateInput,
  ProjetoTemplateWithRelations,
} from '@/routes/api/admin/projeto-template/-types';
import { apiClient } from '@/utils/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from './query-keys';

export function useProjetoTemplates() {
  return useQuery<ProjetoTemplateWithRelations[]>({
    queryKey: QueryKeys.projetoTemplate.list,
    queryFn: async () => {
      const response = await apiClient.get<ProjetoTemplateWithRelations[]>(
        '/admin/projeto-template',
      );
      return response.data;
    },
  });
}

export function useProjetoTemplate(id: number | string | undefined) {
  const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
  return useQuery<ProjetoTemplateWithRelations>({
    queryKey: QueryKeys.projetoTemplate.byId(numericId?.toString() ?? ''),
    queryFn: async () => {
      if (!numericId) throw new Error('ID do template inválido');
      const response = await apiClient.get<ProjetoTemplateWithRelations>(
        `/admin/projeto-template/${numericId}`,
      );
      return response.data;
    },
    enabled: !!numericId && !isNaN(numericId),
  });
}

export function useCreateProjetoTemplate() {
  const queryClient = useQueryClient();
  return useMutation<
    ProjetoTemplateWithRelations,
    Error,
    ProjetoTemplateInput
  >({
    mutationFn: async (input) => {
      const response = await apiClient.post<ProjetoTemplateWithRelations>(
        '/admin/projeto-template',
        input,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.projetoTemplate.list });
    },
  });
}

export function useUpdateProjetoTemplate() {
  const queryClient = useQueryClient();
  return useMutation<
    ProjetoTemplateWithRelations,
    Error,
    { id: number; data: Partial<ProjetoTemplateInput> }
  >({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.put<ProjetoTemplateWithRelations>(
        `/admin/projeto-template/${id}`,
        data,
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.projetoTemplate.list });
      queryClient.invalidateQueries({
        queryKey: QueryKeys.projetoTemplate.byId(variables.id.toString()),
      });
    },
  });
}

export function useDeleteProjetoTemplate() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await apiClient.delete(`/admin/projeto-template/${id}`);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.projetoTemplate.list });
      queryClient.removeQueries({
        queryKey: QueryKeys.projetoTemplate.byId(id.toString()),
      });
    },
  });
} 