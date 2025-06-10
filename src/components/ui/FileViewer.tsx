import { useFileAccess } from '@/hooks/use-files';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import { X } from 'lucide-react';
import { useState } from 'react';
import { Button } from './button';

interface FileViewerProps {
  fileId: string;
  fileName?: string; // Nome opcional para exibição
  showPreview?: boolean; // Se deve mostrar visualização para PDFs/imagens
}

const log = logger.child({
  context: 'FileViewer',
});

export function FileViewer({
  fileId,
  fileName,
  showPreview = true,
}: FileViewerProps) {
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: fileData, isLoading, error } = useFileAccess(fileId);

  // Função para visualizar o arquivo
  const handleView = async () => {
    if (!fileData) return;

    try {
      // Get file access URL
      const result = await fetch(`/api/files/access?fileId=${fileId}&action=view`);
      const { url } = await result.json();

      // Para PDFs e imagens, podemos usar o visualizador embutido
      if (
        showPreview &&
        (fileData.mimeType === 'application/pdf' ||
          fileData.mimeType.startsWith('image/'))
      ) {
        setFileUrl(url);
        setIsViewerOpen(true);
      } else {
        // Para outros tipos, abrir em nova aba
        window.open(url, '_blank');
      }
    } catch (error) {
      log.error('Error getting file access:', { error, fileId });
      toast({
        title: 'Erro ao acessar arquivo',
        description: 'Não foi possível obter acesso ao arquivo.',
        variant: 'destructive',
      });
    }
  };

  // Função para baixar o arquivo
  const handleDownload = async () => {
    if (!fileData) return;
    
    try {
      const result = await fetch(`/api/files/access?fileId=${fileId}&action=download`);
      const { url } = await result.json();
      window.open(url, '_blank');
    } catch (error) {
      log.error('Error downloading file:', { error, fileId });
      toast({
        title: 'Erro ao baixar arquivo',
        description: 'Não foi possível baixar o arquivo.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 py-2 border rounded bg-gray-50">
        Carregando arquivo...
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-2 text-red-600 border rounded bg-red-50">
        {error instanceof Error ? error.message : 'Erro ao buscar o arquivo'}
      </div>
    );
  }

  if (!fileData) {
    return (
      <div className="px-4 py-2 border rounded bg-gray-50">
        Arquivo não disponível
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium truncate">
          {fileName || fileData.fileName} (
          {(fileData.fileSize / 1024).toFixed(2)} KB)
        </div>

        <div className="flex space-x-2">
          <Button onClick={handleView} variant="secondary" size="sm">
            Visualizar
          </Button>
          <Button onClick={handleDownload} variant="secondary" size="sm">
            Baixar
          </Button>
        </div>
      </div>

      {isViewerOpen && showPreview && (
        <div
          className="relative mt-4 overflow-hidden border rounded-lg"
          style={{ height: '500px' }}
        >
          <Button
            variant="transparent"
            size="icon"
            className="absolute z-10 top-2 right-2 bg-white/80"
            onClick={() => setIsViewerOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
          <iframe
            src={fileUrl || ''}
            className="w-full h-full"
            title={fileData?.fileName || fileName}
          />
        </div>
      )}
    </div>
  );
}
