import { useFileAccess } from '@/hooks/use-files';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import { Download, Eye } from 'lucide-react';
import { Button } from './button';

interface FileViewerProps {
  fileId: string;
  fileName?: string; // Nome opcional para exibição
}

const log = logger.child({
  context: 'FileViewer',
});

export function FileViewer({
  fileId,
  fileName,
}: FileViewerProps) {
  const { toast } = useToast();

  const getPresignedUrlMutation = useFileAccess(fileId);

  // Função para visualizar o arquivo
  const handleView = async () => {
    try {
      const presignedUrl = await getPresignedUrlMutation.mutateAsync({
        fileId,
        action: 'view'
      });
      window.open(presignedUrl, '_blank');
    } catch (error) {
      log.error(error, 'Error viewing file');
      toast({
        title: 'Erro',
        description: 'Não foi possível visualizar o arquivo',
        variant: 'destructive',
      });
    }
  };

  // Função para baixar o arquivo
  const handleDownload = async () => {
    try {
      const presignedUrl = await getPresignedUrlMutation.mutateAsync({
        fileId,
        action: 'download'
      });
      window.open(presignedUrl, '_blank');
    } catch (error) {
      log.error(error, 'Error downloading file');
      toast({
        title: 'Erro',
        description: 'Não foi possível baixar o arquivo',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm truncate">
        {fileName || fileId}
      </span>
      <div className="flex space-x-2">
        <Button 
          onClick={handleView} 
          variant="outline" 
          size="sm"
          disabled={getPresignedUrlMutation.isPending}
        >
          <Eye className="w-4 h-4 mr-1" />
          Visualizar
        </Button>
        <Button 
          onClick={handleDownload} 
          variant="outline" 
          size="sm"
          disabled={getPresignedUrlMutation.isPending}
        >
          <Download className="w-4 h-4 mr-1" />
          Baixar
        </Button>
      </div>
    </div>
  );
}