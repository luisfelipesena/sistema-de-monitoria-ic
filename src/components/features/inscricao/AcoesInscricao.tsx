import { Button } from '@/components/ui/button'
import React from 'react'

interface AcoesInscricaoProps {
  onCancelar?: () => void
  onEnviar?: () => void
  loading?: boolean
  disabled?: boolean
}

const AcoesInscricao: React.FC<AcoesInscricaoProps> = ({
  onCancelar,
  onEnviar,
  loading = false,
  disabled = false,
}) => {
  return (
    <div className="flex justify-end gap-4 mt-8">
      <Button
        variant="destructive"
        onClick={onCancelar}
        type="button"
      >
        Cancelar
      </Button>
      <Button
        variant="primary"
        onClick={onEnviar}
        type="submit"
        disabled={disabled || loading}
      >
        {loading ? 'Enviando...' : 'Enviar Inscrição'}
      </Button>
    </div>
  )
}

export default AcoesInscricao
