import type { DisciplinaProfessorResponse } from '@/routes/api/disciplina/$id/professor';
import {
  DisciplinaProfessorVinculo,
  DisciplinaResponse,
} from '@/routes/api/disciplina/-types';
import { apiClient } from '@/utils/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from './query-keys';

// Extended type for disciplinas that include professor information
export interface DisciplinaWithProfessor extends DisciplinaResponse {
  professorResponsavel?: string | null;
  professorResponsavelId?: number | null;
}

// Função para buscar disciplinas por departamento
export function useDisciplinas(departamentoId?: number) {
  return useQuery<DisciplinaWithProfessor[]>({
    queryKey: departamentoId
      ? QueryKeys.disciplina.byId(departamentoId.toString())
      : QueryKeys.disciplina.all,
    queryFn: async () => {
      const url = departamentoId
        ? `/disciplina?departamentoId=${departamentoId}`
        : '/disciplina';
      const response = await apiClient.get<DisciplinaWithProfessor[]>(url);
      return response.data;
    },
    enabled: !!departamentoId,
  });
}

export function useCreateDisciplina() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      nome: string;
      codigo: string;
      departamentoId: number;
    }) => {
      const response = await apiClient.post('/disciplina', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.disciplina.list });
    },
  });
}

export function useUpdateDisciplina() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: { nome: string; codigo: string; departamentoId: number };
    }) => {
      const response = await apiClient.put(`/disciplina/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.disciplina.list });
    },
  });
}

export function useDeleteDisciplina() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.delete(`/disciplina/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.disciplina.list });
    },
  });
}

// Função para vincular professor a disciplina
export function useVincularProfessorDisciplina() {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, DisciplinaProfessorVinculo>({
    mutationFn: async (data) => {
      const response = await apiClient.post(
        '/disciplina/vincular-professor',
        data,
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidar caches relacionados
      queryClient.invalidateQueries({ queryKey: QueryKeys.disciplina.all });
      if (variables.disciplinaId) {
        queryClient.invalidateQueries({
          queryKey: QueryKeys.disciplina.byId(
            variables.disciplinaId.toString(),
          ),
        });
      }
    },
  });
}

// Função para desvincular professor de disciplina
export function useDesvincularProfessorDisciplina() {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, Partial<DisciplinaProfessorVinculo>>({
    mutationFn: async (data) => {
      const response = await apiClient.delete(
        '/disciplina/vincular-professor',
        {
          data,
        },
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidar caches relacionados
      queryClient.invalidateQueries({ queryKey: QueryKeys.disciplina.all });
      if (variables.disciplinaId) {
        queryClient.invalidateQueries({
          queryKey: QueryKeys.disciplina.byId(
            variables.disciplinaId.toString(),
          ),
        });
      }
    },
  });
}

export function useDisciplinaProfessor(disciplinaId: number | null) {
  return useQuery<DisciplinaProfessorResponse>({
    queryKey: QueryKeys.disciplina.professor(disciplinaId!),
    queryFn: async () => {
      const response = await apiClient.get<DisciplinaProfessorResponse>(
        `/disciplina/${disciplinaId}/professor`,
      );
      return response.data;
    },
    enabled: disciplinaId != null,
  });
}
