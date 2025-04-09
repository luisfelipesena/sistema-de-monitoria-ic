'use client';

import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/ui/file-upload';
import logger from 'lib/logger';
import { useState } from 'react';

export default function Projects() {
  const [files, setFiles] = useState<File[]>([]);

  const handleFileDrop = (acceptedFiles: File[]) => {
    logger.info('Arquivos recebidos:', acceptedFiles);
    setFiles(acceptedFiles);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 ml-64">
        <main className="p-8">
          <h1 className="mb-6 text-2xl font-bold text-gray-900">Projetos</h1>

          <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="mb-4 text-lg font-medium text-gray-900">
              Projetos de Monitoria
            </h2>
            <p className="mb-4 text-gray-600">
              Aqui você pode gerenciar os seus projetos de monitoria.
            </p>

            <div className="mt-6 space-y-4">
              <h3 className="font-medium text-gray-900 text-md">
                Upload de Documentos Assinados
              </h3>
              <FileUpload
                onDrop={handleFileDrop}
                accept={{
                  'application/pdf': ['.pdf'],
                  'application/msword': ['.doc', '.docx'],
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                    ['.docx'],
                }}
                maxFiles={5}
                className="max-w-lg"
              />

              {files.length > 0 && (
                <div className="mt-4">
                  <h4 className="mb-2 text-sm font-medium text-gray-900">
                    Arquivos Selecionados:
                  </h4>
                  <ul className="space-y-1">
                    {files.map((file, index) => (
                      <li key={index} className="text-sm text-gray-600">
                        {file.name} ({(file.size / 1024).toFixed(2)} KB)
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-3"
                    onClick={() => {
                      logger.info('Enviando arquivos:', files);
                      // Aqui seria implementada a lógica de envio para o servidor
                      alert('Arquivos enviados com sucesso!');
                      setFiles([]);
                    }}
                  >
                    Enviar Arquivos
                  </Button>
                </div>
              )}
            </div>

            <div className="p-4 mt-6 rounded bg-gray-50">
              <p className="text-center text-gray-500">
                Nenhum projeto encontrado
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
