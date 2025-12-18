import { cn } from '@/lib/utils';
import { logger } from '@/utils/logger';
import { Upload } from 'lucide-react';
import { forwardRef, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';

const log = logger.child({
  context: 'file-uploader',
});

export interface FileUploaderProps {
  onFileSelect: (file: File | null) => void;
  allowedTypes?: string[];
  maxSizeInMB?: number;
  className?: string;
  selectedFile?: File | null;
}

export const FileUploader = forwardRef<HTMLInputElement, FileUploaderProps>(
  (
    {
      onFileSelect,
      allowedTypes = [],
      maxSizeInMB = 5,
      className,
      selectedFile,
    },
    ref,
  ) => {
    const [error, setError] = useState<string | null>(null);
    const [internalSelectedFile, setInternalSelectedFile] =
      useState<File | null>(selectedFile || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Use the controlled file if provided, otherwise use internal state
    const currentFile =
      selectedFile !== undefined ? selectedFile : internalSelectedFile;

    const handleFileValidation = (
      file: File,
    ): { valid: boolean; error?: string } => {
      if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
        return {
          valid: false,
          error: `Tipo de arquivo não permitido. Use: ${allowedTypes.join(', ')}`,
        };
      }

      const fileSizeInMB = file.size / (1024 * 1024);
      if (fileSizeInMB > maxSizeInMB) {
        return {
          valid: false,
          error: `Arquivo muito grande. Tamanho máximo: ${maxSizeInMB}MB`,
        };
      }

      return { valid: true };
    };

    const handleFileChange = (file: File) => {
      if (!file) return;

      const validation = handleFileValidation(file);
      if (!validation.valid) {
        setError(validation.error || 'Arquivo inválido');
        return;
      }

      setError(null);
      setInternalSelectedFile(file);
      onFileSelect(file);
    };

    const { getRootProps, getInputProps } = useDropzone({
      onDrop: (acceptedFiles, fileRejections) => {
        setError(null);
        if (fileRejections.length > 0) {
          setError('Arquivo inválido. Por favor, verifique o tipo e tamanho.');
          return;
        }
        if (acceptedFiles.length > 0) {
          const file = acceptedFiles[0];
          handleFileChange(file);
        }
      },
      accept: Object.fromEntries(allowedTypes.map((type) => [type, []])),
      multiple: false,
      disabled: !!currentFile,
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileChange(file);
      }
    };

    const handleRemove = () => {
      setInternalSelectedFile(null);
      setError(null);
      onFileSelect(null);
    };

    return (
      <div className={cn('space-y-2', className)}>
        <div
          {...(!currentFile ? getRootProps() : {})}
          className="border border-dashed border-gray-300 p-4 rounded-md hover:border-gray-400 transition-colors min-h-[112px] flex items-center justify-center"
          style={{ minHeight: 112 }}
        >
          <input {...getInputProps()} />
          {!currentFile ? (
            <div className="flex flex-col items-center justify-center w-full">
              <Upload className="h-6 w-6 mb-2 text-gray-500" />
              <p className="text-sm text-center text-gray-500">
                Arraste e solte um arquivo aqui, ou clique para selecionar
              </p>
              <p className="text-xs text-center text-gray-400 mt-1">
                {allowedTypes.length > 0
                  ? `Tipos permitidos: ${allowedTypes.map(type => {
                      const extensions: Record<string, string> = {
                        'application/pdf': 'PDF',
                        'image/jpeg': 'JPEG',
                        'image/jpg': 'JPG',
                        'image/png': 'PNG',
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
                        'application/vnd.ms-excel': 'XLS',
                        'text/csv': 'CSV'
                      };
                      return extensions[type] || type;
                    }).join(', ')}`
                  : ''}
                {maxSizeInMB ? ` | Máximo: ${maxSizeInMB}MB` : ''}
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Upload className="h-6 w-6 flex-shrink-0 text-blue-500" />
                <span className="truncate text-sm">{currentFile.name}</span>
              </div>
              <button
                type="button"
                className="ml-2 flex-shrink-0 bg-blue-400 hover:bg-blue-500 text-white rounded-full px-3 py-1 text-xs font-semibold"
                onClick={handleRemove}
              >
                Remover
              </button>
            </div>
          )}
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <input
          type="file"
          className="hidden"
          onChange={handleInputChange}
          ref={(element) => {
            if (typeof ref === 'function') {
              ref(element);
            } else if (ref) {
              ref.current = element;
            }
            fileInputRef.current = element;
          }}
        />
      </div>
    );
  },
);

FileUploader.displayName = 'FileUploader';
