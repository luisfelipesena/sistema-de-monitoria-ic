import { useAluno } from '@/hooks/use-aluno';
import { useFileUpload } from '@/hooks/use-files';
import { apiClient } from '@/utils/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from './query-keys';

export interface UserDocument {
  id: string;
  nome: string;
  tipo: 'historico_escolar' | 'comprovante_matricula';
  fileId?: string;
  fileName?: string;
  url?: string;
  uploadDate?: Date;
  status: 'missing' | 'valid' | 'expired';
  needsUpdate?: boolean;
}

export interface FileAccessResponse {
  url: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
}

export function useUserDocuments() {
  const { data: aluno } = useAluno();
  const queryClient = useQueryClient();

  return useQuery<UserDocument[]>({
    queryKey: QueryKeys.userDocuments.list,
    queryFn: async () => {
      if (!aluno) {
        return [];
      }

      const documents: UserDocument[] = [
        {
          id: 'historico_escolar',
          nome: 'Histórico Escolar',
          tipo: 'historico_escolar',
          status: 'missing',
        },
        {
          id: 'comprovante_matricula',
          nome: 'Comprovante de Matrícula',
          tipo: 'comprovante_matricula',
          status: 'missing',
        },
      ];

      // Check if student has file IDs in their profile
      const alunoWithFiles = aluno as any;

      if (alunoWithFiles.historicoEscolarFileId) {
        try {
          const response = await apiClient.get<FileAccessResponse>(
            `/files/access/${alunoWithFiles.historicoEscolarFileId}`,
          );
          const fileData = response.data;

          const historicoDoc = documents.find(
            (d) => d.tipo === 'historico_escolar',
          );
          if (historicoDoc) {
            historicoDoc.fileId = alunoWithFiles.historicoEscolarFileId;
            historicoDoc.fileName = fileData.fileName;
            historicoDoc.url = fileData.url;
            historicoDoc.status = 'valid';
          }
        } catch (error) {
          console.warn('Error fetching historico escolar file:', error);
        }
      }

      if (alunoWithFiles.comprovanteMatriculaFileId) {
        try {
          const response = await apiClient.get<FileAccessResponse>(
            `/files/access/${alunoWithFiles.comprovanteMatriculaFileId}`,
          );
          const fileData = response.data;

          const comprovanteDoc = documents.find(
            (d) => d.tipo === 'comprovante_matricula',
          );
          if (comprovanteDoc) {
            comprovanteDoc.fileId = alunoWithFiles.comprovanteMatriculaFileId;
            comprovanteDoc.fileName = fileData.fileName;
            comprovanteDoc.url = fileData.url;
            comprovanteDoc.status = 'valid';
          }
        } catch (error) {
          console.warn('Error fetching comprovante matricula file:', error);
        }
      }

      return documents;
    },
    enabled: !!aluno,
  });
}

export function useUpdateUserDocument() {
  const queryClient = useQueryClient();
  const fileUploadMutation = useFileUpload();

  return useMutation<
    { success: boolean; message: string },
    Error,
    { file: File; documentType: 'historico_escolar' | 'comprovante_matricula' }
  >({
    mutationFn: async ({ file, documentType }) => {
      // Upload the file
      const uploadResponse = await fileUploadMutation.mutateAsync({
        file,
        entityType: documentType,
        entityId: 'student_document',
      });

      // Update the student profile with the new file ID
      const fieldName =
        documentType === 'historico_escolar'
          ? 'historicoEscolarFileId'
          : 'comprovanteMatriculaFileId';

      await apiClient.post('/student', {
        [fieldName]: uploadResponse.fileId,
      });

      return {
        success: true,
        message: 'Documento atualizado com sucesso',
      };
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: QueryKeys.userDocuments.list });
      queryClient.invalidateQueries({ queryKey: QueryKeys.aluno.all });
    },
  });
}
