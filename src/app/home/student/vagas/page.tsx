"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { getSemestreNumero, PROJETO_STATUS_APPROVED, TIPO_VAGA_LABELS, type Semestre } from "@/types"
import { api } from "@/utils/api"
import { Award, BookOpen, Calendar, Clock, MapPin, Search, User, Users } from "lucide-react"
import { useState } from "react"

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

export default function VagasPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDepartamento, setSelectedDepartamento] = useState<string>("")
  const [tipoVagaFilter, setTipoVagaFilter] = useState<string>("")

  const { data: projetos = [], isLoading: isLoadingProjetos } = api.projeto.getProjetos.useQuery()
  const { data: departamentos = [] } = api.departamento.getDepartamentos.useQuery({})
  const { data: activePeriodData, isLoading: isLoadingPeriod } = api.edital.getActivePeriod.useQuery()

  const isLoading = isLoadingProjetos || isLoadingPeriod

  // Check if there's an active enrollment period
  const hasActivePeriod = activePeriodData?.periodo !== null
  const activePeriod = activePeriodData?.periodo

  // Filter projects - only show APPROVED projects
  const filteredProjetos = projetos.filter((projeto) => {
    if (projeto.status !== PROJETO_STATUS_APPROVED) return false

    const matchesSearch =
      projeto.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      projeto.professorResponsavelNome.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesDepartamento =
      !selectedDepartamento ||
      selectedDepartamento === "all" ||
      projeto.departamentoId.toString() === selectedDepartamento

    const matchesTipoVaga =
      !tipoVagaFilter ||
      tipoVagaFilter === "all" ||
      (tipoVagaFilter === TIPO_VAGA_LABELS.BOLSISTA && (projeto.bolsasDisponibilizadas ?? 0) > 0) ||
      (tipoVagaFilter === TIPO_VAGA_LABELS.VOLUNTARIO && (projeto.voluntariosSolicitados ?? 0) > 0)

    return matchesSearch && matchesDepartamento && matchesTipoVaga
  })

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Vagas Disponíveis</h1>
          <p className="text-muted-foreground">Explore vagas de monitoria e voluntariado disponíveis.</p>
        </div>
        <LoadingSkeleton />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Vagas Disponíveis</h1>
        <p className="text-muted-foreground">
          Explore vagas de monitoria e voluntariado disponíveis nos projetos aprovados.
        </p>

        {/* Period Status */}
        {!hasActivePeriod && (
          <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-orange-800 font-medium">Período de inscrições encerrado</p>
                <p className="text-orange-700 text-sm">Não há período ativo para inscrições em monitoria no momento.</p>
              </div>
            </div>
          </div>
        )}

        {hasActivePeriod && activePeriod && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-green-800 font-medium">Período de inscrições ativo</p>
                <p className="text-green-700 text-sm">
                  Inscrições abertas até {new Date(activePeriod.dataFim).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters and Stats*/}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
                  <SelectItem value="all">Todos os departamentos</SelectItem>
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
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value={TIPO_VAGA_LABELS.BOLSISTA}>{TIPO_VAGA_LABELS.BOLSISTA}</SelectItem>
                  <SelectItem value={TIPO_VAGA_LABELS.VOLUNTARIO}>{TIPO_VAGA_LABELS.VOLUNTARIO}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Award className="h-6 w-6 text-yellow-500 flex-shrink-0" />
                  <div>
                    <div className="text-xl font-bold">
                      {filteredProjetos.reduce((sum, p) => sum + (p.bolsasDisponibilizadas ?? 0), 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">Bolsas Disponíveis</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-6 w-6 text-blue-500 flex-shrink-0" />
                  <div>
                    <div className="text-xl font-bold">
                      {filteredProjetos.reduce((sum, p) => sum + (p.voluntariosSolicitados ?? 0), 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">Vagas Voluntárias</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-green-500 flex-shrink-0" />
                  <div>
                    <div className="text-xl font-bold">{filteredProjetos.length}</div>
                    <p className="text-xs text-muted-foreground">Projetos Disponíveis</p>
                  </div>
                </div>
              </CardContent>
            </Card>
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
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {projeto.professorResponsavelNome}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {projeto.departamentoNome}
                      </div>
                    </div>
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
                      {projeto.ano}.{getSemestreNumero(projeto.semestre as Semestre)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{projeto.cargaHorariaSemana}h/semana</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-yellow-600" />
                    <span>{projeto.bolsasDisponibilizadas || 0} bolsas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
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

                {/* Info Notice */}
                <div
                  className={`border rounded-lg p-3 ${
                    hasActivePeriod ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <p className={`text-sm ${hasActivePeriod ? "text-blue-700" : "text-gray-600"}`}>
                    {hasActivePeriod ? (
                      <>
                        Para se inscrever neste projeto, visite a página de{" "}
                        <a href="/home/student/inscricao-monitoria" className="underline font-medium">
                          Inscrição em Monitoria
                        </a>
                        .
                      </>
                    ) : (
                      <>
                        As inscrições para este projeto estão fechadas no momento. Aguarde a abertura do próximo período
                        de inscrições.
                      </>
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
