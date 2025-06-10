"use client"

import { PagesLayout } from "@/components/layout/PagesLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { api } from "@/utils/api"
import { Edit, Eye, FileText, Plus, Search, Users } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

const statusColors = {
  DRAFT: "bg-gray-100 text-gray-800",
  SUBMITTED: "bg-blue-100 text-blue-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  PENDING_ADMIN_SIGNATURE: "bg-yellow-100 text-yellow-800",
  PENDING_PROFESSOR_SIGNATURE: "bg-orange-100 text-orange-800",
}

const statusLabels = {
  DRAFT: "Rascunho",
  SUBMITTED: "Submetido",
  APPROVED: "Aprovado",
  REJECTED: "Rejeitado",
  PENDING_ADMIN_SIGNATURE: "Aguardando Assinatura Admin",
  PENDING_PROFESSOR_SIGNATURE: "Aguardando Assinatura Professor",
}

export default function ProfessorProjectsPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const { data: projects, isLoading } = api.professor.getProjects.useQuery({
    professorId: 1,
  })

  const filteredProjects = projects
    ? projects.filter((project) => !searchTerm || project.titulo.toLowerCase().includes(searchTerm.toLowerCase()))
    : []

  const stats = {
    totalProjects: projects?.length || 0,
    approvedProjects: projects?.filter((p) => p.status === "APPROVED").length || 0,
    totalBolsasSolicitadas: projects?.reduce((sum, p) => sum + p.bolsasSolicitadas, 0) || 0,
    totalInscricoes: 0,
  }

  return (
    <PagesLayout
      title="Meus Projetos"
      subtitle="Gerencie seus projetos de monitoria"
      actions={
        <Link href="/dashboard/professor/projetos/novo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Projeto
          </Button>
        </Link>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Projetos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projetos Aprovados</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvedProjects}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bolsas Solicitadas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBolsasSolicitadas}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inscrições Recebidas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInscricoes}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buscar Projetos</CardTitle>
          <CardDescription>Pesquise seus projetos por título</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum projeto encontrado</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm ? "Nenhum projeto corresponde à busca." : "Você ainda não criou nenhum projeto."}
            </p>
            <Link href="/dashboard/professor/projetos/novo">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Projeto
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">{project.titulo}</CardTitle>
                    <CardDescription className="mt-1">
                      {project.ano}/{project.semestre === "SEMESTRE_1" ? "1" : "2"}
                    </CardDescription>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      statusColors[project.status as keyof typeof statusColors]
                    }`}
                  >
                    {statusLabels[project.status as keyof typeof statusLabels]}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{project.descricao}</p>

                <div className="flex justify-between items-center text-sm text-muted-foreground mb-4">
                  <span>Bolsas: {project.bolsasSolicitadas}</span>
                  <span>Voluntários: {project.voluntariosSolicitados}</span>
                </div>

                <div className="text-sm text-muted-foreground mb-4">
                  <span>Departamento: {project.departamento.nome}</span>
                </div>

                <div className="flex gap-2">
                  <Link href={`/dashboard/professor/projetos/${project.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="mr-2 h-4 w-4" />
                      Visualizar
                    </Button>
                  </Link>

                  {project.status === "DRAFT" && (
                    <Link href={`/dashboard/professor/projetos/${project.id}/editar`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PagesLayout>
  )
}
