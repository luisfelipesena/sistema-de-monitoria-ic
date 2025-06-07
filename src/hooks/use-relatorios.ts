import { apiClient } from '@/utils/api-client';
import { logger } from '@/utils/logger';
import { useMutation } from '@tanstack/react-query';

const log = logger.child({
  context: 'relatorios-hooks',
});

interface ProgradExportParams {
  ano?: number;
  semestre?: 'SEMESTRE_1' | 'SEMESTRE_2';
  departamentoId?: number;
}

export function useProgradExport() {
  return useMutation<Blob, Error, ProgradExportParams | void>({
    mutationFn: async (params) => {
      const queryParams = new URLSearchParams();
      if (params?.ano) queryParams.append('ano', String(params.ano));
      if (params?.semestre) queryParams.append('semestre', params.semestre);
      if (params?.departamentoId) queryParams.append('departamentoId', String(params.departamentoId));
      
      const response = await apiClient.get(`/relatorios/planilhas-prograd?${queryParams.toString()}`, {
        responseType: 'blob',
      });
      return response.data;
    },
    onSuccess: async (blob: Blob, params) => {
      const year = params?.ano || new Date().getFullYear();
      const semester = params?.semestre === 'SEMESTRE_1' ? '1' : '2';
      const dept = params?.departamentoId ? `-dept-${params.departamentoId}` : '-completo';
      
      const fileName = `PROGRAD-Monitoria-${year}-${semester}${dept}.xlsx`;
      
      // Dynamic import to avoid SSR issues
      if (typeof window !== 'undefined') {
        const { saveAs } = await import('file-saver');
        saveAs(blob, fileName);
      }
    },
    onError: (error) => {
      log.error({ error }, 'Erro ao baixar planilha PROGRAD');
    },
  });
}
