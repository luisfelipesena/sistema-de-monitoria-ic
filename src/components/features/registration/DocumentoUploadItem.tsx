import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import React, { useState } from 'react';

interface DocumentoUploadItemProps {
  id: string;
  nome: string;
  ultimaAtualizacao?: string;
  status?: 'válido' | 'expirado' | 'pendente';
  selectedFileName?: string;
  onUpload?: (file: File, id: string) => void;
  onAccess?: (id: string) => void;
}

const statusStyles = {
  válido: 'bg-green-100 text-green-800',
  expirado: 'bg-red-100 text-red-700',
  pendente: 'bg-yellow-100 text-yellow-700',
};

const DocumentoUploadItem: React.FC<DocumentoUploadItemProps> = ({
  id,
  nome,
  ultimaAtualizacao,
  status = 'pendente',
  selectedFileName,
  onUpload,
  onAccess,
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [localFileName, setLocalFileName] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLocalFileName(file.name);
      if (onUpload) {
        onUpload(file, id);
      }
    }
  };

  const triggerSelect = () => {
    inputRef.current?.click();
  };

  const displayFileName = selectedFileName || localFileName;

  return (
    <div className="border p-4 rounded-xl flex justify-between items-center bg-white">
      <div className="flex flex-col space-y-1">
        <span className="font-medium text-sm">{nome}</span>
        {displayFileName && (
          <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded w-fit">
            📄 {displayFileName}
          </span>
        )}
        {ultimaAtualizacao && (
          <span
            className={cn(
              'text-xs font-medium w-fit px-2 py-0.5 rounded-lg',
              statusStyles[status],
            )}
          >
            Última atualização: {ultimaAtualizacao}
          </span>
        )}
      </div>
      <div className="flex gap-2">
        {onUpload && (
          <>
            <input
              type="file"
              ref={inputRef}
              onChange={handleFileChange}
              hidden
              accept=".pdf"
            />
            <Button variant="outline" onClick={triggerSelect}>
              📤 {displayFileName ? 'Alterar' : 'Fazer upload'}
            </Button>
          </>
        )}
        {onAccess && (
          <Button variant="outline" onClick={() => onAccess(id)}>
            👁 Visualizar
          </Button>
        )}
      </div>
    </div>
  );
};

export default DocumentoUploadItem;
