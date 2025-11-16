import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DialogTrigger } from '@/components/ui/dialog'
import {
  INVITATION_STATUS_ACCEPTED,
  INVITATION_STATUS_EXPIRED,
  INVITATION_STATUS_PENDING,
  type ProfessorInvitationStatus,
} from '@/types'
import { UserPlus } from 'lucide-react'

const FILTER_ALL = 'ALL' as const

type FilterStatus = ProfessorInvitationStatus | typeof FILTER_ALL

interface InvitationTableHeaderProps {
  filterStatus: FilterStatus
  onFilterChange: (value: FilterStatus) => void
  invitationCount?: number
}

export function InvitationTableHeader({ filterStatus, onFilterChange, invitationCount }: InvitationTableHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <UserPlus className="h-5 w-5" />
        Convites de Professor
        {invitationCount !== undefined && (
          <Badge variant="outline" className="ml-2">
            {invitationCount} convite(s)
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Select value={filterStatus} onValueChange={onFilterChange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={FILTER_ALL}>Todos</SelectItem>
            <SelectItem value={INVITATION_STATUS_PENDING}>Pendentes</SelectItem>
            <SelectItem value={INVITATION_STATUS_ACCEPTED}>Aceitos</SelectItem>
            <SelectItem value={INVITATION_STATUS_EXPIRED}>Expirados</SelectItem>
          </SelectContent>
        </Select>
        <DialogTrigger asChild>
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Novo Convite
          </Button>
        </DialogTrigger>
      </div>
    </div>
  )
}
