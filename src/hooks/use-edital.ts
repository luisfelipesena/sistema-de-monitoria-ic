import { apiClient } from '@/utils/api-client';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { QueryKeys } from './query-keys';
import type {
  EditalResponse,
  EditalInput,
  EditalListItem,
} from '@/routes/api/edital/-types';
import { useToast } from './use-toast';
import { logger } from '@/utils/logger';

const log = logger.child({ context: 'use-edital' });

// Hook para listar todos os editais
export function useEditaisList() {
  return useQuery<EditalListItem[], Error>({
    queryKey: QueryKeys.edital.list,
    queryFn: async () => {
      const response = await apiClient.get<EditalListItem[]>('/edital');
      return response.data;
    },
  });
}

// Hook para buscar detalhes de um edital
export function useEditalDetail(editalId: number) {
  return useQuery<EditalListItem, Error>({
    queryKey: QueryKeys.edital.detail(editalId),
    queryFn: async () => {
      const response = await apiClient.get<EditalListItem>(`/edital/${editalId}`);
      return response.data;
    },
    enabled: !!editalId,
  });
}

// Hook para criar um novo edital
export function useCreateEdital() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation<EditalListItem, Error, EditalInput>({
    mutationFn: async (data) => {
      const response = await apiClient.post<EditalListItem>('/edital', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.edital.list });
      toast({ title: 'Edital criado com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao criar edital', description: error.message, variant: 'destructive' });
    },
  });
}

// Hook para atualizar um edital
export function useUpdateEdital() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation<
    EditalResponse, 
    Error, 
    { editalId: number; data: Partial<EditalInput> } // Permite atualização parcial
  >({
    mutationFn: async ({ editalId, data }) => {
      const response = await apiClient.put<EditalResponse>(`/edital/${editalId}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.edital.list });
      queryClient.invalidateQueries({ queryKey: QueryKeys.edital.detail(data.id) });
      toast({ title: 'Edital atualizado com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar edital', description: error.message, variant: 'destructive' });
    },
  });
}

// Hook para excluir um edital
export function useDeleteEdital() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation<{ success: boolean; message: string }, Error, number>({
    mutationFn: async (editalId) => {
      const response = await apiClient.delete<{ success: boolean; message: string }>(`/edital/${editalId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.edital.list });
      toast({ title: 'Edital excluído com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao excluir edital', description: error.message, variant: 'destructive' });
    },
  });
}

// Hook para publicar um edital
export function usePublishEdital() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation<
    { success: boolean; message: string; edital: EditalResponse }, 
    Error, 
    number
  >({
    mutationFn: async (editalId) => {
      const response = await apiClient.post<{ success: boolean; message: string; edital: EditalResponse }>(
        `/edital/${editalId}/publish`, 
        {}); // POST sem corpo, apenas para disparar a ação
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.edital.list });
      queryClient.invalidateQueries({ queryKey: QueryKeys.edital.detail(data.edital.id) });
      toast({ title: 'Edital publicado com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao publicar edital', description: error.message, variant: 'destructive' });
    },
  });
}

// Hook para gerar (buscar o HTML) do PDF do edital
export function useGenerateEditalPdf() {
  const { toast } = useToast();
  return useMutation<string, Error, number>({
    mutationFn: async (editalId) => {
      const response = await apiClient.get<string>(`/edital/${editalId}/generate-pdf`, {
        responseType: 'text', // Esperamos HTML como texto
      });
      return response.data;
    },
    onSuccess: (htmlContent, editalId) => {
      // Abre o HTML em uma nova aba para impressão/salvar como PDF pelo navegador
      const win = window.open("");
      if (win) {
        win.document.write(htmlContent);
        win.document.close(); // Importante para finalizar o carregamento do documento na nova aba
        // win.print(); // Opcional: disparar impressão automaticamente
      } else {
        toast({ title: 'Erro ao abrir preview', description: 'Não foi possível abrir a nova aba para visualização do edital.', variant: 'destructive' });
      }
    },
    onError: (error) => {
      toast({ title: 'Erro ao gerar PDF do edital', description: error.message, variant: 'destructive' });
    },
  });
}

// Hook para fazer upload do PDF assinado do edital
export function useUploadSignedEditalPdf() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation<
    { success: boolean; message: string; edital: EditalResponse },
    Error,
    { editalId: number; file: File }
  >({
    mutationFn: async ({ editalId, file }) => {
      const formData = new FormData();
      formData.append('file', file);
      // O backend já sabe que é o edital assinado por causa do endpoint específico
      const response = await apiClient.post<{ success: boolean; message: string; edital: EditalResponse }>(
        `/edital/${editalId}/upload-signed`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.edital.list });
      queryClient.invalidateQueries({ queryKey: QueryKeys.edital.detail(data.edital.id) });
      toast({ title: 'PDF assinado do edital enviado com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao enviar PDF assinado', description: error.message, variant: 'destructive' });
    },
  });
}
