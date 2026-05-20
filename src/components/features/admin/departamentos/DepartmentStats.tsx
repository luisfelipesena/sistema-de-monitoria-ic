import { DataCard } from '@/components/molecules/DataCard'
import { Building, Users } from 'lucide-react'
import type { DepartamentoListItem } from '@/types'
import { DEPARTMENT_STATUS_ATIVO } from '@/types'

interface DepartmentStatsProps {
  departamentos: DepartamentoListItem[]
}

export function DepartmentStats({ departamentos }: DepartmentStatsProps) {
  const totalDepartamentos = departamentos.length
  const departamentosAtivos = departamentos.filter(
    (d) => d.status === DEPARTMENT_STATUS_ATIVO
  ).length
  const totalProfessores = departamentos.reduce(
    (sum, d) => sum + d.professores,
    0
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <DataCard
        icon={Building}
        label="Total de Departamentos"
        value={totalDepartamentos}
        variant="default"
      />
      <DataCard
        icon={Building}
        label="Ativos"
        value={departamentosAtivos}
        variant="success"
      />
      <DataCard
        icon={Users}
        label="Total de Professores"
        value={totalProfessores}
        variant="primary"
      />
    </div>
  )
}
