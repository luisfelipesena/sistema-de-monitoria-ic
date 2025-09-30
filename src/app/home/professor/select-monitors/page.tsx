"use client"

import { PagesLayout } from "@/components/layout/PagesLayout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/utils/api"
import { Award, Check, FileCheck, GraduationCap, Mail, Search, Star, User, Users } from "lucide-react"
import { useState } from "react"

interface Candidato {
  id: number
  status: string
  tipoVagaPretendida: string | null
  notaDisciplina: string | null
  notaSelecao: string | null
  notaFinal: string | null
  aluno: {
    id: number
    nomeCompleto: string
    matricula: string | null
    cr: number | null
    user: {
      email: string
    }
  }
}

interface Projeto {
  id: number
  titulo: string
  bolsasDisponibilizadas: number | null
  voluntariosSolicitados: number | null
  inscricoes: Candidato[]
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }, (_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 4 }, (_, j) => (
                <Skeleton key={j} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function SelectMonitorsPage() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProject, setSelectedProject] = useState<Projeto | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [feedback, setFeedback] = useState("")
  const [selectedCandidates, setSelectedCandidates] = useState<{
    bolsistas: number[]
    voluntarios: number[]
  }>({ bolsistas: [], voluntarios: [] })

  const { data: projetos = [], isLoading, refetch } = api.selecao.getProfessorProjectsWithCandidates.useQuery()

  const selectMonitorsMutation = api.selecao.selectMonitors.useMutation({
    onSuccess: (result) => {
      toast({
        title: "Sucesso!",
        description: result.message,
      })
      setDialogOpen(false)
      setSelectedCandidates({ bolsistas: [], voluntarios: [] })
      setFeedback("")
      refetch()
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const publishResultsMutation = api.selecao.publishResults.useMutation({
    onSuccess: (result) => {
      toast({
        title: "Resultados Publicados!",
        description: result.message,
      })
    },
    onError: (error) => {
      toast({
        title: "Erro ao Publicar",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  // Filter projects based on search term
  const filteredProjetos = projetos.filter((projeto) => projeto.titulo.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleSelectCandidate = (inscricaoId: number, tipo: "bolsista" | "voluntario") => {
    setSelectedCandidates((prev) => {
      if (tipo === "bolsista") {
        const isSelected = prev.bolsistas.includes(inscricaoId)
        const maxBolsistas = selectedProject?.bolsasDisponibilizadas || 0

        if (isSelected) {
          return {
            ...prev,
            bolsistas: prev.bolsistas.filter((id) => id !== inscricaoId),
          }
        } else if (prev.bolsistas.length < maxBolsistas) {
          return {
            ...prev,
            bolsistas: [...prev.bolsistas, inscricaoId],
          }
        }
        return prev
      } else {
        const isSelected = prev.voluntarios.includes(inscricaoId)
        const maxVoluntarios = selectedProject?.voluntariosSolicitados || 0

        if (isSelected) {
          return {
            ...prev,
            voluntarios: prev.voluntarios.filter((id) => id !== inscricaoId),
          }
        } else if (prev.voluntarios.length < maxVoluntarios) {
          return {
            ...prev,
            voluntarios: [...prev.voluntarios, inscricaoId],
          }
        }
        return prev
      }
    })
  }

  const handleSubmitSelection = () => {
    if (!selectedProject) return

    selectMonitorsMutation.mutate({
      projetoId: selectedProject.id,
      bolsistas: selectedCandidates.bolsistas,
      voluntarios: selectedCandidates.voluntarios,
    })
  }

  const handlePublishResults = (projeto: Projeto) => {
    publishResultsMutation.mutate({
      projetoId: projeto.id.toString(),
      notifyStudents: true,
      mensagemPersonalizada: feedback || undefined,
    })
  }

  const openSelectionDialog = (projeto: Projeto) => {
    setSelectedProject(projeto)
    setSelectedCandidates({ bolsistas: [], voluntarios: [] })
    setFeedback("")
    setDialogOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return <Badge variant="secondary">Inscrito</Badge>
      case "SELECTED_BOLSISTA":
        return (
          <Badge variant="default" className="bg-yellow-500">
            Selecionado - Bolsista
          </Badge>
        )
      case "SELECTED_VOLUNTARIO":
        return (
          <Badge variant="default" className="bg-blue-500">
            Selecionado - Voluntário
          </Badge>
        )
      case "ACCEPTED_BOLSISTA":
        return (
          <Badge variant="default" className="bg-green-500">
            Aceito - Bolsista
          </Badge>
        )
      case "ACCEPTED_VOLUNTARIO":
        return (
          <Badge variant="default" className="bg-green-600">
            Aceito - Voluntário
          </Badge>
        )
      case "REJECTED_BY_PROFESSOR":
        return <Badge variant="destructive">Rejeitado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <PagesLayout title="Seleção de Monitores" subtitle="Carregando projetos e inscricaos...">
        <LoadingSkeleton />
      </PagesLayout>
    )
  }

  return (
    <PagesLayout title="Seleção de Monitores" subtitle="Selecione bolsistas e voluntários para seus projetos">
      <div className="space-y-6">
        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar projeto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Projects Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-8 w-8 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{filteredProjetos.length}</div>
                  <p className="text-sm text-muted-foreground">Projetos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Award className="h-8 w-8 text-yellow-500" />
                <div>
                  <div className="text-2xl font-bold">
                    {filteredProjetos.reduce((sum, p) => sum + (p.bolsasDisponibilizadas || 0), 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">Bolsas Disponíveis</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Users className="h-8 w-8 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">
                    {filteredProjetos.reduce((sum, p) => sum + p.inscricoes.length, 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">Candidatos Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects List */}
        <div className="space-y-6">
          {filteredProjetos.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <FileCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum projeto encontrado</h3>
                  <p className="text-muted-foreground">
                    Você não possui projetos com inscricaos para seleção no momento.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredProjetos.map((projeto) => (
              <Card key={projeto.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{projeto.titulo}</CardTitle>
                      <CardDescription>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Award className="h-4 w-4 text-yellow-600" />
                            {projeto.bolsasDisponibilizadas || 0} bolsas
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-blue-600" />
                            {projeto.voluntariosSolicitados || 0} voluntários
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {projeto.inscricoes.length} inscricaos
                          </div>
                        </div>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Candidates Table */}
                  {projeto.inscricoes.length > 0 ? (
                    <>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Candidato</TableHead>
                              <TableHead className="w-24">CR</TableHead>
                              <TableHead className="w-20">Disc.</TableHead>
                              <TableHead className="w-20">Seleção</TableHead>
                              <TableHead className="w-20">Final</TableHead>
                              <TableHead className="w-32">Tipo Vaga</TableHead>
                              <TableHead className="w-32">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {projeto.inscricoes
                              .sort((a, b) => (Number(b.notaFinal) || 0) - (Number(a.notaFinal) || 0))
                              .map((inscricao) => (
                                <TableRow key={inscricao.id}>
                                  <TableCell>
                                    <div>
                                      <div className="font-medium">{inscricao.aluno.nomeCompleto}</div>
                                      <div className="text-sm text-muted-foreground">{inscricao.aluno.matricula}</div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1">
                                      <Star className="h-3 w-3 text-yellow-500" />
                                      {inscricao.aluno.cr?.toFixed(2) || "N/A"}
                                    </div>
                                  </TableCell>
                                  <TableCell>{Number(inscricao.notaDisciplina)?.toFixed(1) || "N/A"}</TableCell>
                                  <TableCell>{Number(inscricao.notaSelecao)?.toFixed(1) || "N/A"}</TableCell>
                                  <TableCell className="font-medium">
                                    {Number(inscricao.notaFinal)?.toFixed(1) || "N/A"}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">
                                      {(inscricao.tipoVagaPretendida || "") === "BOLSISTA" ? "Bolsista" : "Voluntário"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{getStatusBadge(inscricao.status)}</TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() => openSelectionDialog(projeto)}
                          disabled={publishResultsMutation.isPending}
                          className="flex-1"
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Selecionar Monitores
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Nenhum inscricao inscrito neste projeto</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Selection Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Selecionar Monitores</DialogTitle>
              <DialogDescription>{selectedProject?.titulo}</DialogDescription>
            </DialogHeader>

            {selectedProject && (
              <div className="space-y-6">
                {/* Selection Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Award className="h-5 w-5 text-yellow-500" />
                          <span className="font-medium">Bolsistas</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {selectedCandidates.bolsistas.length} / {selectedProject.bolsasDisponibilizadas || 0}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-blue-500" />
                          <span className="font-medium">Voluntários</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {selectedCandidates.voluntarios.length} / {selectedProject.voluntariosSolicitados || 0}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Candidates Selection */}
                <div className="space-y-4">
                  {/* Bolsistas Section */}
                  {(selectedProject.bolsasDisponibilizadas || 0 || 0) > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Award className="h-4 w-4 text-yellow-500" />
                        Candidatos a Bolsista
                      </h4>
                      <div className="space-y-2">
                        {selectedProject.inscricoes
                          .filter((c) => (c.tipoVagaPretendida || "") === "BOLSISTA")
                          .sort((a, b) => (Number(b.notaFinal) || 0) - (Number(a.notaFinal) || 0))
                          .map((inscricao, index) => (
                            <div
                              key={inscricao.id}
                              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 ${
                                selectedCandidates.bolsistas.includes(inscricao.id) ? "border-primary bg-primary/5" : ""
                              }`}
                              onClick={() => handleSelectCandidate(inscricao.id, "bolsista")}
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-700 text-sm font-medium">
                                  {index + 1}
                                </div>
                                <div>
                                  <div className="font-medium">{inscricao.aluno.nomeCompleto}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {inscricao.aluno.matricula} • CR: {inscricao.aluno.cr?.toFixed(2)} • Final:{" "}
                                    {Number(inscricao.notaFinal)?.toFixed(1)}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {selectedCandidates.bolsistas.includes(inscricao.id) ? (
                                  <Check className="h-5 w-5 text-primary" />
                                ) : (
                                  <div className="h-5 w-5 border border-muted-foreground/30 rounded" />
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Voluntários Section */}
                  {(selectedProject.voluntariosSolicitados || 0) > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-500" />
                        Candidatos a Voluntário
                      </h4>
                      <div className="space-y-2">
                        {selectedProject.inscricoes
                          .filter((c) => (c.tipoVagaPretendida || "") === "VOLUNTARIO")
                          .sort((a, b) => (Number(b.notaFinal) || 0) - (Number(a.notaFinal) || 0))
                          .map((inscricao, index) => (
                            <div
                              key={inscricao.id}
                              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 ${
                                selectedCandidates.voluntarios.includes(inscricao.id)
                                  ? "border-primary bg-primary/5"
                                  : ""
                              }`}
                              onClick={() => handleSelectCandidate(inscricao.id, "voluntario")}
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                                  {index + 1}
                                </div>
                                <div>
                                  <div className="font-medium">{inscricao.aluno.nomeCompleto}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {inscricao.aluno.matricula} • CR: {inscricao.aluno.cr?.toFixed(2)} • Final:{" "}
                                    {Number(inscricao.notaFinal)?.toFixed(1)}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {selectedCandidates.voluntarios.includes(inscricao.id) ? (
                                  <Check className="h-5 w-5 text-primary" />
                                ) : (
                                  <div className="h-5 w-5 border border-muted-foreground/30 rounded" />
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Feedback */}
                <div>
                  <Label htmlFor="feedback">Observações (Opcional)</Label>
                  <Textarea
                    id="feedback"
                    placeholder="Comentários sobre a seleção..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleSubmitSelection}
                disabled={
                  selectMonitorsMutation.isPending ||
                  (selectedCandidates.bolsistas.length === 0 && selectedCandidates.voluntarios.length === 0)
                }
              >
                <Mail className="h-4 w-4 mr-2" />
                {selectMonitorsMutation.isPending ? "Selecionando..." : "Confirmar Seleção"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PagesLayout>
  )
}
