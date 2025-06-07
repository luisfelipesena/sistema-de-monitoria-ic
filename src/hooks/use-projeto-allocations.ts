import { apiClient } from '@/utils/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from './query-keys'; 
import type { ProjetoResponse, ProjetoAllocationsInput } from '@/routes/api/projeto/-types';
import { useToast } from './use-toast';

interface UpdateAllocationsParams {
  projetoId: number;
  data: ProjetoAllocationsInput;
}

export function useUpdateProjectAllocations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<
    ProjetoResponse, // Tipo do retorno da API em caso de sucesso
    Error,           // Tipo do erro
    UpdateAllocationsParams // Tipo do input para a mutationFn
  >({
    mutationFn: async ({ projetoId, data }) => {
      const response = await apiClient.put<ProjetoResponse>(
        `/projeto/${projetoId}`,
        data,
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidar queries relevantes para forçar a atualização dos dados na UI
      queryClient.invalidateQueries({ queryKey: QueryKeys.projeto.all }); // Exemplo: invalida lista de todos os projetos
      queryClient.invalidateQueries({ queryKey: QueryKeys.projeto.detail(variables.projetoId.toString()) });
      
      toast({
        title: "Alocações Atualizadas!",
        description: `As alocações para o projeto #${variables.projetoId} foram salvas.`,
        variant: "default",
      });
    },
    onError: (error, variables) => {
      toast({
        title: "Erro ao Atualizar Alocações",
        description: error.message || `Não foi possível salvar as alocações para o projeto #${variables.projetoId}.`,
        variant: "destructive",
      });
    },
  });
}

interface ScholarshipAllocationParams {
  projetoId: number;
  bolsasDisponibilizadas: number;
}

export function useScholarshipAllocation() {
  const queryClient = useQueryClient();

  return useMutation<ProjetoResponse, Error, ScholarshipAllocationParams>({
    mutationFn: async ({ projetoId, bolsasDisponibilizadas }) => {
      const response = await apiClient.post<ProjetoResponse>(
        `/projeto/${projetoId}/allocate-scholarships`,
        { bolsasDisponibilizadas },
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.projeto.list });
      queryClient.invalidateQueries({
        queryKey: QueryKeys.projeto.byId(data.id.toString()),
      });
    },
  });
}
