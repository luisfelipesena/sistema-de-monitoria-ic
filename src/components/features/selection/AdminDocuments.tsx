// components/DocumentosSection.tsx

import { Download, File, FilePlus, PenTool } from 'lucide-react';
import { useState } from 'react';

interface DocumentItem {
  id: number;
  title: string;
  status: string;
  statusColor?: string;
  actions?: 'validate';
  file?: File;
}

interface DocumentListProps {
  documents: DocumentItem[];
}

export default function DocumentosSection({ documents }: DocumentListProps) {
  const [documentos, setDocumentos] = useState<DocumentItem[]>(documents);
  const [showModal, setShowModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocStatus, setNewDocStatus] = useState('Aguardando');
  const [newDocFile, setNewDocFile] = useState<File | null>(null);

  const adicionarDocumento = () => {
    if (!newDocTitle) return;

    const novoDocumento = {
      id: Date.now(), // alterar isso
      title: newDocTitle,
      status: newDocStatus,
      statusColor: newDocStatus === 'Aguardando' ? 'gray' : 'green',
      actions:
        newDocStatus === 'Aguardando' ? ('validate' as const) : undefined,
      file: newDocFile ?? undefined,
    };
    setDocumentos((prev) => [...prev, novoDocumento]);
    setShowModal(false);
    setNewDocTitle('');
    setNewDocStatus('Aguardando');
    setNewDocFile(null);
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
          onClick={() => setShowModal(true)}
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

              {doc.status === 'Assinatura Aprovada' && (
                <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-semibold">
                  Assinatura Aprovada
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white h-94 p-6 rounded-lg w-full max-w-md shadow-md">
            <h2 className="text-lg font-bold mb-4">Novo Documento</h2>

            <label className="block mb-5">
              Título:
              <input
                type="text"
                className="w-full bg-white border rounded px-2 py-1 mt-1"
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
              />
            </label>

            <label className="block mb-6">
              Status:
              <select
                className="w-full bg-white border rounded px-2 py-1 mt-1"
                value={newDocStatus}
                onChange={(e) => setNewDocStatus(e.target.value)}
              >
                <option value="Aguardando">Aguardando</option>
                <option value="Assinatura Aprovada">Assinatura Aprovada</option>
              </select>
            </label>

            <label
              htmlFor="upload"
              className="inline-block px-2 py-1 mb-6 bg-blue-900 text-white rounded cursor-pointer font-medium hover:bg-blue-800 transition"
            >
              Upload de Arquivo:
              <input
                id="upload"
                type="file"
                className="hidden"
                onChange={(e) => setNewDocFile(e.target.files?.[0] || null)}
              />
            </label>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={adicionarDocumento}
                className="bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-800"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
