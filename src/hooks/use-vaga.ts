import { apiClient } from '@/utils/api-client';
import { logger } from '@/utils/logger';
import { useMutation } from '@tanstack/react-query';

const log = logger.child({
  context: 'vaga-hooks',
});

/**
 * Hook para fazer download do termo de compromisso de uma vaga
 */
export function useDownloadTermoCompromisso() {
  return useMutation<void, Error, number>({
    mutationFn: async (vagaId: number) => {
      try {
        const response = await apiClient.get(
          `/vaga/${vagaId}/termo-compromisso`,
          {
            responseType: 'blob',
          },
        );

        if (!response.data) {
          throw new Error('Erro ao gerar termo');
        }

        const blob = response.data;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `termo-compromisso-monitor.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        log.info({ vagaId }, 'Termo de compromisso baixado com sucesso');
      } catch (error) {
        log.error({ error, vagaId }, 'Erro ao baixar termo de compromisso');
        throw error;
      }
    },
  });
}
