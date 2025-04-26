'use client';

import { PdfDropzone } from '@/components/ui/PdfDropzone';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

export const Route = createFileRoute('/home/_layout/projects/')({
  component: ProjectsComponent,
});

function ProjectsComponent() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleFileAccept = (file: File) => {
    console.log('Accepted file:', file);
    setUploadedFile(file);
  };

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-gray-900">
        Gerenciar Projetos
      </h1>
      <div className="p-6 space-y-6 bg-white rounded-lg shadow">
        <p className="text-gray-600">
          Página de gerenciamento de projetos (em construção).
        </p>

        <div>
          <h2 className="mb-3 text-xl font-semibold text-gray-800">
            Upload de Proposta (PDF)
          </h2>
          <PdfDropzone onFileAccepted={handleFileAccept} />
          {uploadedFile && (
            <p className="mt-4 text-sm text-green-600">
              Arquivo '{uploadedFile.name}' selecionado.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
