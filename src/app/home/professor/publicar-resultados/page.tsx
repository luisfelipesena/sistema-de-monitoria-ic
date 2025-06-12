"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/utils/api"
import { Award, Eye, FileText, Send, Users } from "lucide-react"
import { useState } from "react"

// Template simples para resultado - você pode expandir
function ResultadoTemplate({ data }: { data: any }) {
  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Resultados da Seleção - Monitoria</h1>
      <p>
        <strong>Projeto:</strong> {data.projeto.titulo}
      </p>
      <p>
        <strong>Professor:</strong> {data.projeto.professorResponsavel.nomeCompleto}
      </p>

      <h2>Candidatos Selecionados</h2>
      {data.selecionados.map((candidato: any) => (
        <div key={candidato.id} style={{ margin: "10px 0", padding: "10px", border: "1px solid #4ade80" }}>
          <p>
            <strong>Nome:</strong> {candidato.aluno.user.username}
          </p>
          <p>
            <strong>Tipo:</strong> {candidato.tipoVagaPretendida}
          </p>
          <p>
            <strong>Nota Final:</strong> {candidato.notaFinal}
          </p>
        </div>
      ))}
    </div>
  )
}

export default function PublicarResultadosPage() {
  const { toast } = useToast()
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [notifyStudents, setNotifyStudents] = useState(true)
  const [mensagemPersonalizada, setMensagemPersonalizada] = useState("")
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState<any>(null)

  // Buscar projetos do professor
  const { data: projetos, isLoading: loadingProjetos } = api.projeto.getProjetos.useQuery()

  // Buscar dados dos resultados quando projeto for selecionado
  const { data: dadosResultados, isLoading: loadingResultados } = api.selecao.generateAtaData.useQuery(
    { projetoId: selectedProjectId!.toString() },
    { enabled: !!selectedProjectId }
  )

  // Mutation para publicar resultados
  const publishResultsMutation = api.selecao.publishResults.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Resultados publicados!",
        description: `${data.notificationsCount} notificações foram enviadas aos candidatos.`,
      })
    },
    onError: (error) => {
      toast({
        title: "Erro ao publicar resultados",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  // Projetos que podem ter resultados publicados
  const projetosElegiveis = projetos?.filter((p) => p.status === "APPROVED" && p.totalInscritos > 0) || []

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(parseInt(projectId))
    setShowPreview(false)
  }

  const handlePublishResults = () => {
    if (!selectedProjectId) return

    publishResultsMutation.mutate({
      projetoId: selectedProjectId.toString(),
      notifyStudents,
      mensagemPersonalizada: mensagemPersonalizada || undefined,
    })
  }

  const handlePreviewPDF = () => {
    if (!dadosResultados) return
    setPreviewData(dadosResultados)
    setShowPreview(true)
  }

  const formatStatus = (status: string) => {
    switch (status) {
      case "SELECTED_BOLSISTA":
        return "Selecionado (Bolsista)"
      case "SELECTED_VOLUNTARIO":
        return "Selecionado (Voluntário)"
      case "REJECTED_BY_PROFESSOR":
        return "Não Selecionado"
      case "WAITING_LIST":
        return "Lista de Espera"
      default:
        return status
    }
  }

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "SELECTED_BOLSISTA":
        return "default"
      case "SELECTED_VOLUNTARIO":
        return "secondary"
      case "REJECTED_BY_PROFESSOR":
        return "destructive"
      case "WAITING_LIST":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Publicar Resultados</h1>
        <p className="text-muted-foreground">Publique os resultados da seleção e notifique os candidatos</p>
      </div>

      {/* Seleção de Projeto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Selecionar Projeto
          </CardTitle>
          <CardDescription>Escolha um projeto para publicar os resultados da seleção</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="projeto">Projeto de Monitoria</Label>
            <Select onValueChange={handleSelectProject} disabled={loadingProjetos}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um projeto..." />
              </SelectTrigger>
              <SelectContent>
                {projetosElegiveis.map((projeto) => (
                  <SelectItem key={projeto.id} value={projeto.id.toString()}>
                    <div className="flex flex-col">
                      <span className="font-medium">{projeto.titulo}</span>
                      <span className="text-sm text-muted-foreground">
                        {projeto.ano}.{projeto.semestre === "SEMESTRE_1" ? "1" : "2"} - {projeto.totalInscritos}{" "}
                        candidatos
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {projetosElegiveis.length === 0 && !loadingProjetos && (
            <p className="text-sm text-muted-foreground">
              Nenhum projeto elegível encontrado. Para publicar resultados, o projeto deve estar aprovado e ter
              candidatos inscritos.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Configurações de Publicação */}
      {selectedProjectId && dadosResultados && (
        <Card>
          <CardHeader>
            <CardTitle>Configurações da Publicação</CardTitle>
            <CardDescription>Configure como os resultados serão divulgados aos candidatos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="notifyStudents"
                checked={notifyStudents}
                onCheckedChange={(checked) => setNotifyStudents(checked as boolean)}
              />
              <Label htmlFor="notifyStudents" className="text-sm font-medium">
                Enviar notificações por e-mail aos candidatos
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mensagem">Mensagem Personalizada (opcional)</Label>
              <Textarea
                id="mensagem"
                value={mensagemPersonalizada}
                onChange={(e) => setMensagemPersonalizada(e.target.value)}
                placeholder="Adicione uma mensagem personalizada que será incluída nas notificações..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo dos Resultados */}
      {dadosResultados && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Resumo dos Resultados
            </CardTitle>
            <CardDescription>Candidatos selecionados para o projeto</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{dadosResultados.totalInscritos}</div>
                  <div className="text-sm text-muted-foreground">Total de Candidatos</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{dadosResultados.totalCompareceram}</div>
                  <div className="text-sm text-muted-foreground">Compareceram</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{dadosResultados.inscricoesBolsista.length}</div>
                  <div className="text-sm text-muted-foreground">Bolsistas</div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {dadosResultados.inscricoesVoluntario.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Voluntários</div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                {/* Selecionados */}
                {dadosResultados.totalCompareceram > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Award className="h-4 w-4 text-green-600" />
                      Candidatos Selecionados (
                      {dadosResultados.inscricoesBolsista.length + dadosResultados.inscricoesVoluntario.length})
                    </h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {dadosResultados.inscricoesBolsista.map((candidato: any) => (
                        <div
                          key={candidato.id}
                          className="flex items-center justify-between p-3 border rounded-lg bg-green-50"
                        >
                          <div>
                            <div className="font-medium">{candidato.aluno.user.username}</div>
                            <div className="text-sm text-muted-foreground">
                              Matrícula: {candidato.aluno.matricula} | CR: {candidato.aluno.cr?.toFixed(2) || "N/A"}
                              {candidato.notaFinal && ` | Nota Final: ${Number(candidato.notaFinal).toFixed(1)}`}
                            </div>
                          </div>
                          <Badge variant="default">Bolsista</Badge>
                        </div>
                      ))}
                      {dadosResultados.inscricoesVoluntario.map((candidato: any) => (
                        <div
                          key={candidato.id}
                          className="flex items-center justify-between p-3 border rounded-lg bg-blue-50"
                        >
                          <div>
                            <div className="font-medium">{candidato.aluno.user.username}</div>
                            <div className="text-sm text-muted-foreground">
                              Matrícula: {candidato.aluno.matricula} | CR: {candidato.aluno.cr?.toFixed(2) || "N/A"}
                              {candidato.notaFinal && ` | Nota Final: ${Number(candidato.notaFinal).toFixed(1)}`}
                            </div>
                          </div>
                          <Badge variant="secondary">Voluntário</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rejeitados */}
                {dadosResultados.totalInscritos - dadosResultados.totalCompareceram > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">
                      Candidatos Não Selecionados ({dadosResultados.totalInscritos - dadosResultados.totalCompareceram})
                    </h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      <p className="text-sm text-muted-foreground">
                        Candidatos que não compareceram à seleção ou não atingiram a nota mínima.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ações */}
      {selectedProjectId && dadosResultados && (
        <Card>
          <CardHeader>
            <CardTitle>Ações</CardTitle>
            <CardDescription>Publique os resultados ou visualize uma prévia</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button
                onClick={handlePublishResults}
                disabled={publishResultsMutation.isPending || loadingResultados}
                className="flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {publishResultsMutation.isPending ? "Publicando..." : "Publicar Resultados"}
              </Button>
              <Button variant="outline" onClick={handlePreviewPDF} disabled={loadingResultados}>
                <Eye className="w-4 h-4 mr-2" />
                Visualizar Prévia
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visualizador de Prévia */}
      {showPreview && previewData && (
        <Card>
          <CardHeader>
            <CardTitle>Prévia dos Resultados</CardTitle>
            <CardDescription>Como os resultados aparecerão para os candidatos</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              style={{
                height: "600px",
                width: "100%",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                overflow: "auto",
              }}
            >
              <ResultadoTemplate
                data={{
                  projeto: previewData.projeto,
                  selecionados: [...previewData.inscricoesBolsista, ...previewData.inscricoesVoluntario],
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
