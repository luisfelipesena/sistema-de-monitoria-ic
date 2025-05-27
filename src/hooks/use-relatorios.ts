import { apiClient } from '@/utils/api-client';
import { logger } from '@/utils/logger';
import { useMutation } from '@tanstack/react-query';

const log = logger.child({
  context: 'relatorios-hooks',
});

export function useDownloadPlanilhaPrograd() {
  return useMutation<Blob, Error, void>({
    mutationFn: async () => {
      const response = await apiClient.get('/relatorios/planilhas-prograd', {
        responseType: 'blob',
      });
      return response.data;
    },
    onSuccess: (blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `planilha-prograd-${new Date().getFullYear()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onError: (error) => {
      log.error({ error }, 'Erro ao baixar planilha PROGRAD');
    },
  });
}
