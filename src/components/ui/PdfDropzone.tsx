import { cn } from '@/lib/utils';
import { File as FileIcon, UploadCloud, X } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { useDropzone, type Accept } from 'react-dropzone';

interface PdfDropzoneProps {
  onFileAccepted: (file: File) => void;
  className?: string;
}

const pdfAccept: Accept = {
  'application/pdf': ['.pdf'],
};

export function PdfDropzone({ onFileAccepted, className }: PdfDropzoneProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: any[]) => {
      setError(null); // Clear previous errors
      setSelectedFile(null); // Clear previous selection

      if (fileRejections.length > 0) {
        setError('Arquivo inválido. Por favor, envie apenas arquivos PDF.');
        return;
      }

      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setSelectedFile(file);
        onFileAccepted(file);
      }
    },
    [onFileAccepted],
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: pdfAccept,
      multiple: false,
    });

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the dropzone's click event
    setSelectedFile(null);
    setError(null);
    // Optionally call a prop function if parent needs to know about removal
  };

  return (
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
        className,
      )}
    >
      <input {...getInputProps()} />
      {selectedFile ? (
        <div className="flex flex-col items-center p-4 text-center">
          <div className="relative flex items-center p-3 bg-white border border-gray-200 rounded-md shadow-sm">
            <FileIcon className="w-10 h-10 mr-3 text-gray-500" />
            <span className="max-w-xs text-sm font-medium text-gray-700 truncate">
              {selectedFile.name}
            </span>
            <button
              type="button"
              onClick={handleRemoveFile}
              className="absolute p-1 text-white bg-red-500 rounded-full -top-2 -right-2 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
              aria-label="Remover arquivo"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {Math.round(selectedFile.size / 1024)} KB
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
              {error || 'Arquivo inválido. Apenas PDFs são aceitos.'}
            </p>
          ) : isDragActive ? (
            <p className="mb-2 text-sm font-semibold text-blue-600">
              Solte o arquivo PDF aqui...
            </p>
          ) : (
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Clique para enviar</span> ou
              arraste e solte o arquivo PDF
            </p>
          )}
          {!isDragReject && !error && (
            <p className="text-xs text-gray-500">Apenas arquivos PDF</p>
          )}
        </div>
      )}
    </div>
  );
}
