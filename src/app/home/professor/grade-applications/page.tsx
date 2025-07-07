"use client"

import { PagesLayout } from "@/components/layout/PagesLayout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { inscriptionDetailSchema } from "@/types"
import { api } from "@/utils/api"
import { Calculator, ClipboardCheck, Save, Users } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { z } from "zod"

type InscricaoComDetalhes = z.infer<typeof inscriptionDetailSchema>

export default function GradeApplicationsPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [selectedInscricao, setSelectedInscricao] = useState<number | null>(null)
  const [notas, setNotas] = useState({
    notaDisciplina: "",
    notaSelecao: "",
    coeficienteRendimento: "",
    feedbackProfessor: "",
  })

  // Buscar projetos do professor
  const { data: projetos, isLoading: loadingProjetos } = api.projeto.getProjetos.useQuery()

  // Buscar inscrições do projeto selecionado
  const { data: inscricoes, isLoading: loadingInscricoes } = api.inscricao.getInscricoesProjeto.useQuery(
    { projetoId: selectedProjectId! },
    { enabled: !!selectedProjectId }
  )

  // Mutation para avaliar candidato
  const evaluateApplicationMutation = api.inscricao.evaluateApplications.useMutation({
    onSuccess: () => {
      toast.success("Notas salvas com sucesso!")
      setSelectedInscricao(null)
      setNotas({
        notaDisciplina: "",
        notaSelecao: "",
        coeficienteRendimento: "",
        feedbackProfessor: "",
      })
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao salvar notas")
    },
  })

  const handleSaveGrades = () => {
    if (!selectedInscricao) return

    const notaDisciplina = parseFloat(notas.notaDisciplina)
    const notaSelecao = parseFloat(notas.notaSelecao)
    const coeficienteRendimento = parseFloat(notas.coeficienteRendimento)

    if (isNaN(notaDisciplina) || isNaN(notaSelecao) || isNaN(coeficienteRendimento)) {
      toast.error("Todas as notas devem ser números válidos")
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

  const projetosAprovados = projetos?.filter((p) => p.status === "APPROVED") || []

  return (
    <PagesLayout title="Avaliar Candidatos">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">Avaliar Candidatos</h1>
            <p className="text-gray-600">Insira as notas dos candidatos que participaram do processo seletivo</p>
          </div>
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
              onValueChange={(value) => setSelectedProjectId(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um projeto para avaliar candidatos" />
              </SelectTrigger>
              <SelectContent>
                {projetosAprovados.map((projeto) => (
                  <SelectItem key={projeto.id} value={projeto.id.toString()}>
                    {projeto.titulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Lista de Candidatos */}
        {selectedProjectId && (
          <Card>
            <CardHeader>
              <CardTitle>Candidatos Inscritos</CardTitle>
              <p className="text-sm text-gray-600">Clique em um candidato para inserir suas notas</p>
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
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inscricoes.map((inscricao: InscricaoComDetalhes) => (
                      <TableRow key={inscricao.id} className={selectedInscricao === inscricao.id ? "bg-blue-50" : ""}>
                        <TableCell>{inscricao.aluno.nomeCompleto}</TableCell>
                        <TableCell>{inscricao.aluno.matricula}</TableCell>
                        <TableCell>
                          <Badge variant={inscricao.tipoVagaPretendida === "BOLSISTA" ? "default" : "secondary"}>
                            {inscricao.tipoVagaPretendida}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{inscricao.notaFinal ? "Avaliado" : "Pendente"}</Badge>
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
                    Nota Final Calculada: {calcularNotaFinal().toFixed(2)}
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
    </PagesLayout>
  )
}
