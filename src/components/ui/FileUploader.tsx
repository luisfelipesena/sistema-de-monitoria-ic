import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { trpc } from '@/server/trpc/react';
import { logger } from '@/utils/logger';
import { File as FileIcon, UploadCloud, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from './button';

interface FileUploaderProps {
  entityType: string;
  entityId: string;
  onUploadComplete?: (fileData: { fileId: string; fileName: string }) => void;
  allowedTypes?: string[]; // ex: ['application/pdf']
  maxSizeInMB?: number; // tamanho máximo em MB
  className?: string;
}

const log = logger.child({
  context: 'FileUploader',
});

export function FileUploader({
  entityType,
  entityId,
  onUploadComplete,
  allowedTypes = ['application/pdf'],
  maxSizeInMB = 10, // 10MB padrão
  className,
}: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const validateFile = useCallback(
    (file: File): boolean => {
      // Validação de tipo de arquivo
      if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
        setError(
          `O tipo de arquivo ${file.type} não é permitido. Apenas os seguintes tipos são aceitos: ${allowedTypes.join(
            ', ',
          )}`,
        );
        return false;
      }

      // Validação de tamanho
      const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
      if (file.size > maxSizeInBytes) {
        setError(
          `O arquivo é maior que o tamanho máximo permitido (${maxSizeInMB}MB)`,
        );
        return false;
      }

      setError(null);
      return true;
    },
    [allowedTypes, maxSizeInMB],
  );

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: any[]) => {
      setError(null);

      if (fileRejections.length > 0) {
        setError('Arquivo inválido. Por favor, verifique o tipo e tamanho.');
        return;
      }

      if (acceptedFiles.length > 0) {
        const selectedFile = acceptedFiles[0];
        if (validateFile(selectedFile)) {
          setFile(selectedFile);
        }
      }
    },
    [validateFile],
  );

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setError(null);
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: Object.fromEntries(allowedTypes.map((type) => [type, []])),
      multiple: false,
      disabled: isUploading,
    });

  const { mutateAsync: uploadFile } = trpc.files.upload.post.useMutation({
    onSuccess: (data) => {
      toast({
        title: 'Upload concluído',
        description: `O arquivo ${file?.name} foi enviado com sucesso`,
      });
    },
  });

  const handleUpload = useCallback(async () => {
    if (!file) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityType', entityType);
      formData.append('entityId', entityId);

      const data = await uploadFile({ file });

      if (onUploadComplete) {
        onUploadComplete({
          fileId: data.versionId || '',
          fileName: file.name,
        });
      }

      setFile(null);
    } catch (error) {
      log.error(error, 'Erro no upload:');
      toast({
        title: 'Erro no upload',
        description:
          error instanceof Error
            ? error.message
            : 'Ocorreu um erro ao enviar o arquivo',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  }, [file, entityType, entityId, onUploadComplete, toast]);

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          'flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
          isDragActive && !isDragReject ? 'border-blue-500 bg-blue-50' : '',
          isDragReject ? 'border-red-500 bg-red-50' : '',
          !isDragActive && !isDragReject
            ? 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100'
            : '',
          error ? 'border-red-500 bg-red-50' : '',
          isUploading ? 'opacity-50 cursor-not-allowed' : '',
          className,
        )}
      >
        <input {...getInputProps()} disabled={isUploading} />
        {file ? (
          <div className="flex flex-col items-center p-4 text-center">
            <div className="relative flex items-center p-3 bg-white border border-gray-200 rounded-md shadow-sm">
              <FileIcon className="w-10 h-10 mr-3 text-gray-500" />
              <span className="max-w-xs text-sm font-medium text-gray-700 truncate">
                {file.name}
              </span>
              {!isUploading && (
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="absolute p-1 text-white bg-red-500 rounded-full -top-2 -right-2 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
                  aria-label="Remover arquivo"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {Math.round(file.size / 1024)} KB
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
            <UploadCloud
              className={cn(
                'w-10 h-10 mb-3',
                isDragReject || error ? 'text-red-500' : 'text-gray-400',
              )}
            />
            {isDragReject || error ? (
              <p className="mb-2 text-sm font-semibold text-red-600">
                {error || 'Arquivo inválido. Verifique o tipo permitido.'}
              </p>
            ) : isDragActive ? (
              <p className="mb-2 text-sm font-semibold text-blue-600">
                Solte o arquivo aqui...
              </p>
            ) : (
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Clique para enviar</span> ou
                arraste e solte o arquivo
              </p>
            )}
            {!isDragReject && !error && (
              <p className="text-xs text-gray-500">
                Tipos permitidos: {allowedTypes.join(', ')}
              </p>
            )}
          </div>
        )}
      </div>

      {file && (
        <Button
          onClick={handleUpload}
          disabled={isUploading}
          className="w-full"
        >
          {isUploading ? 'Enviando...' : 'Enviar Arquivo'}
        </Button>
      )}
    </div>
  );
}
