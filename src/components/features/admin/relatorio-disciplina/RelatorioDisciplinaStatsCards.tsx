import { DataCard } from '@/components/molecules/DataCard'
import { FileText, Clock, FilePlus, CheckCircle } from 'lucide-react'

interface RelatorioDisciplinaStatsCardsProps {
  stats: {
    total: number
    notCreated: number
    draft: number
    submitted: number
  }
}

export function RelatorioDisciplinaStatsCards({ stats }: RelatorioDisciplinaStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <DataCard label="Total de Disciplinas" value={stats.total} icon={FileText} />
      <DataCard label="Sem Relatório" value={stats.notCreated} icon={Clock} variant="warning" />
      <DataCard label="Em Rascunho" value={stats.draft} icon={FilePlus} />
      <DataCard label="Enviados" value={stats.submitted} icon={CheckCircle} variant="success" />
    </div>
  )
}
