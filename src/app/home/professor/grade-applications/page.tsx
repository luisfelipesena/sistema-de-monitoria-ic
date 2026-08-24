"use client"

import { PagesLayout } from "@/components/layout/PagesLayout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { getSemestreNumero, inscriptionDetailSchema, PROJETO_STATUS_APPROVED, Semestre, TIPO_VAGA_BOLSISTA } from "@/types"
import { api } from "@/utils/api"
import { Calculator, Check, ClipboardCheck, Copy, FileText, Loader2, Mail, Save, Users } from "lucide-react"
import { useMemo, useState } from "react"
import { z } from "zod"

type InscricaoComDetalhes = z.infer<typeof inscriptionDetailSchema>

export default function GradeApplicationsPage() {
  const { toast } = useToast()

  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [selectedInscricao, setSelectedInscricao] = useState<number | null>(null)
  const [loadingFileId, setLoadingFileId] = useState<string | null>(null)
  const [emailsModalOpen, setEmailsModalOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const [notas, setNotas] = useState({
    notaDisciplina: "",
    notaSelecao: "",
    coeficienteRendimento: "",
    feedbackProfessor: "",
  })

  const getPresignedUrlMutation = api.file.getPresignedUrlMutation.useMutation()

  const handleViewHistorico = async (fileId: string) => {
    setLoadingFileId(fileId)
    try {
      const url = await getPresignedUrlMutation.mutateAsync({ fileId, action: "view" })
      if (url) {
        window.open(url, "_blank")
      }
    } catch {
      toast({
        title: "Erro ao abrir histórico",
        description: "Não foi possível carregar o arquivo do Histórico Escolar.",
        variant: "destructive",
      })
    } finally {
      setLoadingFileId(null)
    }
  }

  // Buscar projetos do professor
  const { data: projetos, isLoading: loadingProjetos } = api.projeto.getProjetos.useQuery()

  // Buscar inscrições do projeto selecionado
  const { data: inscricoes, isLoading: loadingInscricoes } = api.inscricao.getInscricoesProjeto.useQuery(
    { projetoId: selectedProjectId! },
    { enabled: !!selectedProjectId }
  )

  // String formatada com os e-mails dos candidatos
  const emailsText = useMemo(() => {
    if (!inscricoes) return ""
    return inscricoes
      .map((i: any) => i.aluno?.user?.email)
      .filter((email: string | undefined): email is string => Boolean(email))
      .join(", ")
  }, [inscricoes])

  // Mutation para avaliar candidato
  const evaluateApplicationMutation = api.inscricao.evaluateApplications.useMutation({
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Notas salvas com sucesso!",
      })
      setSelectedInscricao(null)
      setNotas({
        notaDisciplina: "",
        notaSelecao: "",
        coeficienteRendimento: "",
        feedbackProfessor: "",
      })
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar notas",
        variant: "destructive",
      })
    },
  })

  const handleSaveGrades = () => {
    if (!selectedInscricao) return

    const notaDisciplina = parseFloat(notas.notaDisciplina)
    const notaSelecao = parseFloat(notas.notaSelecao)
    const coeficienteRendimento = parseFloat(notas.coeficienteRendimento)

    if (isNaN(notaDisciplina) || isNaN(notaSelecao) || isNaN(coeficienteRendimento)) {
      toast({
        title: "Erro",
        description: "Todas as notas devem ser números válidos",
        variant: "destructive",
      })
      return
    }

    evaluateApplicationMutation.mutate({
      inscricaoId: selectedInscricao,
      notaDisciplina,
      notaSelecao,
      coeficienteRendimento,
      feedbackProfessor: notas.feedbackProfessor || undefined,
    })
  }

  const calcularNotaFinal = () => {
    const disciplina = parseFloat(notas.notaDisciplina) || 0
    const selecao = parseFloat(notas.notaSelecao) || 0
    const cr = parseFloat(notas.coeficienteRendimento) || 0

    return (disciplina * 5 + selecao * 3 + cr * 2) / 10
  }

  const projetosAprovados = projetos?.filter((p) => p.status === PROJETO_STATUS_APPROVED) || []

  return (
    <PagesLayout title="Avaliar Candidatos">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="h-8 w-8 text-blue-600" />
          <p className="text-gray-600">Insira as notas dos candidatos que participaram do processo seletivo</p>
        </div>

        {/* Seleção de Projeto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Selecionar Projeto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedProjectId?.toString() || ""}
              onValueChange={(value) => {
                setSelectedProjectId(parseInt(value))
                setSelectedInscricao(null)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um projeto para avaliar candidatos" />
              </SelectTrigger>
              <SelectContent>
                {projetosAprovados.map((projeto) => {
                  const semestreNum = getSemestreNumero(projeto.semestre as Semestre)
                  return (
                    <SelectItem key={projeto.id} value={projeto.id.toString()}>
                      {projeto.titulo} ({projeto.ano}.{semestreNum})
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Lista de Candidatos */}
        {selectedProjectId && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle>Candidatos Inscritos</CardTitle>
                <p className="text-sm text-gray-600">Clique em um candidato para inserir suas notas</p>
              </div>
              {inscricoes && inscricoes.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEmailsModalOpen(true)
                    setCopied(false)
                  }}
                  className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  <Mail className="h-4 w-4" />
                  Copiar E-mails
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {loadingInscricoes ? (
                <div className="text-center py-4">Carregando candidatos...</div>
              ) : inscricoes && inscricoes.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Tipo de Vaga</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Histórico Escolar</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inscricoes.map((inscricao: InscricaoComDetalhes) => (
                      <TableRow key={inscricao.id} className={selectedInscricao === inscricao.id ? "bg-blue-50" : ""}>
                        <TableCell>{inscricao.aluno.nomeCompleto}</TableCell>
                        <TableCell>{inscricao.aluno.matricula}</TableCell>
                        <TableCell>
                          <Badge variant={inscricao.tipoVagaPretendida === TIPO_VAGA_BOLSISTA ? "default" : "secondary"}>
                            {inscricao.tipoVagaPretendida}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{inscricao.notaFinal ? "Avaliado" : "Pendente"}</Badge>
                        </TableCell>
                        <TableCell>
                          {inscricao.historicoEscolarFileId ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 border-blue-200"
                              disabled={loadingFileId === inscricao.historicoEscolarFileId}
                              onClick={() => handleViewHistorico(inscricao.historicoEscolarFileId!)}
                            >
                              {loadingFileId === inscricao.historicoEscolarFileId ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <FileText className="h-3.5 w-3.5 text-blue-600" />
                              )}
                              Ver Histórico
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Não disponível</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant={selectedInscricao === inscricao.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              setSelectedInscricao(inscricao.id)
                              if (inscricao.notaDisciplina) {
                                setNotas({
                                  notaDisciplina: inscricao.notaDisciplina.toString(),
                                  notaSelecao: inscricao.notaSelecao?.toString() || "",
                                  coeficienteRendimento: inscricao.coeficienteRendimento?.toString() || "",
                                  feedbackProfessor: inscricao.feedbackProfessor || "",
                                })
                              }
                            }}
                          >
                            {inscricao.notaFinal ? "Editar" : "Avaliar"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">Nenhum candidato inscrito neste projeto</div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Formulário de Avaliação */}
        {selectedInscricao && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Avaliação do Candidato
              </CardTitle>
              <p className="text-sm text-gray-600">Fórmula: (Nota Disciplina × 5 + Nota Seleção × 3 + CR × 2) ÷ 10</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="notaDisciplina">Nota na Disciplina (0-10)</Label>
                  <Input
                    id="notaDisciplina"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={notas.notaDisciplina}
                    onChange={(e) => setNotas({ ...notas, notaDisciplina: e.target.value })}
                    placeholder="Ex: 8.5"
                  />
                </div>

                <div>
                  <Label htmlFor="notaSelecao">Nota da Prova de Seleção (0-10)</Label>
                  <Input
                    id="notaSelecao"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={notas.notaSelecao}
                    onChange={(e) => setNotas({ ...notas, notaSelecao: e.target.value })}
                    placeholder="Ex: 7.2"
                  />
                </div>

                <div>
                  <Label htmlFor="coeficienteRendimento">Coeficiente de Rendimento (0-10)</Label>
                  <Input
                    id="coeficienteRendimento"
                    type="number"
                    min="0"
                    max="10"
                    step="0.01"
                    value={notas.coeficienteRendimento}
                    onChange={(e) => setNotas({ ...notas, coeficienteRendimento: e.target.value })}
                    placeholder="Ex: 8.75"
                  />
                </div>
              </div>

              {notas.notaDisciplina && notas.notaSelecao && notas.coeficienteRendimento && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium">
                    Nota Final Calculada: {calcularNotaFinal().toFixed(1)}
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="feedback">Observações (opcional)</Label>
                <Textarea
                  id="feedback"
                  value={notas.feedbackProfessor}
                  onChange={(e) => setNotas({ ...notas, feedbackProfessor: e.target.value })}
                  placeholder="Comentários sobre o desempenho do candidato..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSaveGrades}
                  disabled={
                    !notas.notaDisciplina ||
                    !notas.notaSelecao ||
                    !notas.coeficienteRendimento ||
                    evaluateApplicationMutation.isPending
                  }
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {evaluateApplicationMutation.isPending ? "Salvando..." : "Salvar Notas"}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedInscricao(null)
                    setNotas({
                      notaDisciplina: "",
                      notaSelecao: "",
                      coeficienteRendimento: "",
                      feedbackProfessor: "",
                    })
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de Cópia de E-mails */}
      <Dialog open={emailsModalOpen} onOpenChange={setEmailsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Mail className="h-5 w-5 text-blue-600" />
              E-mails dos Candidatos
            </DialogTitle>
            <DialogDescription>
              Copie os e-mails dos inscritos para colar no seu cliente de e-mail (Outlook, Gmail, etc):
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Textarea
              readOnly
              value={emailsText}
              rows={5}
              className="text-sm font-mono bg-slate-50 border-slate-300 focus-visible:ring-1"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEmailsModalOpen(false)}>
                Fechar
              </Button>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(emailsText)
                  setCopied(true)
                  toast({
                    title: "E-mails copiados!",
                    description: "Lista de e-mails copiada para a área de transferência.",
                  })
                }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                {copied ? <Check className="h-4 w-4 text-green-300" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copiado!" : "Copiar para Área de Transferência"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PagesLayout>
  )
}
