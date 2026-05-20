import { DataCard } from '@/components/molecules/DataCard'
import { Award, TrendingUp, Users } from 'lucide-react'

interface AllocationStatsProps {
  summary: {
    summary: {
      totalProjetos: number
      totalBolsasSolicitadas: string | null
      totalBolsasDisponibilizadas: string | null
      totalVoluntariosSolicitados: string | null
    }
    departmentSummary: Array<{
      departamento: { id: number; nome: string; sigla: string | null }
      projetos: number
      bolsasSolicitadas: number
      bolsasDisponibilizadas: number
    }>
  }
}

export function AllocationStats({ summary }: AllocationStatsProps) {
  const totalBolsasSolicitadas = Number(summary.summary.totalBolsasSolicitadas) || 0
  const totalBolsasDisponibilizadas = Number(summary.summary.totalBolsasDisponibilizadas) || 0
  const taxaAtendimento = totalBolsasSolicitadas
    ? Math.round((totalBolsasDisponibilizadas / totalBolsasSolicitadas) * 100)
    : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <DataCard icon={Users} label="Projetos" value={summary.summary.totalProjetos} variant="primary" />
      <DataCard icon={Award} label="Bolsas Solicitadas" value={totalBolsasSolicitadas} variant="success" />
      <DataCard
        icon={Award}
        label="Bolsas Disponibilizadas"
        value={totalBolsasDisponibilizadas}
        variant="default"
      />
      <DataCard icon={TrendingUp} label="Taxa de Atendimento" value={`${taxaAtendimento}%`} variant="warning" />
    </div>
  )
}
