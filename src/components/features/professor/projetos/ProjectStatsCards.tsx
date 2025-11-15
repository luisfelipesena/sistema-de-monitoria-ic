import { DataCard } from "@/components/molecules/DataCard"
import { ProfessorProjetoListItem, PROJETO_STATUS_APPROVED } from "@/types"
import { BookOpen, CheckCircle, Award, Users } from "lucide-react"

interface ProjectStatsCardsProps {
  projetos: ProfessorProjetoListItem[]
}

export function ProjectStatsCards({ projetos }: ProjectStatsCardsProps) {
  const totalProjetos = projetos.length
  const projetosAprovados = projetos.filter((p) => p.status === PROJETO_STATUS_APPROVED).length
  const totalBolsas = projetos.reduce((sum, p) => sum + p.bolsasSolicitadas, 0)
  const totalVoluntarios = projetos.reduce((sum, p) => sum + p.voluntariosSolicitados, 0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <DataCard icon={BookOpen} label="Total de Projetos" value={totalProjetos} variant="default" />

      <DataCard icon={CheckCircle} label="Aprovados" value={projetosAprovados} variant="success" />

      <DataCard icon={Award} label="Bolsas Solicitadas" value={totalBolsas} variant="primary" />

      <DataCard icon={Users} label="Voluntários Solicitados" value={totalVoluntarios} variant="primary" />
    </div>
  )
}
