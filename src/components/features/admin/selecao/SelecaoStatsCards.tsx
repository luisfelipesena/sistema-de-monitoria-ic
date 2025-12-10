import { DataCard } from '@/components/molecules/DataCard'
import { ClipboardList, Clock, FileCheck, CheckCircle } from 'lucide-react'

interface SelecaoStatsCardsProps {
  stats: {
    total: number
    pendente: number
    emSelecao: number
    assinado: number
  }
}

export function SelecaoStatsCards({ stats }: SelecaoStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <DataCard label="Total de Projetos" value={stats.total} icon={ClipboardList} />
      <DataCard label="Pendentes" value={stats.pendente} icon={Clock} variant="warning" />
      <DataCard label="Em Seleção" value={stats.emSelecao} icon={FileCheck} />
      <DataCard label="Concluídos" value={stats.assinado} icon={CheckCircle} variant="success" />
    </div>
  )
}
