import { FileAccessResponse } from '@/routes/api/files/access/$fileId';
import { FileListItem, PresignedUrlResponse } from '@/routes/api/files/admin/-admin-types';
import { DeleteResponse } from '@/routes/api/files/admin/delete';
import { PresignedUrlBody } from '@/routes/api/files/admin/presigned-url';
import { UploadResponse } from '@/routes/api/files/upload';
import { apiClient } from '@/utils/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from './query-keys';


/**
 * Hook to upload a file
 */
export function useFileUpload() {
  return useMutation<UploadResponse, Error, FormData>({
    mutationFn: async (formData) => {
      const result = await apiClient.post<UploadResponse>('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return result.data;
    },
  });
}

/**
 * Hook to access a file by ID
 */
export function useFileAccess(fileId: string) {
  return useQuery<FileAccessResponse>({
    queryKey: QueryKeys.files.byId(fileId),
    queryFn: async () => {
      const response = await apiClient.get<FileAccessResponse>(`/files/access/${fileId}`);
      return response.data;
    },
    enabled: !!fileId,
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
      const response = await apiClient.post<DeleteResponse>('/files/admin/delete', { objectName });
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
      const response = await apiClient.post<PresignedUrlResponse>('/files/admin/presigned-url', { objectName });
      return response.data;
    },
  });
}
