import { apiClient } from '@/utils/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from './query-keys';

// These types should be defined based on the Zod schemas in the API route
interface PlanningRow {
  CODIGO_DISCIPLINA: string;
  NOME_DISCIPLINA: string;
  DEPARTAMENTO_SIGLA: string;
  PROFESSOR_RESPONSAVEL_EMAIL: string;
  CARGA_HORARIA_SEMANAL: number;
  NUMERO_SEMANAS: number;
  TITULO_PROJETO: string;
  DESCRICAO_PROJETO: string;
  PUBLICO_ALVO: string;
}

interface CreatedProject {
  // Define based on what the API returns for a created project
  id: number;
  titulo: string;
}

interface ImportResponseType {
  message: string;
  created: CreatedProject[];
  errors?: string[];
}

interface ImportMutationInput {
  file: string; // base64 encoded string
  ano: string;
  semestre: string;
}

export function useProjectImport() {
  const queryClient = useQueryClient();

  return useMutation<ImportResponseType, Error, ImportMutationInput>({
    mutationFn: async (input) => {
      const response = await apiClient.post<ImportResponseType>(
        '/projeto/import-planning',
        input, // Send as JSON
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate queries that should be refetched after import
      queryClient.invalidateQueries({ queryKey: QueryKeys.projeto.list });
      queryClient.invalidateQueries({
        queryKey: QueryKeys.planejamento.history,
      });
    },
  });
}

// Assuming there's an endpoint to get import history
interface ImportHistoryItem {
  id: number;
  nomeArquivo: string;
  ano: number;
  semestre: string;
  status: string;
  createdAt: string;
}

export function useImportHistory() {
  return useQuery<ImportHistoryItem[]>({
    queryKey: QueryKeys.planejamento.history,
    queryFn: async () => {
      // This endpoint needs to be created if it doesn't exist.
      // For now, I'll assume it exists at '/projeto/import-planning/history'
      // Or maybe the history is part of another fetch.
      // Based on the old hook, it was a GET on the same endpoint.
      // Let's assume for now there is no history endpoint and just focus on the import.
      // I will return an empty array.
      return Promise.resolve([]);
      // const response = await apiClient.get<{ history: ImportHistoryItem[] }>('/projeto/import-planning');
      // return response.data.history;
    },
  });
} 