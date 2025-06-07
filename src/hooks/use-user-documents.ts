import { useAuth } from '@/hooks/use-auth';
import { useAluno } from '@/hooks/use-aluno';
import { useProfessor } from '@/hooks/use-professor';
import { useFileUpload, useFileMetadata } from '@/hooks/use-files';
import { apiClient } from '@/utils/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from './query-keys';

export type DocumentType = 'historico_escolar' | 'comprovante_matricula' | 'curriculum_vitae' | 'comprovante_vinculo';

export interface UserDocument {
  id: string;
  nome: string;
  tipo: DocumentType;
  fileId?: string;
  fileName?: string;
  originalFileName?: string;
  url?: string;
  status: 'valid' | 'pending';
  isLoadingMetadata?: boolean;
}

export interface FileAccessResponse {
  url: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
}

export function useUserDocuments() {
  const { user } = useAuth();
  const { data: aluno } = useAluno();
  const { data: professor } = useProfessor();

  if (user?.role === 'student') {
    const baseDocuments = [
      {
        id: 'comprovante-matricula',
        nome: 'Comprovante de Matrícula',
        tipo: 'comprovante_matricula' as const,
        fileId: aluno?.comprovanteMatriculaFileId || undefined,
        status: aluno?.comprovanteMatriculaFileId ? 'valid' as const : 'pending' as const,
      },
      {
        id: 'historico-escolar',
        nome: 'Histórico Escolar',
        tipo: 'historico_escolar' as const,
        fileId: aluno?.historicoEscolarFileId || undefined,
        status: aluno?.historicoEscolarFileId ? 'valid' as const : 'pending' as const,
      },
    ];

    return {
      data: baseDocuments,
      isLoading: false,
    };
  }

  if (user?.role === 'professor') {
    const baseDocuments = [
      {
        id: 'curriculum-vitae',
        nome: 'Currículo Vitae',
        tipo: 'curriculum_vitae' as const,
        fileId: professor?.curriculumVitaeFileId || undefined,
        status: professor?.curriculumVitaeFileId ? 'valid' as const : 'pending' as const,
      },
      {
        id: 'comprovante-vinculo',
        nome: 'Comprovante de Vínculo',
        tipo: 'comprovante_vinculo' as const,
        fileId: professor?.comprovanteVinculoFileId || undefined,
        status: professor?.comprovanteVinculoFileId ? 'valid' as const : 'pending' as const,
      },
    ];

    return {
      data: baseDocuments,
      isLoading: false,
    };
  }

  return {
    data: [],
    isLoading: false,
  };
}

export function useUpdateUserDocument() {
  const { user } = useAuth();
  const fileUploadMutation = useFileUpload();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, documentType }: { file: File; documentType: string }) => {
      const response = await fileUploadMutation.mutateAsync({
        file,
        entityType: documentType as any,
        entityId: user?.id?.toString() || '0',
      });
      return response;
    },
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: QueryKeys.aluno.all });
      queryClient.invalidateQueries({ queryKey: QueryKeys.professor.all });
      queryClient.invalidateQueries({ queryKey: QueryKeys.onboarding.status });
    },
  });
}
