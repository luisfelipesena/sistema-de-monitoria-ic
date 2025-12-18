import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TableComponent } from "@/components/layout/TableComponent"
import { disciplinasColumns } from "../columns/DisciplinaColumns"
import type { DisciplinaRelatorio } from "@/types"
import { BookOpen, Download } from "lucide-react"

interface RelatorioDisciplinasProps {
  data: DisciplinaRelatorio[] | undefined
  isLoading: boolean
  onExport: () => void
  isExporting: boolean
}

export function RelatorioDisciplinas({ data, isLoading, onExport, isExporting }: RelatorioDisciplinasProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Relatório de Disciplinas
          </div>
          <Button variant="outline" onClick={onExport} disabled={isExporting}>
            <Download className="h-4 w-4 mr-2" />
            Baixar Excel
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
            columns={disciplinasColumns}
            data={data}
            searchableColumn="disciplina"
            searchPlaceholder="Buscar disciplina..."
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
