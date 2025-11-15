import { DataCard } from '@/components/molecules/DataCard'
import { Mail, Clock, CheckCircle, AlertCircle } from 'lucide-react'

interface InvitationStats {
  total: number
  pending: number
  accepted: number
  expired: number
}

interface InvitationStatsCardsProps {
  stats: InvitationStats
}

export function InvitationStatsCards({ stats }: InvitationStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <DataCard icon={Mail} label="Total de Convites" value={stats.total} variant="primary" />
      <DataCard icon={Clock} label="Pendentes" value={stats.pending} variant="warning" />
      <DataCard icon={CheckCircle} label="Aceitos" value={stats.accepted} variant="success" />
      <DataCard icon={AlertCircle} label="Expirados" value={stats.expired} variant="destructive" />
    </div>
  )
}
