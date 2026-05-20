import { DataCard } from '@/components/molecules/DataCard'
import { Users, FilePlus, Clock, CheckCircle } from 'lucide-react'

interface RelatorioMonitorStatsCardsProps {
  stats: {
    total: number
    draft: number
    pendingStudent: number
    complete: number
  }
}

export function RelatorioMonitorStatsCards({ stats }: RelatorioMonitorStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <DataCard label="Total de Monitores" value={stats.total} icon={Users} />
      <DataCard label="Em Rascunho" value={stats.draft} icon={FilePlus} />
      <DataCard label="Aguardando Aluno" value={stats.pendingStudent} icon={Clock} variant="warning" />
      <DataCard label="Completos" value={stats.complete} icon={CheckCircle} variant="success" />
    </div>
  )
}
