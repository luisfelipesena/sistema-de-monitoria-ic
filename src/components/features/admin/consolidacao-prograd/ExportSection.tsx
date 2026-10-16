import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { MonitorConsolidado, Semestre } from "@/types"
import { Download } from "lucide-react"
import { ConsolidacaoSignatureSection } from "./ConsolidacaoSignatureSection"
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
  onSendEmail: (emailDestino?: string) => void
  onSendEmailBolsistas: (emailDestino?: string) => void
  onSendEmailVoluntarios: (emailDestino?: string) => void
  onGenerateXLSXBolsistas: () => void
  onGenerateXLSXVoluntarios: () => void
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
  onSendEmailBolsistas,
  onSendEmailVoluntarios,
  onGenerateXLSXBolsistas,
  onGenerateXLSXVoluntarios,
}: ExportSectionProps) {
  const [showEmailBolsistasDialog, setShowEmailBolsistasDialog] = useState(false)
  const [showEmailVoluntariosDialog, setShowEmailVoluntariosDialog] = useState(false)
  const bolsistasCount = data?.filter((item) => item.monitoria.tipo === "BOLSISTA").length || 0
  const voluntariosCount = data?.filter((item) => item.monitoria.tipo === "VOLUNTARIO").length || 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consolidação Final do Departamento</CardTitle>
        <p className="text-sm text-muted-foreground">
          Envie os documentos e planilhas consolidadas para o departamento validar e encaminhar à PROGRAD
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {(['BOLSISTA', 'VOLUNTARIO'] as const).map((tipo) => (
            <ConsolidacaoSignatureSection
              key={`${selectedYear}-${selectedSemester}-${tipo}`}
              ano={selectedYear}
              semestre={selectedSemester}
              tipo={tipo}
              defaultEmail={emailsDepartamento[0] || 'dcc@ufba.br'}
              disabled={isLoading || (tipo === 'BOLSISTA' ? bolsistasCount : voluntariosCount) === 0}
            />
          ))}

          {/* Envio de Documentos por E-mail (Departamento) */}
          <div className="space-y-3">
            <h4 className="font-medium">Envio de Documentos por E-mail (Departamento / PROGRAD)</h4>
            <p className="text-sm text-muted-foreground">
              Selecione a modalidade desejada para enviar por e-mail os relatórios, planilhas Excel e Termos de Compromisso individuais em PDF.
            </p>
            <div className="flex flex-wrap gap-3">
              <EmailDialog
                isOpen={showEmailBolsistasDialog}
                onOpenChange={setShowEmailBolsistasDialog}
                emailsDepartamento={emailsDepartamento}
                selectedYear={selectedYear}
                selectedSemester={selectedSemester}
                modalidade="bolsistas"
                incluirBolsistas={true}
                incluirVoluntarios={false}
                totalMonitores={bolsistasCount}
                isDisabled={!data || bolsistasCount === 0}
                isPending={isPendingExport}
                onSendEmail={onSendEmailBolsistas}
              />

              <EmailDialog
                isOpen={showEmailVoluntariosDialog}
                onOpenChange={setShowEmailVoluntariosDialog}
                emailsDepartamento={emailsDepartamento}
                selectedYear={selectedYear}
                selectedSemester={selectedSemester}
                modalidade="voluntarios"
                incluirBolsistas={false}
                incluirVoluntarios={true}
                totalMonitores={voluntariosCount}
                isDisabled={!data || voluntariosCount === 0}
                isPending={isPendingExport}
                onSendEmail={onSendEmailVoluntarios}
              />
            </div>
          </div>

          <div className="border-t my-4" />

          {/* Planilhas Excel */}
          <div className="space-y-2">
            <h4 className="font-medium">Exportação Rápida (Excel)</h4>
            <p className="text-sm text-muted-foreground">Formato Excel para análise rápida ou backup dos dados por modalidade</p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={onGenerateXLSXBolsistas} disabled={isLoading || !data || data.length === 0} variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                <Download className="h-4 w-4 mr-2 text-emerald-600" />
                Planilha de Bolsistas (XLSX)
              </Button>
              <Button onClick={onGenerateXLSXVoluntarios} disabled={isLoading || !data || data.length === 0} variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                <Download className="h-4 w-4 mr-2 text-blue-600" />
                Planilha de Voluntários (XLSX)
              </Button>
            </div>
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

