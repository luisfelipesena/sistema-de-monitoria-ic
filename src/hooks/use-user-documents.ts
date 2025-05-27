import { apiClient } from '@/utils/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from './query-keys';

interface UserDocument {
  id: string;
  name: string;
  type: 'historico_escolar' | 'comprovante_matricula';
  fileId?: string;
  fileName?: string;
  uploadDate?: Date;
  status: 'missing' | 'valid' | 'expired';
  needsUpdate?: boolean;
}

export function useUserDocuments() {
  return useQuery<UserDocument[]>({
    queryKey: QueryKeys.userDocuments.list,
    queryFn: async () => {
      const response = await apiClient.get<UserDocument[]>('/user/documents');
      return response.data;
    },
  });
}

export function useUpdateUserDocument() {
  const queryClient = useQueryClient();

  return useMutation<
    any,
    Error,
    {
      documentType: 'historico_escolar' | 'comprovante_matricula';
      file: File;
    }
  >({
    mutationFn: async ({ documentType, file }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityType', documentType);
      formData.append('entityId', 'user-document');

      const response = await apiClient.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.userDocuments.list });
    },
  });
}
