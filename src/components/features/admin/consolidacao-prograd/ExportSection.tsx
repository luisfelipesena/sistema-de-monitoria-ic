import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { MonitorConsolidado, Semestre } from "@/types"
import { CheckCircle2, Clock, Download, FileSignature, FileText, Send } from "lucide-react"
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
  signatureStatus?: {
    isSigned: boolean
    chefeNome: string | null
    chefeEmail: string | null
    chefeAssinouEm: Date | null
    hasPendingToken: boolean
  }
  latestSignatureLink?: string | null
  isRequestingSignature?: boolean
  onSendEmail: (emailDestino?: string) => void
  onSendEmailBolsistas: (emailDestino?: string) => void
  onSendEmailVoluntarios: (emailDestino?: string) => void
  onGenerateXLSXBolsistas: () => void
  onGenerateXLSXVoluntarios: () => void
  onRequestChefeSignature: (chefeEmail: string, chefeNome: string) => void
  onDownloadPDF: () => void
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
  signatureStatus,
  latestSignatureLink,
  isRequestingSignature,
  onSendEmail,
  onSendEmailBolsistas,
  onSendEmailVoluntarios,
  onGenerateXLSXBolsistas,
  onGenerateXLSXVoluntarios,
  onRequestChefeSignature,
  onDownloadPDF,
}: ExportSectionProps) {
  const [showEmailBolsistasDialog, setShowEmailBolsistasDialog] = useState(false)
  const [showEmailVoluntariosDialog, setShowEmailVoluntariosDialog] = useState(false)
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false)
  const [chefeEmailInput, setChefeEmailInput] = useState(emailsDepartamento[0] || "dcc@ufba.br")
  const [chefeNomeInput, setChefeNomeInput] = useState(signatureStatus?.chefeNome || "")

  const handleSendSignatureRequest = () => {
    if (!chefeEmailInput.trim() || !chefeNomeInput.trim()) return
    onRequestChefeSignature(chefeEmailInput.trim(), chefeNomeInput.trim())
    setIsSignatureDialogOpen(false)
  }

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
          {/* Assinatura do Chefe do Departamento */}
          <div className="p-4 border rounded-lg bg-gray-50/50 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileSignature className="h-5 w-5 text-indigo-600" />
                <h4 className="font-medium text-base">Assinatura do Chefe de Departamento (PDF Consolidado)</h4>
              </div>
              {signatureStatus?.isSigned ? (
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Assinado em {new Date(signatureStatus.chefeAssinouEm!).toLocaleDateString("pt-BR")}
                </Badge>
              ) : signatureStatus?.hasPendingToken ? (
                <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
                  Aguardando Assinatura ({signatureStatus.chefeEmail})
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
                  Não Solicitado
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              O PDF Consolidado reúne os relatórios de resultados de todas as matérias com bolsas no período. O Chefe do Departamento receberá um e-mail com link exclusivo para assinar digitalmente.
            </p>

            <div className="flex flex-wrap gap-3 pt-1">
              <Dialog open={isSignatureDialogOpen} onOpenChange={setIsSignatureDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                    <Send className="h-4 w-4 mr-2 text-indigo-600" />
                    {signatureStatus?.hasPendingToken ? "Reenviar Solicitação de Assinatura" : "Solicitar Assinatura por E-mail"}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Solicitar Assinatura do Chefe do Departamento</DialogTitle>
                    <DialogDescription>
                      Envie um e-mail para o Chefe de Departamento contendo o link público para assinatura digital da Consolidação de Resultados ({selectedYear}.{selectedSemester === "SEMESTRE_1" ? "1" : "2"}).
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label htmlFor="chefeNomeInput">Nome do Chefe de Departamento</Label>
                      <Input
                        id="chefeNomeInput"
                        value={chefeNomeInput}
                        onChange={(e) => setChefeNomeInput(e.target.value)}
                        placeholder="Ex: Prof. Dr. João Silva"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="chefeEmailInput">E-mail do Chefe de Departamento</Label>
                      <Input
                        id="chefeEmailInput"
                        type="email"
                        value={chefeEmailInput}
                        onChange={(e) => setChefeEmailInput(e.target.value)}
                        placeholder="exemplo@ufba.br"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsSignatureDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSendSignatureRequest}
                      disabled={isRequestingSignature || !chefeEmailInput.trim() || !chefeNomeInput.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Enviar Solicitação
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button onClick={onDownloadPDF} disabled={isLoading || !data || data.length === 0} variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50">
                <FileText className="h-4 w-4 mr-2 text-purple-600" />
                Baixar PDF Consolidado (Resultados Bolsistas)
              </Button>
            </div>

            {latestSignatureLink && (
              <div className="mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm text-indigo-900 overflow-hidden">
                  <FileSignature className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span className="font-semibold shrink-0">Link de Assinatura:</span>
                  <code className="text-xs bg-indigo-100 px-2 py-0.5 rounded truncate max-w-xs">{latestSignatureLink}</code>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-indigo-300 text-indigo-700 hover:bg-indigo-100"
                  onClick={() => {
                    navigator.clipboard.writeText(latestSignatureLink)
                  }}
                >
                  Copiar Link de Assinatura
                </Button>
              </div>
            )}
          </div>

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

