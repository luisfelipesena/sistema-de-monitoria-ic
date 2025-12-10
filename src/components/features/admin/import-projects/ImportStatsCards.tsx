import { DataCard } from "@/components/molecules/DataCard"
import { CheckCircle, FileSpreadsheet, XCircle, Clock } from "lucide-react"

interface ImportStats {
  total: number
  concluidos: number
  comErros: number
  processando: number
}

interface ImportStatsCardsProps {
  stats: ImportStats
}

export function ImportStatsCards({ stats }: ImportStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      <DataCard
        icon={FileSpreadsheet}
        label="Total Importações"
        value={stats.total}
        description="Histórico completo"
        variant="default"
      />
      <DataCard
        icon={CheckCircle}
        label="Concluídos"
        value={stats.concluidos}
        description="Processados com sucesso"
        variant="success"
      />
      <DataCard
        icon={XCircle}
        label="Com Erros"
        value={stats.comErros}
        description="Concluídos com problemas"
        variant="destructive"
      />
      <DataCard
        icon={Clock}
        label="Processando"
        value={stats.processando}
        description="Em andamento"
        variant="warning"
      />
    </div>
  )
}
