import { apiClient } from '@/utils/api-client';
import { logger } from '@/utils/logger';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

const log = logger.child({
  context: 'relatorios-hooks',
});

interface ProgradExportParams {
  ano?: number;
  semestre?: 'SEMESTRE_1' | 'SEMESTRE_2';
  departamentoId?: number;
}

export function useProgradExport() {
  return useMutation({
    mutationFn: async (params: ProgradExportParams) => {
      try {
        const response = await apiClient.get(
          '/relatorios/pedidos-monitoria-prograd',
          {
            params,
            responseType: 'blob',
          },
        );
        
        const contentDisposition = response.headers['content-disposition'];
        let fileName = 'relatorio-prograd.xlsx';
        if (contentDisposition) {
          const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
          if (fileNameMatch && fileNameMatch.length > 1) {
            fileName = fileNameMatch[1];
          }
        }
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(url);
        link.remove();
        return response.data;

      } catch (error: any) {
        if (error.response && error.response.status === 404) {
          // The backend now returns a JSON object with a message on 404
          const responseData = JSON.parse(await error.response.data.text());
          toast.info('Nenhum dado encontrado', {
            description: responseData.message || 'Não há projetos que correspondam aos filtros selecionados.',
          });
        } else {
            throw new Error('Falha ao gerar o relatório.');
        }
      }
    },
  });
}
