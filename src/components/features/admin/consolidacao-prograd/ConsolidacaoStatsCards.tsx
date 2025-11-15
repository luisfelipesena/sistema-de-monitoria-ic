import { DataCard } from "@/components/molecules/DataCard"
import { TIPO_VAGA_BOLSISTA, TIPO_VAGA_VOLUNTARIO, type MonitorConsolidado } from "@/types"
import { Award, FileSpreadsheet, Users } from "lucide-react"

interface ConsolidacaoStatsCardsProps {
  data: MonitorConsolidado[] | undefined
}

export function ConsolidacaoStatsCards({ data }: ConsolidacaoStatsCardsProps) {
  const safeData = data || []
  const monitoresBolsistas = safeData.filter((item) => item.monitoria.tipo === TIPO_VAGA_BOLSISTA)
  const monitoresVoluntarios = safeData.filter((item) => item.monitoria.tipo === TIPO_VAGA_VOLUNTARIO)
  const totalBolsas = monitoresBolsistas.reduce((sum, item) => sum + (item.monitoria.valorBolsa || 0), 0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <DataCard icon={Users} label="Total de Monitores" value={safeData.length} variant="primary" />
      <DataCard icon={Award} label="Bolsistas" value={monitoresBolsistas.length} variant="warning" />
      <DataCard icon={Users} label="Voluntários" value={monitoresVoluntarios.length} variant="success" />
      <DataCard
        icon={FileSpreadsheet}
        label="Total em Bolsas"
        value={`R$ ${totalBolsas.toFixed(2)}`}
        variant="default"
      />
    </div>
  )
}
