import { apiClient } from '@/utils/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from './query-keys';
import type { ResponseType, UploadInputType } from '@/routes/api/projeto/importar-planejamento';

interface ImportHistoryItem {
  id: number;
  fileId: string;
  nomeArquivo: string;
  ano: number;
  semestre: 'SEMESTRE_1' | 'SEMESTRE_2';
  totalProjetos: number;
  projetosCriados: number;
  projetosComErro: number;
  status: string;
  erros: string | null;
  createdAt: string;
  importadoPor: {
    username: string;
    email: string;
  };
}

interface ImportMutationInput {
  file: File;
  metadata: UploadInputType;
}

export function useImportPlanejamento() {
  const queryClient = useQueryClient();

  return useMutation<ResponseType, Error, ImportMutationInput>({
    mutationFn: async ({ file, metadata }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('metadata', JSON.stringify(metadata));

      const response = await apiClient.post<ResponseType>(
        '/projeto/importar-planejamento',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.importHistory.list });
    },
  });
}

export function useImportHistory() {
  return useQuery<ImportHistoryItem[]>({
    queryKey: QueryKeys.importHistory.list,
    queryFn: async () => {
      const response = await apiClient.get<{ history: ImportHistoryItem[] }>('/projeto/importar-planejamento');
      return response.data.history;
    },
  });
} 