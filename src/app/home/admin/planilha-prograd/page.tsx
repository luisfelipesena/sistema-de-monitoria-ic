"use client"

import { PlanilhaPROGRADDocument } from "@/components/features/prograd/PlanilhaPROGRAD"
import { PagesLayout } from "@/components/layout/PagesLayout"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/utils/api"
import { PDFViewer } from "@react-pdf/renderer"
import { AlertTriangle, Eye, FileSpreadsheet, Mail, Send } from "lucide-react"
import { useState } from "react"

export default function PlanilhaPROGRADPage() {
  const { toast } = useToast()
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedSemester, setSelectedSemester] = useState<"SEMESTRE_1" | "SEMESTRE_2">("SEMESTRE_1")
  const [showPreview, setShowPreview] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [progradEmail, setProgradEmail] = useState("prograd@ufba.br")

  const {
    data: planilhaData,
    isLoading,
    refetch,
  } = api.analytics.getProjetosAprovadosPROGRAD.useQuery(
    {
      ano: selectedYear,
      semestre: selectedSemester,
    },
    { enabled: false }
  )

  const sendPlanilhaMutation = api.analytics.sendPlanilhaPROGRAD.useMutation()

  const handleLoadData = () => {
    refetch()
  }

  const handlePreview = () => {
    if (!planilhaData?.projetos?.length) {
      toast({
        title: "Aviso",
        description: "Carregue os dados primeiro para visualizar a planilha.",
        variant: "destructive",
      })
      return
    }
    setShowPreview(true)
  }

  const handleSendEmail = async () => {
    if (!planilhaData?.projetos?.length) {
      toast({
        title: "Aviso",
        description: "Carregue os dados primeiro para enviar a planilha.",
        variant: "destructive",
      })
      return
    }

    if (!progradEmail || !progradEmail.includes("@")) {
      toast({
        title: "Erro",
        description: "Digite um email válido para enviar a planilha.",
        variant: "destructive",
      })
      return
    }

    try {
      await sendPlanilhaMutation.mutateAsync({
        ano: selectedYear,
        semestre: selectedSemester,
        progradEmail: progradEmail,
      })

      toast({
        title: "Sucesso!",
        description: `Planilha PROGRAD enviada para ${progradEmail}`,
      })

      setShowEmailModal(false)
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Falha ao enviar email",
        variant: "destructive",
      })
    }
  }

  const semestreDisplay = selectedSemester === "SEMESTRE_1" ? "1" : "2"
  const totalProjetos = planilhaData?.projetos?.length || 0

  return (
    <PagesLayout title="Planilha PROGRAD" subtitle="Gere e envie a planilha oficial para PROGRAD">
      <div className="space-y-6">
        {/* Configuração */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Configuração da Planilha
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ano">Ano</Label>
                <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="semestre">Semestre</Label>
                <Select
                  value={selectedSemester}
                  onValueChange={(value) => setSelectedSemester(value as "SEMESTRE_1" | "SEMESTRE_2")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o semestre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SEMESTRE_1">1º Semestre</SelectItem>
                    <SelectItem value="SEMESTRE_2">2º Semestre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button onClick={handleLoadData} disabled={isLoading} variant="outline">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                {isLoading ? "Carregando..." : "Carregar Dados"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resumo dos Dados */}
        {planilhaData && (
          <Card>
            <CardHeader>
              <CardTitle>
                Resumo dos Projetos - {selectedYear}.{semestreDisplay}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {totalProjetos > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{totalProjetos}</div>
                      <div className="text-sm text-green-700">Projetos Aprovados</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {[...new Set(planilhaData.projetos.map((p) => p.departamentoNome))].length}
                      </div>
                      <div className="text-sm text-blue-700">Departamentos</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {planilhaData.projetos.filter((p) => p.tipoProposicao === "COLETIVA").length}
                      </div>
                      <div className="text-sm text-purple-700">Projetos Coletivos</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handlePreview} variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizar Planilha
                    </Button>
                    <Button onClick={() => setShowEmailModal(true)} className="bg-blue-600 hover:bg-blue-700">
                      <Mail className="h-4 w-4 mr-2" />
                      Enviar por Email
                    </Button>
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Nenhum projeto aprovado encontrado para o período {selectedYear}.{semestreDisplay}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Modal de Visualização */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-6xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>
                Planilha PROGRAD - {selectedYear}.{semestreDisplay}
              </DialogTitle>
            </DialogHeader>
            <div className="h-[80vh] w-full">
              {planilhaData && (
                <PDFViewer width="100%" height="100%">
                  <PlanilhaPROGRADDocument data={planilhaData} />
                </PDFViewer>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Envio por Email */}
        <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enviar Planilha PROGRAD</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email da PROGRAD</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="prograd@ufba.br"
                  value={progradEmail}
                  onChange={(e) => setProgradEmail(e.target.value)}
                />
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  A planilha será enviada com {totalProjetos} projeto(s) aprovado(s) para o período {selectedYear}.
                  {semestreDisplay}
                </p>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowEmailModal(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleSendEmail}
                  disabled={sendPlanilhaMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sendPlanilhaMutation.isPending ? "Enviando..." : "Enviar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PagesLayout>
  )
}
