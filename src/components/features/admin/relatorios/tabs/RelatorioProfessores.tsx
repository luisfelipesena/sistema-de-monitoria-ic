import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TableComponent } from "@/components/layout/TableComponent"
import { professoresColumns } from "../columns/ProfessorColumns"
import type { ProfessorRelatorio } from "@/types"
import { GraduationCap, Download } from "lucide-react"

interface RelatorioProfessoresProps {
  data: ProfessorRelatorio[] | undefined
  isLoading: boolean
  onExport: () => void
  isExporting: boolean
}

export function RelatorioProfessores({ data, isLoading, onExport, isExporting }: RelatorioProfessoresProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Relatório de Professores
          </div>
          <Button variant="outline" onClick={onExport} disabled={isExporting}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : data && data.length > 0 ? (
          <TableComponent
            columns={professoresColumns}
            data={data}
            searchableColumn="professor"
            searchPlaceholder="Buscar professor..."
          />
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum dado encontrado para o período selecionado.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
