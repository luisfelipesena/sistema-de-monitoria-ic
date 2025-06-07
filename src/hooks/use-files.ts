import {
  FileListItem,
  PresignedUrlResponse,
} from '@/routes/api/files/admin/-types';
import { DeleteResponse } from '@/routes/api/files/admin/delete';
import { PresignedUrlBody } from '@/routes/api/files/admin/presigned-url';
import { FileMetadataResponse } from '@/routes/api/files/metadata';
import { apiClient } from '@/utils/api-client';
import { logger } from '@/utils/logger';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from './query-keys';

const log = logger.child({
  context: 'files-hooks',
});

/**
 * Hook para fazer upload de arquivos
 */
export function useFileUpload() {
  return useMutation({
    mutationFn: async ({
      file,
      entityType,
      entityId,
    }: {
      file: File;
      entityType: string;
      entityId: string;
    }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityType', entityType);
      formData.append('entityId', entityId);

      const response = await apiClient.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    },
    onError: (error) => {
      log.error({ error }, 'Erro ao fazer upload de arquivo');
    },
  });
}

/**
 * Hook para obter metadados de um arquivo do usuário
 */
export function useFileMetadata(fileId: string) {
  return useQuery<FileMetadataResponse>({
    queryKey: QueryKeys.files.metadata(fileId),
    queryFn: async () => {
      const response = await apiClient.post<FileMetadataResponse>('/files/metadata', { fileId });
      return response.data;
    },
    enabled: Boolean(fileId),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para acessar um arquivo do usuário atual
 */
export function useUserFileAccess() {
  return useMutation<string, Error, { fileId: string }>({
    mutationFn: async ({ fileId }) => {
      try {
        const response = await apiClient.post('/files/access', { fileId });
        
        if (!response.data.url) {
          throw new Error('URL de acesso não retornada pelo servidor');
        }
        
        return response.data.url;
      } catch (error: any) {
        if (error.response?.status === 403) {
          throw new Error('Acesso não autorizado a este arquivo');
        }
        if (error.response?.status === 404) {
          throw new Error('Arquivo não encontrado');
        }
        if (error.response?.data?.error) {
          throw new Error(error.response.data.error);
        }
        throw new Error('Erro ao acessar o arquivo');
      }
    },
    onError: (error) => {
      log.error({ error }, 'Erro ao acessar arquivo do usuário');
    },
  });
}

/**
 * Hook para acessar um arquivo (legacy)
 */
export function useFileAccess(fileId: string) {
  return useQuery({
    queryKey: QueryKeys.files.access(fileId),
    queryFn: async () => {
      if (!fileId) return null;
      const response = await apiClient.get(`/files/access/${fileId}`);
      return response.data;
    },
    enabled: Boolean(fileId),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Admin Hooks
 */

/**
 * Hook to list all files (admin only)
 */
export function useAdminFileList() {
  return useQuery<FileListItem[]>({
    queryKey: QueryKeys.files.admin.list,
    queryFn: async () => {
      const response = await apiClient.get<FileListItem[]>('/files/admin/list');
      return response.data;
    },
  });
}

/**
 * Hook to delete a file (admin only)
 */
export function useAdminFileDelete() {
  const queryClient = useQueryClient();

  return useMutation<DeleteResponse, Error, { objectName: string }>({
    mutationFn: async ({ objectName }) => {
      const response = await apiClient.post<DeleteResponse>(
        '/files/admin/delete',
        { objectName },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.files.admin.list });
    },
  });
}

/**
 * Hook to generate a presigned URL (admin only)
 */
export function useAdminFilePresignedUrl() {
  return useMutation<PresignedUrlResponse, Error, PresignedUrlBody>({
    mutationFn: async ({ objectName }) => {
      const response = await apiClient.post<PresignedUrlResponse>(
        '/files/admin/presigned-url',
        { objectName },
      );
      return response.data;
    },
  });
}
