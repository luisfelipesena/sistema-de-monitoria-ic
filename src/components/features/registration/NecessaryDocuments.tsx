import React from 'react';
import DocumentoUploadItem from './DocumentoUploadItem';

interface Documento {
  id: string;
  nome: string;
  ultimaAtualizacao?: string;
  status?: 'válido' | 'expirado' | 'pendente';
  selectedFileName?: string;
}

interface NecessaryDocumentsProps {
  documents: Documento[];
  onUpload?: (file: File, id: string) => void;
  onAccess?: (id: string) => void;
}

export const NecessaryDocuments: React.FC<NecessaryDocumentsProps> = ({
  documents,
  onUpload,
  onAccess,
}) => {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">
        3. Documentos Necessários
      </h2>
      {documents.map((doc) => (
        <DocumentoUploadItem
          key={doc.id}
          id={doc.id}
          nome={doc.nome}
          ultimaAtualizacao={doc.ultimaAtualizacao}
          status={doc.status}
          selectedFileName={doc.selectedFileName}
          onUpload={onUpload}
          onAccess={onAccess ? () => onAccess(doc.id) : undefined}
        />
      ))}
    </section>
  );
};
