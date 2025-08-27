"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { TIPO_VAGA_LABELS } from "@/types/enums"
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

  const { data: projetos = [], isLoading } = api.projeto.getProjetos.useQuery()
  const { data: departamentos = [] } = api.departamento.getDepartamentos.useQuery({})

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

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Award className="h-8 w-8 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">
                  {filteredProjetos.reduce((sum, p) => sum + (p.bolsasDisponibilizadas ?? 0), 0)}
                </div>
                <p className="text-sm text-muted-foreground">Bolsas Disponíveis</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">
                  {filteredProjetos.reduce((sum, p) => sum + (p.voluntariosSolicitados ?? 0), 0)}
                </div>
                <p className="text-sm text-muted-foreground">Vagas Voluntárias</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{filteredProjetos.length}</div>
                <p className="text-sm text-muted-foreground">Projetos Disponíveis</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
                      {projeto.ano}.{projeto.semestre === "SEMESTRE_1" ? "1" : "2"}
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
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    Para se inscrever neste projeto, visite a página de{" "}
                    <a href="/home/student/inscricao-monitoria" className="underline font-medium">
                      Inscrição em Monitoria
                    </a>
                    .
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
