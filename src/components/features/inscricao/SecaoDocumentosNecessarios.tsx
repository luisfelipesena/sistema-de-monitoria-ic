import React from 'react'
import DocumentoUploadItem from './DocumentoUploadItem'

interface Documento {
  id: string
  nome: string
  ultimaAtualizacao?: string
  status?: 'válido' | 'expirado' | 'pendente'
}

interface SecaoDocumentosNecessariosProps {
  documentos: Documento[]
  onUpload?: (id: string) => void
  onVisualizar?: (id: string) => void
}

const SecaoDocumentosNecessarios: React.FC<SecaoDocumentosNecessariosProps> = ({
  documentos,
  onUpload,
  onVisualizar,
}) => {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Documentos Necessários</h2>
      {documentos.map((doc) => (
        <DocumentoUploadItem
          key={doc.id}
          nome={doc.nome}
          ultimaAtualizacao={doc.ultimaAtualizacao}
          status={doc.status}
          onUpload={onUpload ? () => onUpload(doc.id) : undefined}
          onVisualizar={onVisualizar ? () => onVisualizar(doc.id) : undefined}
        />
      ))}
    </section>
  )
}

export default SecaoDocumentosNecessarios
