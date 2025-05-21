import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import React from 'react';

interface DocumentoUploadItemProps {
  id: string;
  nome: string;
  ultimaAtualizacao?: string;
  status?: 'válido' | 'expirado' | 'pendente';
  onUpload?: (file: File, id: string) => void;
  onVisualizar?: (id: string) => void;
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
  onUpload,
  onVisualizar,
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpload) {
      onUpload(file, id);
    }
  };

  const triggerSelect = () => {
    inputRef.current?.click();
  };

  return (
    <div className="border p-4 rounded-xl flex justify-between items-center bg-white">
      <div className="flex flex-col">
        <span className="font-medium text-sm">{nome}</span>
        {ultimaAtualizacao && (
          <span
            className={cn(
              'mt-1 text-xs font-medium w-fit px-2 py-0.5 rounded-lg',
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
            />
            <Button variant="outline" onClick={triggerSelect}>
              📤 Fazer upload
            </Button>
          </>
        )}
        {onVisualizar && (
          <Button variant="outline" onClick={() => onVisualizar(id)}>
            👁 Visualizar
          </Button>
        )}
      </div>
    </div>
  );
};

export default DocumentoUploadItem;
