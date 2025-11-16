import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/atoms/StatusBadge'
import type { InvitationItem } from '@/types'
import type { ColumnDef } from '@tanstack/react-table'
import { RefreshCw, Trash2, X } from 'lucide-react'

interface InvitationColumnHandlers {
  onCopyLink: (token: string) => void
  onResend: (id: number) => void
  onCancel: (id: number) => void
  onDelete: (id: number) => void
  isResending: boolean
  isCanceling: boolean
  isDeleting: boolean
}

function getActualStatus(status: string, expiresAt: Date): 'PENDING' | 'ACCEPTED' | 'EXPIRED' {
  if (status === 'ACCEPTED') return 'ACCEPTED'
  if (status === 'EXPIRED') return 'EXPIRED'
  return new Date(expiresAt) < new Date() ? 'EXPIRED' : 'PENDING'
}

export function createInvitationColumns(handlers: InvitationColumnHandlers): ColumnDef<InvitationItem>[] {
  return [
    {
      header: 'Email',
      accessorKey: 'email',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.email}</div>
          <div className="text-sm text-muted-foreground">
            Convite enviado em {new Date(row.original.createdAt).toLocaleDateString('pt-BR')}
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => {
        const actualStatus = getActualStatus(row.original.status, row.original.expiresAt)
        return <StatusBadge status={actualStatus} showIcon />
      },
    },
    {
      header: 'Expira em',
      accessorKey: 'expiresAt',
      cell: ({ row }) => {
        const now = new Date()
        const expiresAt = new Date(row.original.expiresAt)
        const isExpired = expiresAt < now

        if (isExpired) {
          return <span className="text-red-600">Expirado</span>
        }

        const diffTime = expiresAt.getTime() - now.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        return <span className={diffDays <= 1 ? 'text-orange-600' : 'text-muted-foreground'}>{diffDays} dia(s)</span>
      },
    },
    {
      header: 'Convidado por',
      accessorKey: 'invitedByUser.username',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.invitedByUser.username}</div>
          <div className="text-sm text-muted-foreground">{row.original.invitedByUser.email}</div>
        </div>
      ),
    },
    {
      header: 'Aceito por',
      cell: ({ row }) => {
        if (row.original.acceptedByUser) {
          return (
            <div>
              <div className="font-medium">{row.original.acceptedByUser.username}</div>
              <div className="text-sm text-muted-foreground">{row.original.acceptedByUser.email}</div>
            </div>
          )
        }
        return <span className="text-muted-foreground">-</span>
      },
    },
    {
      header: 'Ações',
      id: 'actions',
      cell: ({ row }) => {
        const invitation = row.original
        const now = new Date()
        const isExpired = invitation.expiresAt < now || invitation.status === 'EXPIRED'
        const isPending = invitation.status === 'PENDING' && !isExpired

        return (
          <div className="flex items-center gap-2">
            {isPending && (
              <>
                <Button variant="outline" size="sm" onClick={() => handlers.onCopyLink(invitation.token)}>
                  Copiar Link
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlers.onResend(invitation.id)}
                  disabled={handlers.isResending}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlers.onCancel(invitation.id)}
                  disabled={handlers.isCanceling}
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
            {(isExpired || invitation.status === 'EXPIRED') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlers.onResend(invitation.id)}
                disabled={handlers.isResending}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Reenviar
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlers.onDelete(invitation.id)}
              disabled={handlers.isDeleting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]
}
