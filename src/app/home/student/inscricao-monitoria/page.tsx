"use client"

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { TIPO_VAGA_LABELS } from "@/types/enums"
import { api } from "@/utils/api"
import { zodResolver } from "@hookform/resolvers/zod"
import { Award, BookOpen, Calendar, Clock, FileText, MapPin, Search, User, Users } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

const inscricaoSchema = z.object({
  projetoId: z.number(),
  tipoVagaPretendida: z.enum([TIPO_VAGA_LABELS.BOLSISTA, TIPO_VAGA_LABELS.VOLUNTARIO]),
})

type InscricaoForm = z.infer<typeof inscricaoSchema>

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 6 }, (_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-64" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <div className="flex gap-4">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function InscricaoMonitoria() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDepartamento, setSelectedDepartamento] = useState<string>("")
  const [tipoVagaFilter, setTipoVagaFilter] = useState<string>("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedProjeto, setSelectedProjeto] = useState<any>(null)

  const { data: projetos = [], isLoading, refetch } = api.projeto.getProjetos.useQuery()
  const { data: departamentos = [] } = api.departamento.getDepartamentos.useQuery({})
  const createInscricao = api.inscricao.criarInscricao.useMutation({
    onSuccess: (result) => {
      toast({
        title: "Sucesso!",
        description: result.message,
      })
      setDialogOpen(false)
      form.reset()
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

  const form = useForm<InscricaoForm>({
    resolver: zodResolver(inscricaoSchema),
    defaultValues: {
      tipoVagaPretendida: TIPO_VAGA_LABELS.BOLSISTA,
    },
  })

  // Filter projects - only show APPROVED projects
  const filteredProjetos = projetos.filter((projeto) => {
    if (projeto.status !== "APPROVED") return false

    const matchesSearch =
      projeto.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      projeto.professorResponsavelNome.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesDepartamento = !selectedDepartamento || projeto.departamentoId.toString() === selectedDepartamento

    const matchesTipoVaga =
      !tipoVagaFilter ||
      (tipoVagaFilter === TIPO_VAGA_LABELS.BOLSISTA && (projeto.bolsasDisponibilizadas ?? 0) > 0) ||
      (tipoVagaFilter === TIPO_VAGA_LABELS.VOLUNTARIO && (projeto.voluntariosSolicitados ?? 0) > 0)

    return matchesSearch && matchesDepartamento && matchesTipoVaga
  })

  const handleInscricaoSubmit = async (data: InscricaoForm) => {
    try {
      await createInscricao.mutateAsync({
        projetoId: data.projetoId,
        tipoVagaPretendida: data.tipoVagaPretendida === TIPO_VAGA_LABELS.BOLSISTA ? "BOLSISTA" : "VOLUNTARIO",
      })
    } catch (error) {
      // Error handling is done in the mutation onError
    }
  }

  const openInscricaoDialog = (projeto: any) => {
    setSelectedProjeto(projeto)
    form.setValue("projetoId", projeto.id)
    setDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Inscrição em Monitoria</h1>
          <p className="text-muted-foreground">Encontre e inscreva-se em projetos de monitoria disponíveis.</p>
        </div>
        <LoadingSkeleton />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Inscrição em Monitoria</h1>
        <p className="text-muted-foreground">Encontre e inscreva-se em projetos de monitoria disponíveis.</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="search">Buscar projetos</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Título ou professor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="departamento">Departamento</Label>
              <Select value={selectedDepartamento} onValueChange={setSelectedDepartamento}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os departamentos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os departamentos</SelectItem>
                  {departamentos.map((dept: any) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tipoVaga">Tipo de vaga</Label>
              <Select value={tipoVagaFilter} onValueChange={setTipoVagaFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os tipos</SelectItem>
                  <SelectItem value={TIPO_VAGA_LABELS.BOLSISTA}>{TIPO_VAGA_LABELS.BOLSISTA}</SelectItem>
                  <SelectItem value={TIPO_VAGA_LABELS.VOLUNTARIO}>{TIPO_VAGA_LABELS.VOLUNTARIO}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredProjetos.length} projeto{filteredProjetos.length !== 1 ? "s" : ""} encontrado
          {filteredProjetos.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Project Cards */}
      <div className="space-y-4">
        {filteredProjetos.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum projeto encontrado</h3>
                <p className="text-muted-foreground">Tente ajustar os filtros para encontrar projetos disponíveis.</p>
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
                    <CardDescription className="text-base">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {projeto.professorResponsavelNome}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {projeto.departamentoNome}
                        </div>
                      </div>
                    </CardDescription>
                  </div>
                  <Badge variant="default">Ativo</Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-3">{projeto.descricao}</p>

                {/* Período e Carga Horária */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {projeto.ano}.{projeto.semestre === "SEMESTRE_1" ? "1" : "2"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{projeto.cargaHorariaSemana}h/semana</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-blue-600" />
                    <span>{projeto.bolsasDisponibilizadas || 0} bolsas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-600" />
                    <span>{projeto.voluntariosSolicitados || 0} voluntários</span>
                  </div>
                </div>

                {/* Público Alvo */}
                {projeto.publicoAlvo && (
                  <div className="flex items-start gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span>Público-alvo: {projeto.publicoAlvo}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => openInscricaoDialog(projeto)}
                    disabled={
                      createInscricao.isPending ||
                      ((projeto.bolsasDisponibilizadas ?? 0) === 0 && (projeto.voluntariosSolicitados ?? 0) === 0)
                    }
                    className="flex-1"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Inscrever-se
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Inscrição Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Inscrever-se no Projeto</DialogTitle>
            <DialogDescription>{selectedProjeto?.titulo}</DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(handleInscricaoSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="tipoVaga">Tipo de vaga desejada</Label>
              <Select
                value={form.watch("tipoVagaPretendida")}
                onValueChange={(value: typeof TIPO_VAGA_LABELS.BOLSISTA | typeof TIPO_VAGA_LABELS.VOLUNTARIO) =>
                  form.setValue("tipoVagaPretendida", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(selectedProjeto?.bolsasDisponibilizadas ?? 0) > 0 && (
                    <SelectItem value={TIPO_VAGA_LABELS.BOLSISTA}>
                      Bolsista ({selectedProjeto.bolsasDisponibilizadas} disponível
                      {selectedProjeto.bolsasDisponibilizadas !== 1 ? "is" : ""})
                    </SelectItem>
                  )}
                  {(selectedProjeto?.voluntariosSolicitados ?? 0) > 0 && (
                    <SelectItem value={TIPO_VAGA_LABELS.VOLUNTARIO}>
                      Voluntário ({selectedProjeto.voluntariosSolicitados} vaga
                      {selectedProjeto.voluntariosSolicitados !== 1 ? "s" : ""})
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {form.formState.errors.tipoVagaPretendida && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.tipoVagaPretendida.message}</p>
              )}
            </div>

            <div className="p-3 bg-muted rounded-lg text-sm">
              <p>
                <strong>Professor:</strong> {selectedProjeto?.professorResponsavelNome}
              </p>
              <p>
                <strong>Departamento:</strong> {selectedProjeto?.departamentoNome}
              </p>
              <p>
                <strong>Carga horária:</strong> {selectedProjeto?.cargaHorariaSemana}h/semana por{" "}
                {selectedProjeto?.numeroSemanas} semanas
              </p>
              <p>
                <strong>Período:</strong> {selectedProjeto?.ano}.
                {selectedProjeto?.semestre === "SEMESTRE_1" ? "1" : "2"}
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createInscricao.isPending}>
                {createInscricao.isPending ? "Inscrevendo..." : "Confirmar Inscrição"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
