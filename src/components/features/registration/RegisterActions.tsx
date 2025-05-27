import { Button } from '@/components/ui/button';
import React from 'react';

interface RegisterActionsProps {
  onCancel?: () => void;
  onSend?: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export const RegisterActions: React.FC<RegisterActionsProps> = ({
  onCancel,
  onSend,
  loading = false,
  disabled = false,
}) => {
  return (
    <div className="flex justify-end gap-4 mt-8">
      <Button variant="destructive" onClick={onCancel} type="button">
        Cancelar
      </Button>
      <Button
        variant="primary"
        onClick={onSend}
        type="submit"
        disabled={disabled || loading}
      >
        {loading ? 'Enviando...' : 'Enviar Inscrição'}
      </Button>
    </div>
  );
};
