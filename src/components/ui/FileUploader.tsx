import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { apiClient } from '@/utils/api-client';
import { logger } from '@/utils/logger';
import { Upload } from 'lucide-react';
import { forwardRef, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';

const log = logger.child({
  context: 'file-uploader',
});

export interface FileUploaderProps {
  entityType: string;
  entityId: string;
  onUploadComplete?: (fileData: { fileId: string; fileName: string }) => void;
  onFileSelect?: (file: File) => void;
  allowedTypes?: string[];
  maxSizeInMB?: number;
  className?: string;
}

export const FileUploader = forwardRef<HTMLInputElement, FileUploaderProps>(
  (
    {
      entityType,
      entityId,
      onUploadComplete,
      onFileSelect,
      allowedTypes = [],
      maxSizeInMB = 5,
      className,
    },
    ref,
  ) => {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleFileChange = async (file: File) => {
      if (!file) return;

      // Validar tipo de arquivo
      if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
        setError(
          `Tipo de arquivo não permitido. Use: ${allowedTypes.join(', ')}`,
        );
        return;
      }

      // Validar tamanho
      const fileSizeInMB = file.size / (1024 * 1024);
      if (fileSizeInMB > maxSizeInMB) {
        setError(`Arquivo muito grande. Tamanho máximo: ${maxSizeInMB}MB`);
        return;
      }

      // Notificar sobre a seleção do arquivo
      if (onFileSelect) {
        onFileSelect(file);
        setError(null);
        return;
      }

      // Se não houver callback de seleção, fazer upload imediatamente
      setIsUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('entityType', entityType);
        formData.append('entityId', entityId);

        const response = await apiClient.post('/files/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (onUploadComplete) {
          onUploadComplete({
            fileId: response.data.fileId,
            fileName: file.name,
          });
        }
      } catch (error: any) {
        log.error({ error }, 'Erro ao fazer upload do arquivo');
        toast({
          title: 'Erro no upload',
          description:
            error?.response?.data?.message || 'Erro ao fazer upload do arquivo',
          variant: 'destructive',
        });
        setError('Erro ao fazer upload do arquivo');
      } finally {
        setIsUploading(false);
      }
    };

    const { getRootProps, getInputProps } = useDropzone({
      onDrop: (acceptedFiles, fileRejections) => {
        setError(null);

        if (fileRejections.length > 0) {
          setError('Arquivo inválido. Por favor, verifique o tipo e tamanho.');
          return;
        }

        if (acceptedFiles.length > 0) {
          const selectedFile = acceptedFiles[0];
          handleFileChange(selectedFile);
        }
      },
      accept: Object.fromEntries(allowedTypes.map((type) => [type, []])),
      multiple: false,
      disabled: isUploading,
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileChange(file);
      }
    };

    return (
      <div className={cn('space-y-2', className)}>
        <div
          {...getRootProps()}
          className="border border-dashed border-gray-300 p-4 rounded-md hover:border-gray-400 transition-colors"
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center">
            <Upload className="h-6 w-6 mb-2 text-gray-500" />
            <p className="text-sm text-center text-gray-500">
              Arraste e solte um arquivo aqui, ou clique para selecionar
            </p>
            <p className="text-xs text-center text-gray-400 mt-1">
              {allowedTypes.length > 0
                ? `Tipos permitidos: ${allowedTypes.join(', ')}`
                : ''}
              {maxSizeInMB ? ` | Máximo: ${maxSizeInMB}MB` : ''}
            </p>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <input
          type="file"
          className="hidden"
          onChange={handleInputChange}
          ref={(element) => {
            // Atribuir a ref passada via forwardRef
            if (typeof ref === 'function') {
              ref(element);
            } else if (ref) {
              ref.current = element;
            }
            // Também manter nossa ref interna
            fileInputRef.current = element;
          }}
        />
      </div>
    );
  },
);

FileUploader.displayName = 'FileUploader';
