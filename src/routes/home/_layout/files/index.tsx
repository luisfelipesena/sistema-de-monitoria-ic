import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FileUploader } from '@/components/ui/FileUploader';
import { FileViewer } from '@/components/ui/FileViewer';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

export const Route = createFileRoute('/home/_layout/files/')({
  component: FilesRoute,
});

function FilesRoute() {
  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{ fileId: string; fileName: string }>
  >([]);

  // Para teste, usamos valores fixos
  const testEntityType = 'test';
  const testEntityId = '123e4567-e89b-12d3-a456-426614174000'; // UUID de teste

  const handleUploadComplete = (fileData: {
    fileId: string;
    fileName: string;
  }) => {
    setUploadedFiles((prev) => [...prev, fileData]);
  };

  return (
    <div className="container py-8 mx-auto space-y-8">
      <h1 className="text-2xl font-bold">
        Teste de Upload e Download de Arquivos
      </h1>
      <p className="text-gray-600">
        Esta página demonstra o fluxo completo de upload, armazenamento e acesso
        a arquivos usando Minio.
      </p>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upload de Arquivo</CardTitle>
            <CardDescription>
              Faça upload de arquivos PDF (simulando documentos do projeto).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUploader
              entityType={testEntityType}
              entityId={testEntityId}
              onUploadComplete={handleUploadComplete}
              allowedTypes={['application/pdf']}
              maxSizeInMB={5}
            />
          </CardContent>
        </Card>
      </div>

      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Arquivos Enviados</CardTitle>
            <CardDescription>
              Visualize ou baixe os arquivos que foram enviados.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {uploadedFiles.map((file) => (
              <div key={file.fileId} className="p-4 border rounded-lg">
                <FileViewer
                  fileId={file.fileId}
                  fileName={file.fileName}
                  showPreview={true}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
