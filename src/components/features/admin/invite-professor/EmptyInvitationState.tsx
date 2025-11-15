import { UserPlus } from 'lucide-react'

interface EmptyInvitationStateProps {
  filterStatus: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'ALL'
}

const FILTER_LABELS = {
  ALL: 'Ainda não foram enviados convites para professores.',
  PENDING: 'Não há convites com status "pendente".',
  ACCEPTED: 'Não há convites com status "aceito".',
  EXPIRED: 'Não há convites com status "expirado".',
}

export function EmptyInvitationState({ filterStatus }: EmptyInvitationStateProps) {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <UserPlus className="mx-auto h-12 w-12 mb-4" />
      <h3 className="text-lg font-medium mb-2">Nenhum convite encontrado</h3>
      <p>{FILTER_LABELS[filterStatus]}</p>
    </div>
  )
}
