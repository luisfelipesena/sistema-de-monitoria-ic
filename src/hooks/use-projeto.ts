import {
  ProjetoInput,
  ProjetoListItem,
  ProjetoResponse,
} from '@/routes/api/projeto/-types';
import { apiClient } from '@/utils/api-client';
import { logger } from '@/utils/logger';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

export function useProjetos() {
  return useQuery<ProjetoListItem[]>({
    queryKey: QueryKeys.projeto.list,
    queryFn: async () => {
      const response = await apiClient.get<ProjetoListItem[]>('/projeto');
      return response.data;
    },
  });
}

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

export function useCreateProjeto() {
  const queryClient = useQueryClient();

  return useMutation<ProjetoResponse, Error, ProjetoInput>({
    mutationFn: async (input) => {
      const response = await apiClient.post<ProjetoResponse>('/projeto', input);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.projeto.list });
    },
  });
}

export function useSubmitProjeto() {
  const queryClient = useQueryClient();

  return useMutation<ProjetoResponse, Error, number>({
    mutationFn: async (projetoId) => {
      const response = await apiClient.patch<ProjetoResponse>(
        `/api/projeto/${projetoId}/submit`,
      );
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

export function useUpdateProjetoStatus() {
  const queryClient = useQueryClient();

  return useMutation<
    any, // Replace any with the actual response type if available
    Error,
    {
      projetoId: number;
      status:
        | 'DRAFT'
        | 'SUBMITTED'
        | 'APPROVED'
        | 'REJECTED'
        | 'PENDING_ADMIN_SIGNATURE';
    }
  >({
    mutationFn: async ({ projetoId, status }) => {
      const response = await apiClient.put(`/api/projeto/${projetoId}/status`, {
        status,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.projeto.list });
      queryClient.invalidateQueries({
        queryKey: QueryKeys.projeto.byId(variables.projetoId.toString()),
      });
      // Optionally, refetch other queries that might depend on project status
    },
    onError: (error) => {
      log.error(error, 'Error updating project status');
      // Handle or display the error as needed
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

export function useNotifyResults() {
  return useMutation<any, Error, number>({
    mutationFn: async (projetoId: number) => {
      const response = await apiClient.post(
        `/projeto/${projetoId}/notify-results`,
      );
      return response.data;
    },
    onError: (error) => {
      log.error({ error }, 'Erro ao notificar resultados');
    },
  });
}

export function useGenerateAta() {
  return useMutation<Blob, Error, number>({
    mutationFn: async (projetoId: number) => {
      const response = await apiClient.get(`/projeto/${projetoId}/gerar-ata`, {
        responseType: 'blob',
      });
      return response.data;
    },
    onSuccess: (blob: Blob, projetoId: number) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `ata-selecao-projeto-${projetoId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onError: (error) => {
      log.error({ error }, 'Erro ao gerar ata');
    },
  });
}

export function useDownloadProjectPDF() {
  return useMutation<string, Error, number>({
    mutationFn: async (projetoId: number) => {
      const response = await apiClient.get(`/projeto/${projetoId}/pdf`, {
        responseType: 'text',
      });
      return response.data;
    },
    onSuccess: (htmlContent: string) => {
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      URL.revokeObjectURL(url);
    },
    onError: (error) => {
      log.error({ error }, 'Erro ao baixar PDF do projeto');
    },
  });
}

export function useBulkReminder() {
  return useMutation<
    any,
    Error,
    {
      type: 'PROJECT_SUBMISSION' | 'DOCUMENT_SIGNING' | 'SELECTION_PENDING';
      customMessage?: string;
      targetYear?: number;
      targetSemester?: 'SEMESTRE_1' | 'SEMESTRE_2';
    }
  >({
    mutationFn: async (input) => {
      const response = await apiClient.post('/admin/bulk-reminder', input);
      return response.data;
    },
    onError: (error) => {
      log.error({ error }, 'Erro ao enviar lembretes em lote');
    },
  });
}
