import { useToast } from '@/hooks/use-toast';
import { X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from './button';

interface FileViewerProps {
  fileId: string;
  fileName?: string; // Nome opcional para exibição
  showPreview?: boolean; // Se deve mostrar visualização para PDFs/imagens
}

export function FileViewer({
  fileId,
  fileName,
  showPreview = true,
}: FileViewerProps) {
  const [fileData, setFileData] = useState<{
    url: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const { toast } = useToast();

  // Função para buscar a URL pré-assinada do arquivo
  const fetchFileUrl = useCallback(async () => {
    if (!fileId) return;

    console.log(`Buscando arquivo com ID: ${fileId}`);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/files/access/${fileId}`, {
        credentials: 'include',
      });

      console.log(`Status da resposta: ${response.status}`);
      const data = await response.json();
      console.log('Dados recebidos:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao acessar o arquivo');
      }

      setFileData({
        url: data.url,
        fileName: data.fileName,
        mimeType: data.mimeType,
        fileSize: data.fileSize,
      });
    } catch (error) {
      console.error('Erro ao buscar arquivo:', error);
      setError(
        error instanceof Error ? error.message : 'Erro ao buscar o arquivo',
      );
      toast({
        title: 'Erro',
        description:
          error instanceof Error ? error.message : 'Erro ao buscar o arquivo',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [fileId, toast]);

  // Carregar a URL do arquivo ao montar o componente
  useEffect(() => {
    fetchFileUrl();
  }, [fetchFileUrl]);

  // Função para visualizar o arquivo
  const handleView = useCallback(() => {
    if (!fileData) return;

    // Para PDFs e imagens, podemos usar o visualizador embutido
    if (
      showPreview &&
      (fileData.mimeType === 'application/pdf' ||
        fileData.mimeType.startsWith('image/'))
    ) {
      setIsViewerOpen(true);
    } else {
      // Para outros tipos, abrir em nova aba
      window.open(fileData.url, '_blank');
    }
  }, [fileData, showPreview]);

  // Função para baixar o arquivo
  const handleDownload = useCallback(() => {
    if (!fileData) return;
    window.open(fileData.url, '_blank');
  }, [fileData]);

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
        {error}
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
          <Button onClick={handleView} variant="outline" size="sm">
            Visualizar
          </Button>
          <Button onClick={handleDownload} size="sm">
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
            variant="outline"
            size="icon"
            className="absolute z-10 top-2 right-2 bg-white/80"
            onClick={() => setIsViewerOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
          <iframe
            src={fileData.url}
            className="w-full h-full"
            title={fileData.fileName}
          />
        </div>
      )}
    </div>
  );
}
