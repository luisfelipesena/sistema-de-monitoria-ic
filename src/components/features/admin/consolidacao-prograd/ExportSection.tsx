import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { MonitorConsolidado, Semestre } from "@/types"
import { Download } from "lucide-react"
import { EmailDialog } from "./EmailDialog"

interface ExportSectionProps {
  data: MonitorConsolidado[] | undefined
  isLoading: boolean
  emailsDepartamento: string[]
  selectedYear: number
  selectedSemester: Semestre
  incluirBolsistas: boolean
  incluirVoluntarios: boolean
  showEmailDialog: boolean
  setShowEmailDialog: (show: boolean) => void
  isPendingExport: boolean
  onSendEmail: () => void
  onGenerateXLSX: () => void
}

export function ExportSection({
  data,
  isLoading,
  emailsDepartamento,
  selectedYear,
  selectedSemester,
  incluirBolsistas,
  incluirVoluntarios,
  showEmailDialog,
  setShowEmailDialog,
  isPendingExport,
  onSendEmail,
  onGenerateXLSX,
}: ExportSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Consolidação Final do Departamento</CardTitle>
        <p className="text-sm text-muted-foreground">
          Envie as planilhas consolidadas de bolsistas e voluntários para o departamento validar antes de encaminhar à
          PROGRAD
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Envio por Email (Departamento)</h4>
            <p className="text-sm text-muted-foreground">
              O sistema gera duas planilhas (bolsistas e voluntários) e encaminha automaticamente para os emails do
              departamento configurados
            </p>
            <div className="flex gap-2">
              <EmailDialog
                isOpen={showEmailDialog}
                onOpenChange={setShowEmailDialog}
                emailsDepartamento={emailsDepartamento}
                selectedYear={selectedYear}
                selectedSemester={selectedSemester}
                incluirBolsistas={incluirBolsistas}
                incluirVoluntarios={incluirVoluntarios}
                totalMonitores={data?.length || 0}
                isDisabled={!data || data.length === 0}
                isPending={isPendingExport}
                onSendEmail={onSendEmail}
              />
            </div>
          </div>

          <div className="border-t my-4" />

          <div className="space-y-2">
            <h4 className="font-medium">Exportação Rápida (Excel)</h4>
            <p className="text-sm text-muted-foreground">Formato Excel para análise rápida ou backup dos dados</p>
            <Button onClick={onGenerateXLSX} disabled={isLoading || !data || data.length === 0} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Baixar Excel
            </Button>
          </div>
        </div>

        {data && data.length === 0 && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">Nenhum monitor encontrado para o período selecionado.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
