import type { DisciplinaProfessorResponse } from '@/routes/api/disciplina/$id/professor';
import {
  Disciplina,
  DisciplinaInput,
  DisciplinaResponse,
  ProfessorDisciplina,
  DisciplinaProfessorVinculo,
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
export function useDisciplinas(filters: { departamentoId?: number } = {}) {
  return useQuery<Disciplina[]>({
    queryKey: QueryKeys.disciplinas.list(filters),
    queryFn: async () => {
      const response = await apiClient.get('/disciplina', {
        params: filters,
      });
      return response.data;
    },
  });
}

export function useCreateDisciplina() {
  const queryClient = useQueryClient();
  return useMutation<Disciplina, Error, DisciplinaInput>({
    mutationFn: async (data) => {
      const response = await apiClient.post('/disciplina', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.disciplinas.list() });
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
      queryClient.invalidateQueries({ queryKey: QueryKeys.disciplinas.list() });
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
      queryClient.invalidateQueries({ queryKey: QueryKeys.disciplinas.list() });
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
      queryClient.invalidateQueries({ queryKey: QueryKeys.disciplinas.list() });
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
      queryClient.invalidateQueries({ queryKey: QueryKeys.disciplinas.list() });
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

// Hook for a professor to get their associated disciplines for the current semester
export function useProfessorDisciplinas() {
  return useQuery<ProfessorDisciplina[]>({
    queryKey: QueryKeys.disciplinas.professor,
    queryFn: async () => {
      const response = await apiClient.get('/professor/disciplinas');
      return response.data;
    },
  });
}

// Hook for a professor to add a discipline association
export function useAddProfessorDisciplina() {
  const queryClient = useQueryClient();
  return useMutation<ProfessorDisciplina, Error, { disciplinaId: number }>({
    mutationFn: async (data) => {
      const response = await apiClient.post('/professor/disciplinas', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.disciplinas.professor });
    },
  });
}

// Hook for a professor to remove a discipline association
export function useRemoveProfessorDisciplina() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: async (associationId) => {
      await apiClient.delete(`/professor/disciplinas/${associationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.disciplinas.professor });
    },
  });
}
