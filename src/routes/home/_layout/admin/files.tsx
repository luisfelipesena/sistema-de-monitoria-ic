'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FileUploader } from '@/components/ui/FileUploader';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useAdminFileDelete,
  useAdminFilesList,
  useFilePresignedUrl,
} from '@/hooks/use-files';
import { useToast } from '@/hooks/use-toast';
import {
  FileListItem,
  UploadCompletionData,
} from '@/routes/api/files/admin/-admin-types';
import { logger } from '@/utils/logger';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { format } from 'date-fns';
import { Eye, Loader2, Trash2 } from 'lucide-react';
import { useState } from 'react';

const log = logger.child({
  context: 'AdminFilesPage',
});

export const Route = createFileRoute('/home/_layout/admin/files')({
  component: AdminFilesPage,
});

function AdminFilesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [fileToDelete, setFileToDelete] = useState<FileListItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: files, isLoading, error, refetch } = useAdminFilesList();

  const deleteMutation = useAdminFileDelete();
  const viewMutation = useFilePresignedUrl();

  const openDeleteDialog = (file: FileListItem) => {
    setFileToDelete(file);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setFileToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  const confirmDelete = () => {
    if (fileToDelete) {
      deleteMutation.mutate(fileToDelete.objectName, {
        onSuccess: (data) => {
          toast({ title: 'Sucesso', description: data.message });
          log.info(`Arquivo ${fileToDelete.objectName} excluído.`);
        },
        onError: (error) => {
          toast({
            title: 'Erro',
            description: error.message,
            variant: 'destructive',
          });
        },
        onSettled: () => {
          closeDeleteDialog();
        },
      });
    }
  };

  const handleViewFile = (objectName: string) => {
    viewMutation.mutate(objectName, {
      onSuccess: (data) => {
        window.open(data.url, '_blank');
      },
      onError: (error) => {
        toast({
          title: 'Erro',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  const handleUploadComplete = (uploadData: UploadCompletionData) => {
    log.info('Admin Upload Complete:', uploadData);
    toast({
      title: 'Upload Concluído',
      description: `Arquivo ${uploadData.fileName} enviado.`,
    });
    queryClient.invalidateQueries({ queryKey: ['adminFiles'] });
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  if (isLoading && !files) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        Erro ao carregar arquivos: {error.message}
        <Button onClick={() => refetch()} className="ml-4">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8 mx-auto space-y-8">
      <h1 className="mb-6 text-2xl font-bold">
        Gerenciamento de Arquivos (Admin)
      </h1>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload de Arquivo</CardTitle>
          <CardDescription>
            Faça upload de arquivos para o bucket. Use um tipo e ID de entidade
            genéricos ou relevantes para o propósito do upload.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileUploader
            entityType="admin-uploads" // Generic type for admin uploads
            entityId="general" // Generic ID or make dynamic if needed
            onUploadComplete={handleUploadComplete}
            // allowedTypes={['application/pdf']} // Example: restrict if needed
            // maxSizeInMB={10}
          />
        </CardContent>
      </Card>

      {/* File List Table */}
      <h2 className="text-xl font-semibold">Arquivos no Bucket</h2>
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Spinner /> Carregando lista...
        </div>
      ) : files && files.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome Original</TableHead>
              <TableHead>Caminho (Objeto)</TableHead>
              <TableHead>Tamanho</TableHead>
              <TableHead>Última Modificação</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map((file) => (
              <TableRow key={file.objectName}>
                <TableCell
                  className="font-medium truncate max-w-xs"
                  title={file.originalFilename}
                >
                  {file.originalFilename || '-'}
                </TableCell>
                <TableCell
                  className="truncate max-w-xs"
                  title={file.objectName}
                >
                  {file.objectName}
                </TableCell>
                <TableCell>{formatBytes(file.size)}</TableCell>
                <TableCell>
                  {format(new Date(file.lastModified), 'dd/MM/yyyy HH:mm')}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleViewFile(file.objectName)}
                      disabled={
                        viewMutation.isPending &&
                        viewMutation.variables === file.objectName
                      }
                      title="Visualizar/Baixar"
                    >
                      {viewMutation.isPending &&
                      viewMutation.variables === file.objectName ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => openDeleteDialog(file)}
                      disabled={
                        deleteMutation.isPending &&
                        deleteMutation.variables === file.objectName
                      }
                      title="Excluir"
                    >
                      {deleteMutation.isPending &&
                      deleteMutation.variables === file.objectName ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="py-4 text-center text-muted-foreground">
          Nenhum arquivo encontrado no bucket.
        </p>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o arquivo{' '}
              <span className="font-semibold">
                {fileToDelete?.originalFilename || fileToDelete?.objectName}
              </span>
              ? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={closeDeleteDialog}
              disabled={deleteMutation.isPending}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
