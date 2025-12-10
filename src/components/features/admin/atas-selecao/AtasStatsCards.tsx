import { DataCard } from '@/components/molecules/DataCard'
import { FileText, FilePlus, CheckCircle } from 'lucide-react'

interface AtasStatsCardsProps {
  stats: {
    total: number
    rascunho: number
    assinado: number
  }
}

export function AtasStatsCards({ stats }: AtasStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <DataCard label="Total de Atas" value={stats.total} icon={FileText} />
      <DataCard label="Rascunhos" value={stats.rascunho} icon={FilePlus} variant="warning" />
      <DataCard label="Assinadas" value={stats.assinado} icon={CheckCircle} variant="success" />
    </div>
  )
}
