import {
  ResponseType,
  UploadInputType,
} from '@/routes/api/projeto/importar-planejamento';
import { apiClient } from '@/utils/api-client';
import { logger } from '@/utils/logger';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from './query-keys';
import { z } from 'zod';
import { importacaoPlanejamentoTable } from '@/server/database/schema';

const log = logger.child({
  context: 'planejamento-hooks',
});

// Assuming the history response type from the API
const importHistorySchema = z.array(
  z.object({
    id: z.number(),
    nomeArquivo: z.string(),
    ano: z.number(),
    semestre: z.string(),
    projetosCriados: z.number(),
    projetosComErro: z.number(),
    status: z.string(),
    erros: z.string().nullable(),
    createdAt: z.string(),
    importadoPor: z.object({
      username: z.string(),
    }),
  }),
);

export type ImportHistory = z.infer<typeof importHistorySchema>;

/**
 * Hook to get the history of planning imports
 */
export function useImportHistory() {
  return useQuery<ImportHistory>({
    queryKey: QueryKeys.planejamento.history,
    queryFn: async () => {
      const response = await apiClient.get('/projeto/importar-planejamento');
      return response.data.history;
    },
  });
}

/**
 * Hook to import a new planning file
 */
export function useImportPlanejamento() {
  const queryClient = useQueryClient();

  return useMutation<
    ResponseType,
    Error,
    { file: File; ano: number; semestre: 'SEMESTRE_1' | 'SEMESTRE_2' }
  >({
    mutationFn: async ({ file, ano, semestre }) => {
      const formData = new FormData();
      formData.append('file', file);
      const metadata: Omit<UploadInputType, 'fileName' | 'fileType'> & {
        fileName: string;
        fileType: 'xlsx' | 'csv';
      } = {
        fileName: file.name,
        fileType: file.name.endsWith('.csv') ? 'csv' : 'xlsx',
        ano,
        semestre,
      };
      formData.append('metadata', JSON.stringify(metadata));

      const response = await apiClient.post(
        '/projeto/importar-planejamento',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QueryKeys.planejamento.history,
      });
      queryClient.invalidateQueries({ queryKey: QueryKeys.projeto.list });
    },
    onError: (error) => {
      log.error({ error }, 'Erro ao importar planejamento');
    },
  });
} 