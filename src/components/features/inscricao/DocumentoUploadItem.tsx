import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import React from 'react'

interface DocumentoUploadItemProps {
  nome: string
  ultimaAtualizacao?: string
  status?: 'válido' | 'expirado' | 'pendente'
  onUpload?: () => void
  onVisualizar?: () => void
}

const statusStyles = {
  válido: 'bg-green-100 text-green-800',
  expirado: 'bg-red-100 text-red-700',
  pendente: 'bg-yellow-100 text-yellow-700',
}

const DocumentoUploadItem: React.FC<DocumentoUploadItemProps> = ({
  nome,
  ultimaAtualizacao,
  status = 'pendente',
  onUpload,
  onVisualizar,
}) => {
  return (
    <div className="border p-4 rounded-xl flex justify-between items-center bg-white">
      <div className="flex flex-col">
        <span className="font-medium text-sm">{nome}</span>
        {ultimaAtualizacao && (
          <span className={cn('mt-1 text-xs font-medium w-fit px-2 py-0.5 rounded-lg', statusStyles[status])}>
            Última atualização: {ultimaAtualizacao}
          </span>
        )}
      </div>
      <div className="flex gap-2">
        {onUpload && (
          <Button variant="outline" onClick={onUpload}>
            📤 Fazer upload
          </Button>
        )}
        {onVisualizar && (
         <Button variant="outline" onClick={onVisualizar}>
         👁 Visualizar
       </Button>
        )}
      </div>
    </div>
  )
}

export default DocumentoUploadItem
