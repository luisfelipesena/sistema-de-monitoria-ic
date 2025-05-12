// components/DocumentosSection.tsx

import { Download, File, FilePlus, PenTool } from 'lucide-react';
import { useState } from 'react';

interface DocumentItem {
  id: number;
  title: string;
  status: string;
  statusColor?: string;
  actions: ('download' | 'validate')[];
}

interface DocumentListProps {
  documents: DocumentItem[];
}

export default function DocumentosSection({ documents }: DocumentListProps) {
  const [documentos, setDocumentos] = useState<DocumentItem[]>(documents);

  const adicionarDocumento = () => {
    const novoId = documentos.length + 1;
    setDocumentos([
      ...documentos,
      {
        id: novoId,
        title: `Documento ${novoId}`,
        status: 'Aguardando',
        statusColor: 'bg-gray-400',
        actions: ['download'] as ('download' | 'validate')[],
      },
    ]);
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2 mb-4">
          <div className="bg-blue-900 bg-opacity-20 p-1.5 rounded-full">
            <File className="text-blue-900 w-4 h-4" />
          </div>
          <h2 className="font-bold text-lg">Documentos</h2>
        </div>
        <button
          onClick={adicionarDocumento}
          className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2"
        >
          <FilePlus className="w-4 h-4" />
          Adicionar Documento
        </button>
      </div>

      <div className="space-y-2">
        {documentos.map((doc) => (
          <div
            key={doc.id}
            className="flex justify-between items-center bg-gray-50 border rounded px-4 py-3"
          >
            <span>{doc.title}</span>
            <div className="flex gap-2">
              {(doc.status === 'Pendente' || doc.status === 'Aprovado') && (
                <button className="bg-sky-300 hover:bg-sky-400 text-white text-sm px-3 py-1 rounded-full flex items-center gap-1">
                  <Download className="w-4 h-4" />
                  Baixar
                </button>
              )}

              {doc.status === 'Aguardando' && (
                <span className="bg-gray-400 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                  <PenTool className="w-3 h-3" />
                  Aguardando Assinatura
                </span>
              )}

              {doc.status === 'Pendente' && (
                <button className="bg-blue-900 hover:bg-blue-800 text-white text-sm px-3 py-1 rounded-full flex items-center gap-1">
                  <PenTool className="w-4 h-4" />
                  Validar Assinatura
                </button>
              )}

              {doc.status === 'Aprovado' && (
                <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-semibold">
                  Assinatura Aprovada
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
