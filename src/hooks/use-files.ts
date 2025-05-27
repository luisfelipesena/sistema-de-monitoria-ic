import {
  FileListItem,
  PresignedUrlResponse,
} from '@/routes/api/files/admin/-types';
import { DeleteResponse } from '@/routes/api/files/admin/delete';
import { PresignedUrlBody } from '@/routes/api/files/admin/presigned-url';
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
 * Hook para acessar um arquivo
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
