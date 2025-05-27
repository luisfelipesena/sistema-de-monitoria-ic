import { apiClient } from '@/utils/api-client';
import { logger } from '@/utils/logger';
import { useMutation } from '@tanstack/react-query';

const log = logger.child({
  context: 'notificacoes-hooks',
});

interface NotificacaoManualInput {
  tipo:
    | 'SELECAO_RESULTADO'
    | 'PROJETO_APROVADO'
    | 'INSCRICAO_CONFIRMADA'
    | 'MANUAL';
  projetoId?: number;
  destinatarios: string[];
  assunto: string;
  conteudo: string;
}

export function useEnviarNotificacaoManual() {
  return useMutation<any, Error, NotificacaoManualInput>({
    mutationFn: async (input) => {
      const response = await apiClient.post('/notificacoes/manual', input);
      return response.data;
    },
    onError: (error) => {
      log.error({ error }, 'Erro ao enviar notificação manual');
    },
  });
}

export function useNotifyProjectResults() {
  return useMutation<any, Error, number>({
    mutationFn: async (projetoId: number) => {
      const response = await apiClient.post(
        `/projeto/${projetoId}/notify-results`,
      );
      return response.data;
    },
    onError: (error) => {
      log.error({ error }, 'Erro ao notificar resultados do projeto');
    },
  });
}
