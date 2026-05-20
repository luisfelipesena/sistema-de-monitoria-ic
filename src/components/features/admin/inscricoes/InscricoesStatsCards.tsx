import { DataCard } from '@/components/molecules/DataCard'
import { FileText, CheckCircle, XCircle, Clock } from 'lucide-react'

interface InscricoesStatsCardsProps {
  stats: {
    total: number
    submitted: number
    selected: number
    rejected: number
  }
}

export function InscricoesStatsCards({ stats }: InscricoesStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <DataCard label="Total de Inscrições" value={stats.total} icon={FileText} />
      <DataCard label="Aguardando Seleção" value={stats.submitted} icon={Clock} variant="warning" />
      <DataCard label="Selecionados" value={stats.selected} icon={CheckCircle} variant="success" />
      <DataCard label="Rejeitados" value={stats.rejected} icon={XCircle} variant="destructive" />
    </div>
  )
}
