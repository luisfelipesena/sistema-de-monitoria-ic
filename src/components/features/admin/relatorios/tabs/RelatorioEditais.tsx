import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TableComponent } from "@/components/layout/TableComponent"
import { editaisColumns } from "../columns/EditalColumns"
import type { EditalRelatorio } from "@/types"
import { FileSpreadsheet, Download } from "lucide-react"

interface RelatorioEditaisProps {
  data: EditalRelatorio[] | undefined
  isLoading: boolean
  onExport: () => void
  isExporting: boolean
}

export function RelatorioEditais({ data, isLoading, onExport, isExporting }: RelatorioEditaisProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Relatório de Editais
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
            columns={editaisColumns}
            data={data}
            searchableColumn="edital"
            searchPlaceholder="Buscar edital..."
          />
        ) : (
          <div className="text-center py-8 text-muted-foreground">Nenhum edital encontrado.</div>
        )}
      </CardContent>
    </Card>
  )
}
