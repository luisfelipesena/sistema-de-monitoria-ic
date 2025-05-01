import {
  FileListItem,
  PresignedUrlResponse
} from '@/routes/api/files/admin/-admin-types';
import { fetchApi } from '@/utils/fetchApi';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useAdminFilesList() {
  return useQuery<FileListItem[], Error>({
    queryKey: ['adminFiles'],
    queryFn: async () => {
      const response = await fetchApi('/files/admin/list');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao buscar arquivos');
      }
      return response.json();
    },
  });
}

export function useAdminFileDelete() {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, string>({
    mutationFn: async (objectName) => {
      const response = await fetchApi('/files/admin/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ objectName }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao excluir arquivo');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminFiles'] });
    },
  });
}

export function useFilePresignedUrl() {
  return useMutation<PresignedUrlResponse, Error, string>({
    mutationFn: async (objectName) => {
      const response = await fetchApi('/files/admin/presigned-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ objectName }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao obter URL de visualização');
      }
      return response.json();
    },
  });
} 