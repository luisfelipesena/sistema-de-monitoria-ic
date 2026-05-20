import { DataCard } from "@/components/molecules/DataCard"
import { List, AlertTriangle, Clock, FileSignature, CheckCircle } from "lucide-react"

interface ProjectsStatsCardsProps {
  total: number
  draft: number
  submitted: number
  approved: number
  rejected: number
}

export function ProjectsStatsCards({ total, draft, submitted, approved, rejected }: ProjectsStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
      <DataCard
        icon={List}
        label="Total de Projetos"
        value={total}
        description="Todos os projetos"
        variant="primary"
        className="border-2 border-blue-200 bg-blue-50"
      />

      <DataCard icon={AlertTriangle} label="Rascunhos" value={draft} description="Aguardando submissão" />

      <DataCard
        icon={Clock}
        label="Em Análise"
        value={submitted}
        description="Para aprovação"
        variant="warning"
      />

      <DataCard
        icon={FileSignature}
        label="Pend. Assinatura"
        value={0}
        description="Aguardando assinatura"
        variant="primary"
      />

      <DataCard
        icon={CheckCircle}
        label="Aprovados"
        value={approved}
        description="Projetos ativos"
        variant="success"
      />

      <DataCard
        icon={AlertTriangle}
        label="Rejeitados"
        value={rejected}
        description="Requer revisão"
        variant="destructive"
      />
    </div>
  )
}
