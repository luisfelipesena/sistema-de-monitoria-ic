'use client'

import { Badge } from '@/components/ui/badge'
import { RELATORIO_STATUS_LABELS, type RelatorioStatus } from '@/types'

const STATUS_COLORS: Record<RelatorioStatus, string> = {
  DRAFT: 'bg-yellow-100 text-yellow-800',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
}

interface RelatorioStatusBadgeProps {
  status: RelatorioStatus | null
}

export function RelatorioStatusBadge({ status }: RelatorioStatusBadgeProps) {
  if (!status) {
    return <Badge variant="outline">Não criado</Badge>
  }
  return <Badge className={STATUS_COLORS[status]}>{RELATORIO_STATUS_LABELS[status]}</Badge>
}
