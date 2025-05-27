import { apiClient } from '@/utils/api-client';
import { logger } from '@/utils/logger';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from './query-keys';

const log = logger.child({
  context: 'selection-process-hooks',
});

export interface CriteriosAvaliacao {
  cr: number;
  experienciaPrevia: number;
  motivacao: number;
  disponibilidade: number;
  entrevista?: number;
}

export interface AvaliacaoCandidato {
  inscricaoId: number;
  criterios: CriteriosAvaliacao;
  notaFinal: number;
  status: 'PENDENTE' | 'AVALIADO' | 'SELECIONADO' | 'REJEITADO';
  observacoes?: string;
  prioridade?: number;
}

export interface SelectionProcessData {
  projeto: {
    id: number;
    titulo: string;
    status: string;
    vagasDisponiveis: {
      bolsistas: number;
      voluntarios: number;
    };
  };
  candidatos: Array<{
    inscricaoId: number;
    tipoVagaPretendida: string;
    status: string;
    aluno: {
      id: number;
      nome: string;
      email: string;
      matricula: string;
      cr: number;
    };
    avaliacao?: {
      criterios: CriteriosAvaliacao;
      notaFinal: number;
      observacoes?: string;
      dataAvaliacao: string;
    };
    dataInscricao: string;
  }>;
  estatisticas: {
    totalCandidatos: number;
    candidatosBolsista: number;
    candidatosVoluntario: number;
    avaliados: number;
    selecionados: number;
    vagasDisponiveis: {
      bolsistas: number;
      voluntarios: number;
    };
  };
}

export interface SelecaoFinal {
  selecionados: Array<{
    inscricaoId: number;
    tipoVaga: 'BOLSISTA' | 'VOLUNTARIO';
    prioridade?: number;
  }>;
  enviarNotificacoes?: boolean;
  observacoesGerais?: string;
}

export function useSelectionProcess(projetoId: number) {
  return useQuery<SelectionProcessData>({
    queryKey: QueryKeys.projeto.selectionProcess(projetoId),
    queryFn: async () => {
      const response = await apiClient.get<SelectionProcessData>(
        `/projeto/${projetoId}/selection-process`,
      );
      return response.data;
    },
    enabled: !!projetoId,
  });
}

export function useBulkEvaluation() {
  const queryClient = useQueryClient();

  return useMutation<
    any,
    Error,
    {
      projetoId: number;
      avaliacoes: AvaliacaoCandidato[];
      autoCalcularNota?: boolean;
    }
  >({
    mutationFn: async ({ projetoId, avaliacoes, autoCalcularNota = true }) => {
      const response = await apiClient.post(
        `/projeto/${projetoId}/selection-process`,
        {
          avaliacoes,
          autoCalcularNota,
        },
      );
      return response.data;
    },
    onSuccess: (_, { projetoId }) => {
      queryClient.invalidateQueries({
        queryKey: QueryKeys.projeto.selectionProcess(projetoId),
      });
    },
    onError: (error: any) => {
      log.error({ error }, 'Erro ao salvar avaliações em lote');
    },
  });
}

export function useFinalizeSelection() {
  const queryClient = useQueryClient();

  return useMutation<any, Error, { projetoId: number } & SelecaoFinal>({
    mutationFn: async ({ projetoId, ...selecaoData }) => {
      const response = await apiClient.post(
        `/projeto/${projetoId}/finalize-selection`,
        selecaoData,
      );
      return response.data;
    },
    onSuccess: (_, { projetoId }) => {
      queryClient.invalidateQueries({
        queryKey: QueryKeys.projeto.selectionProcess(projetoId),
      });
      queryClient.invalidateQueries({
        queryKey: QueryKeys.projeto.inscricoes(projetoId),
      });
    },
    onError: (error: any) => {
      log.error({ error }, 'Erro ao finalizar seleção');
    },
  });
}

export function useSelectionStatus(projetoId: number) {
  return useQuery<{
    estatisticas: {
      total: number;
      pendentes: number;
      avaliados: number;
      selecionadosBolsista: number;
      selecionadosVoluntario: number;
      rejeitados: number;
      aceitos: number;
      recusados: number;
    };
    processoFinalizado: boolean;
    proximaEtapa: string;
  }>({
    queryKey: QueryKeys.projeto.selectionStatus(projetoId),
    queryFn: async () => {
      const response = await apiClient.get(
        `/projeto/${projetoId}/finalize-selection`,
      );
      return response.data;
    },
    enabled: !!projetoId,
  });
}
