import { useAuth } from '@/hooks/use-auth';
import { useAluno } from '@/hooks/use-aluno';
import { useProfessor } from '@/hooks/use-professor';
import { useFileUpload } from '@/hooks/use-files';
import { apiClient } from '@/utils/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from './query-keys';

export interface UserDocument {
  id: string;
  nome: string;
  tipo: 'comprovante_matricula' | 'historico_escolar' | 'curriculum_vitae' | 'comprovante_vinculo';
  fileId?: string;
  fileName?: string;
  url?: string;
  status: 'valid' | 'pending';
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
    const documents: UserDocument[] = [
      {
        id: 'comprovante-matricula',
        nome: 'Comprovante de Matrícula',
        tipo: 'comprovante_matricula',
        fileId: aluno?.comprovanteMatriculaFileId || undefined,
        fileName: aluno?.comprovanteMatriculaFileId ? 'comprovante_matricula.pdf' : undefined,
        url: aluno?.comprovanteMatriculaFileId ? `/api/files/access/${aluno.comprovanteMatriculaFileId}` : undefined,
        status: aluno?.comprovanteMatriculaFileId ? 'valid' : 'pending',
      },
      {
        id: 'historico-escolar',
        nome: 'Histórico Escolar',
        tipo: 'historico_escolar',
        fileId: aluno?.historicoEscolarFileId || undefined,
        fileName: aluno?.historicoEscolarFileId ? 'historico_escolar.pdf' : undefined,
        url: aluno?.historicoEscolarFileId ? `/api/files/access/${aluno.historicoEscolarFileId}` : undefined,
        status: aluno?.historicoEscolarFileId ? 'valid' : 'pending',
      },
    ];

    return {
      data: documents,
      isLoading: false,
    };
  }

  if (user?.role === 'professor') {
    const documents: UserDocument[] = [
      {
        id: 'curriculum-vitae',
        nome: 'Currículo Vitae',
        tipo: 'curriculum_vitae',
        fileId: professor?.curriculumVitaeFileId || undefined,
        fileName: professor?.curriculumVitaeFileId ? 'curriculum_vitae.pdf' : undefined,
        url: professor?.curriculumVitaeFileId ? `/api/files/access/${professor.curriculumVitaeFileId}` : undefined,
        status: professor?.curriculumVitaeFileId ? 'valid' : 'pending',
      },
      {
        id: 'comprovante-vinculo',
        nome: 'Comprovante de Vínculo',
        tipo: 'comprovante_vinculo',
        fileId: professor?.comprovanteVinculoFileId || undefined,
        fileName: professor?.comprovanteVinculoFileId ? 'comprovante_vinculo.pdf' : undefined,
        url: professor?.comprovanteVinculoFileId ? `/api/files/access/${professor.comprovanteVinculoFileId}` : undefined,
        status: professor?.comprovanteVinculoFileId ? 'valid' : 'pending',
      },
    ];

    return {
      data: documents,
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
