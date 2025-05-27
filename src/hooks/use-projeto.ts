import {
  ProjectInput,
  ProjectListItem,
  ProjetoInput,
  ProjetoResponse,
} from '@/routes/api/project/-types';
import { apiClient } from '@/utils/api-client';
import { logger } from '@/utils/logger';
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { QueryKeys } from './query-keys';

const log = logger.child({
  context: 'projeto-hooks',
});

// Document types
type DocumentResponse = {
  id: number;
  fileId: string;
  tipoDocumento:
    | 'PROPOSTA_ORIGINAL'
    | 'PROPOSTA_ASSINADA_PROFESSOR'
    | 'PROPOSTA_ASSINADA_ADMIN'
    | 'ATA_SELECAO';
  assinadoPor: {
    id: number;
    username: string;
    email: string;
    role: 'admin' | 'professor' | 'student';
  } | null;
  observacoes: string | null;
  createdAt: Date;
};

export const projectsQueryOptions = () =>
  queryOptions({
    queryKey: ['projects'],
    queryFn: async (): Promise<ProjectListItem[]> => {
      const response = await fetch('/api/project');
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      return response.json();
    },
  });

export const useProjects = () => {
  return useQuery(projectsQueryOptions());
};

export const useCreateProject = () => {
  return useMutation({
    mutationFn: async (data: ProjectInput): Promise<Response> => {
      const response = await fetch('/api/project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create project');
      }

      return response.json();
    },
  });
};

export function useProjeto(id: number) {
  return useQuery<ProjetoResponse>({
    queryKey: QueryKeys.projeto.byId(id.toString()),
    queryFn: async () => {
      const response = await apiClient.get<ProjetoResponse>(`/projeto/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useSubmitProjeto() {
  const queryClient = useQueryClient();

  return useMutation<any, Error, number>({
    mutationFn: async (projetoId) => {
      const response = await apiClient.post(`/projeto/${projetoId}/submit`);
      return response.data;
    },
    onSuccess: (_, projetoId) => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.projeto.list });
      queryClient.invalidateQueries({
        queryKey: QueryKeys.projeto.byId(projetoId.toString()),
      });
    },
  });
}

export function useApproveProjeto() {
  const queryClient = useQueryClient();

  return useMutation<
    any,
    Error,
    { projetoId: number; bolsasDisponibilizadas: number; observacoes?: string }
  >({
    mutationFn: async ({ projetoId, bolsasDisponibilizadas, observacoes }) => {
      const response = await apiClient.post(`/projeto/${projetoId}/approve`, {
        bolsasDisponibilizadas,
        observacoes,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.projeto.list });
      queryClient.invalidateQueries({
        queryKey: QueryKeys.projeto.byId(variables.projetoId.toString()),
      });
    },
  });
}

export function useRejectProjeto() {
  const queryClient = useQueryClient();

  return useMutation<any, Error, { projetoId: number; motivo: string }>({
    mutationFn: async ({ projetoId, motivo }) => {
      const response = await apiClient.post(`/projeto/${projetoId}/reject`, {
        motivo,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.projeto.list });
      queryClient.invalidateQueries({
        queryKey: QueryKeys.projeto.byId(variables.projetoId.toString()),
      });
    },
  });
}

export function useUpdateProjeto() {
  const queryClient = useQueryClient();

  return useMutation<
    ProjetoResponse,
    Error,
    { id: number; data: Partial<ProjetoInput> }
  >({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.put<ProjetoResponse>(
        `/projeto/${id}`,
        data,
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

// Document management hooks
export function useProjetoDocuments(projetoId: number) {
  return useQuery<DocumentResponse[]>({
    queryKey: QueryKeys.projeto.documents(projetoId),
    queryFn: async () => {
      const response = await apiClient.get<DocumentResponse[]>(
        `/projeto/${projetoId}/documents`,
      );
      return response.data;
    },
    enabled: !!projetoId,
  });
}

export function useUploadProjetoDocument() {
  const queryClient = useQueryClient();

  return useMutation<
    any,
    Error,
    {
      projetoId: number;
      file: File;
      tipoDocumento: 'PROPOSTA_ASSINADA_PROFESSOR' | 'PROPOSTA_ASSINADA_ADMIN';
      observacoes?: string;
    }
  >({
    mutationFn: async ({ projetoId, file, tipoDocumento, observacoes }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tipoDocumento', tipoDocumento);
      if (observacoes) {
        formData.append('observacoes', observacoes);
      }

      const response = await apiClient.post(
        `/projeto/${projetoId}/upload-document`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QueryKeys.projeto.documents(variables.projetoId),
      });
      queryClient.invalidateQueries({
        queryKey: QueryKeys.projeto.byId(variables.projetoId.toString()),
      });
    },
  });
}

export function useNotifyProfessorSigning() {
  return useMutation<any, Error, { projetoId: number; message?: string }>({
    mutationFn: async ({ projetoId, message }) => {
      const response = await apiClient.post(
        `/projeto/${projetoId}/notify-signing`,
        {
          message,
        },
      );
      return response.data;
    },
  });
}

export function useDeleteProjeto() {
  const queryClient = useQueryClient();

  return useMutation<any, Error, number>({
    mutationFn: async (projetoId) => {
      const response = await apiClient.delete(`/projeto/${projetoId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.projeto.list });
    },
  });
}

// Backwards compatibility exports (deprecated)
// @deprecated Use projectsQueryOptions instead
export const projetosQueryOptions = projectsQueryOptions;
// @deprecated Use useProjects instead
export const useProjetos = useProjects;
// @deprecated Use useCreateProject instead
export const useCreateProjeto = useCreateProject;
