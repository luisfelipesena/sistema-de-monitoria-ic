"use client"

import { PagesLayout } from "@/components/layout/PagesLayout"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { SEMESTRE_1, SEMESTRE_2, Semestre, TIPO_PROPOSICAO_COLETIVA } from "@/types"
import { api } from "@/utils/api"
import { getCurrentSemester } from "@/utils/utils"
import { AlertTriangle, Download, FileSpreadsheet, Mail, Send } from "lucide-react"
import { useMemo, useState } from "react"

export default function PlanilhaPROGRADPage() {
  const { toast } = useToast()

  // Use current semester as default
  const defaults = useMemo(() => getCurrentSemester(), [])
  const [selectedYear, setSelectedYear] = useState<number>(defaults.year)
  const [selectedSemester, setSelectedSemester] = useState<Semestre>(defaults.semester)
  const [showEmailModal, setShowEmailModal] = useState(false)

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

  const { data: emailDestinatarios } = api.analytics.getEmailDestinatarios.useQuery()
  const sendPlanilhaMutation = api.analytics.sendPlanilhaPROGRAD.useMutation()

  const handleLoadData = () => {
    refetch()
  }

  const handleDownloadCSV = () => {
    if (!planilhaData?.projetos?.length) {
      toast({
        title: "Aviso",
        description: "Carregue os dados primeiro para baixar o CSV.",
        variant: "destructive",
      })
      return
    }

    const headers = [
      "Unidade Universitária",
      "Órgão Responsável",
      "CÓDIGO",
      "Componente Curricular: NOME",
      "Professor Responsável",
      "Professores Participantes",
    ]

    const escapeCSV = (value: string) => {
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    }

    const rows = planilhaData.projetos.map((p) => [
      escapeCSV("Instituto de Computação"),
      escapeCSV(p.departamentoNome),
      escapeCSV(p.codigo),
      // Embed PDF link in discipline name if available
      escapeCSV(p.linkPDF ? `${p.disciplinaNome} (${p.linkPDF})` : p.disciplinaNome),
      escapeCSV(p.professorNome),
      escapeCSV(p.tipoProposicao === TIPO_PROPOSICAO_COLETIVA ? p.professoresParticipantes : ""),
    ])

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `Planilha_PROGRAD_${selectedYear}_${selectedSemester === SEMESTRE_1 ? "1" : "2"}.csv`
    link.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Download iniciado",
      description: "O arquivo CSV está sendo baixado.",
    })
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

    const hasEmails = emailDestinatarios?.icEmail || emailDestinatarios?.departamentoEmail
    if (!hasEmails) {
      toast({
        title: "Configuração pendente",
        description: "Configure os emails na página de configurações antes de enviar.",
        variant: "destructive",
      })
      return
    }

    try {
      const result = await sendPlanilhaMutation.mutateAsync({
        ano: selectedYear,
        semestre: selectedSemester,
      })

      toast({
        title: "Sucesso!",
        description: `Planilha enviada para ${result.destinatarios.join(", ")}`,
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

  const semestreDisplay = selectedSemester === SEMESTRE_1 ? "1" : "2"
  const totalProjetos = planilhaData?.projetos?.length || 0
  const hasEmails = emailDestinatarios?.icEmail || emailDestinatarios?.departamentoEmail

  return (
    <PagesLayout title="Planilha para Instituto" subtitle="Gere a planilha oficial e envie ao Instituto (IC)">
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
                <Select value={selectedSemester} onValueChange={(value) => setSelectedSemester(value as Semestre)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o semestre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SEMESTRE_1}>1º Semestre</SelectItem>
                    <SelectItem value={SEMESTRE_2}>2º Semestre</SelectItem>
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
                        {planilhaData.projetos.filter((p) => p.tipoProposicao === TIPO_PROPOSICAO_COLETIVA).length}
                      </div>
                      <div className="text-sm text-purple-700">Projetos Coletivos</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleDownloadCSV} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Baixar CSV
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

        {/* Preview da Planilha */}
        {planilhaData && planilhaData.projetos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Prévia da Planilha</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">Unidade</TableHead>
                      <TableHead className="min-w-[150px]">Órgão Responsável</TableHead>
                      <TableHead className="min-w-[80px]">Código</TableHead>
                      <TableHead className="min-w-[200px]">Componente Curricular</TableHead>
                      <TableHead className="min-w-[150px]">Professor Responsável</TableHead>
                      <TableHead className="min-w-[150px]">Prof. Participantes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {planilhaData.projetos.map((projeto, idx) => (
                      <TableRow key={projeto.id}>
                        <TableCell className="text-sm">Instituto de Computação</TableCell>
                        <TableCell className="text-sm">{projeto.departamentoNome}</TableCell>
                        <TableCell className="text-sm font-mono">{projeto.codigo}</TableCell>
                        <TableCell className="text-sm">
                          {projeto.linkPDF ? (
                            <a
                              href={projeto.linkPDF}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {projeto.disciplinaNome}
                            </a>
                          ) : (
                            <span>{projeto.disciplinaNome}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{projeto.professorNome}</TableCell>
                        <TableCell className="text-sm">
                          {projeto.tipoProposicao === TIPO_PROPOSICAO_COLETIVA ? projeto.professoresParticipantes : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modal de Envio por Email */}
        <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enviar Planilha por Email</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg space-y-2">
                <p className="text-sm font-medium text-blue-900">Destinatários:</p>
                <ul className="text-sm text-blue-800 space-y-1">
                  {emailDestinatarios?.icEmail && (
                    <li className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>
                        Instituto de Computação: <strong>{emailDestinatarios.icEmail}</strong>
                      </span>
                    </li>
                  )}
                  {emailDestinatarios?.departamentoEmail && (
                    <li className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>
                        {emailDestinatarios.departamentoNome || "Departamento"}:{" "}
                        <strong>{emailDestinatarios.departamentoEmail}</strong>
                      </span>
                    </li>
                  )}
                </ul>
              </div>

              {!hasEmails && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Nenhum email configurado. Acesse a página de Configurações para definir os emails.
                  </AlertDescription>
                </Alert>
              )}

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  A planilha com <strong>{totalProjetos} projeto(s)</strong> aprovados referentes a{" "}
                  <strong>
                    {selectedYear}.{semestreDisplay}
                  </strong>{" "}
                  será enviada em formato CSV.
                </p>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowEmailModal(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleSendEmail}
                  disabled={sendPlanilhaMutation.isPending || !hasEmails}
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
