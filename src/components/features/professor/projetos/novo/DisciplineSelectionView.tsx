import { DisciplineSelector } from "@/components/features/projects/DisciplineSelector"
import { PagesLayout } from "@/components/layout/PagesLayout"
import type { Semestre } from "@/types"

interface DepartmentDiscipline {
  id: number
  codigo: string
  nome: string
  departamentoId: number
  isAssociated: boolean
  ano?: number
  semestre?: Semestre
}

interface DisciplineSelectionViewProps {
  disciplines: DepartmentDiscipline[]
  onSelect: (disciplinaId: string) => void
}

export function DisciplineSelectionView({ disciplines, onSelect }: DisciplineSelectionViewProps) {
  return (
    <PagesLayout title="Novo projeto de monitoria" subtitle="Selecione a disciplina para continuar">
      <div>
        <DisciplineSelector disciplines={disciplines} onSelect={onSelect} />
      </div>
    </PagesLayout>
  )
}
