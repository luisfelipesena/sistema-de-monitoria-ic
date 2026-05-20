"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { TIPO_VAGA_LABELS, getSemestreNumero } from "@/types"
import { api } from "@/utils/api"
import { Award, BookOpen, Calendar, Clock, FileText, MapPin, Search, User, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 6 }, (_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-64" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function InscricaoMonitoria() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDepartamento, setSelectedDepartamento] = useState<string>("")
  const [tipoVagaFilter, setTipoVagaFilter] = useState<string>("")

  const { data: projetos = [], isLoading: isLoadingProjetos } = api.projeto.getAvailableProjects.useQuery()
  const { data: departamentos = [] } = api.departamento.getDepartamentos.useQuery({})
  const { data: activePeriodData, isLoading: isLoadingPeriod } = api.edital.getActivePeriod.useQuery()

  const isLoading = isLoadingProjetos || isLoadingPeriod
  const hasActivePeriod = activePeriodData?.periodo !== null
  const activePeriod = activePeriodData?.periodo

  const filteredProjetos = projetos.filter((projeto) => {
    if (!hasActivePeriod) return false
    const matchesSearch =
      projeto.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      projeto.professorResponsavelNome.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartamento =
      !selectedDepartamento || selectedDepartamento === "all" || projeto.departamentoNome === selectedDepartamento
    const matchesTipoVaga =
      !tipoVagaFilter ||
      tipoVagaFilter === "all" ||
      (tipoVagaFilter === TIPO_VAGA_LABELS.BOLSISTA && (projeto.bolsasDisponibilizadas ?? 0) > 0) ||
      (tipoVagaFilter === TIPO_VAGA_LABELS.VOLUNTARIO && (projeto.voluntariosSolicitados ?? 0) > 0)
    return matchesSearch && matchesDepartamento && matchesTipoVaga
  })

  const openWizard = (projetoId: number) => {
    router.push(`/home/student/inscricao-monitoria/${projetoId}/wizard`)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Inscrição em Projeto de Monitoria</h1>
          <p className="text-muted-foreground">Encontre e inscreva-se em projetos de monitoria disponíveis.</p>
        </div>
        <LoadingSkeleton />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Inscrição em Projeto de Monitoria</h1>
        <p className="text-muted-foreground">Encontre e inscreva-se em projetos de monitoria disponíveis.</p>
        {activePeriod ? (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-green-800">Período de Inscrições Ativo</h3>
                <p className="text-sm text-green-700 mt-1">
                  {activePeriod.ano}.{getSemestreNumero(activePeriod.semestre)} • Até{" "}
                  {activePeriod.dataFim.toLocaleDateString("pt-BR")} • {activePeriod.totalProjetos} projetos disponíveis
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-800">Período de Inscrições Fechado</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Não há período de inscrições ativo no momento. Aguarde a publicação do próximo edital.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

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
                  <SelectItem value="all">Todos os departamentos</SelectItem>
                  {departamentos.map((dept: { id: number; nome: string }) => (
                    <SelectItem key={dept.id} value={dept.nome}>
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
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Projetos de Monitoria</h2>
        <p className="text-sm text-muted-foreground">
          {filteredProjetos.length} projeto{filteredProjetos.length !== 1 ? "s" : ""} encontrado
          {filteredProjetos.length !== 1 ? "s" : ""}
        </p>
      </div>

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
                    <CardDescription>
                      <span className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {projeto.professorResponsavelNome}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {projeto.departamentoNome}
                        </span>
                      </span>
                    </CardDescription>
                  </div>
                  <Badge variant="default">Ativo</Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-3">{projeto.descricao}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {projeto.ano}.{getSemestreNumero(projeto.semestre)}
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

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => openWizard(projeto.id)}
                    disabled={
                      (projeto.bolsasDisponibilizadas ?? 0) === 0 && (projeto.voluntariosSolicitados ?? 0) === 0
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
    </div>
  )
}
