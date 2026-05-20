import { DataCard } from '@/components/molecules/DataCard'
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react'

interface StatusCounts {
  draft: number
  submitted: number
  approved: number
  rejected: number
}

interface DashboardStatsCardsProps {
  statusCounts: StatusCounts
}

export function DashboardStatsCards({ statusCounts }: DashboardStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6">
      <DataCard
        icon={AlertTriangle}
        label="Rascunhos"
        value={statusCounts.draft}
        description="Projetos em edição"
        variant="default"
      />
      <DataCard
        icon={Clock}
        label="Em Análise"
        value={statusCounts.submitted}
        description="Para aprovação admin"
        variant="warning"
      />
      <DataCard
        icon={CheckCircle}
        label="Aprovados"
        value={statusCounts.approved}
        description="Prontos para edital interno"
        variant="success"
      />
      <DataCard
        icon={AlertTriangle}
        label="Rejeitados"
        value={statusCounts.rejected}
        description="Necessitam revisão"
        variant="destructive"
      />
    </div>
  )
}
