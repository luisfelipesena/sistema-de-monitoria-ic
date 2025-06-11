'use client'

import { PagesLayout } from '@/components/layout/PagesLayout'
import { TableComponent } from '@/components/layout/TableComponent'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/utils/api'
import { ColumnDef } from '@tanstack/react-table'
import { BookOpen, Users, Award } from 'lucide-react'

type DisciplinaListItem = {
  id: number
  codigo: string
  nome: string
  cargaHoraria: number
  projetosAtivos: number
  monitoresAtivos: number
  voluntariosAtivos: number
}

export default function MinhasDisciplinasPage() {
  const { data: disciplinas, isLoading } = api.discipline.getProfessorDisciplines.useQuery()

  const columns: ColumnDef<DisciplinaListItem>[] = [
    {
      header: 'Disciplina',
      accessorKey: 'codigo',
      cell: ({ row }) => (
        <div>
          <span className="font-mono font-medium text-base">{row.original.codigo}</span>
          <div className="text-sm text-muted-foreground">{row.original.nome}</div>
        </div>
      ),
    },
    {
      header: 'Carga Horária',
      accessorKey: 'cargaHoraria',
      cell: ({ row }) => `${row.original.cargaHoraria}h`,
    },
    {
      header: 'Projetos Ativos',
      accessorKey: 'projetosAtivos',
      cell: ({ row }) => (
        <Badge variant="outline" className="bg-blue-50 text-blue-700">
          {row.original.projetosAtivos} projeto(s)
        </Badge>
      ),
    },
    {
      header: 'Monitores',
      accessorKey: 'monitoresAtivos',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4 text-green-600" />
          <span>{row.original.monitoresAtivos}</span>
        </div>
      ),
    },
    {
      header: 'Voluntários',
      accessorKey: 'voluntariosAtivos',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Award className="h-4 w-4 text-purple-600" />
          <span>{row.original.voluntariosAtivos}</span>
        </div>
      ),
    },
  ]

  return (
    <PagesLayout 
      title="Minhas Disciplinas" 
      subtitle="Disciplinas sob sua responsabilidade"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Disciplinas
            {disciplinas && (
              <Badge variant="outline" className="ml-2">
                {disciplinas.length} disciplina(s)
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <p className="mt-2">Carregando suas disciplinas...</p>
              </div>
            </div>
          ) : disciplinas && disciplinas.length > 0 ? (
            <TableComponent
              columns={columns}
              data={disciplinas}
              searchableColumn="codigo"
              searchPlaceholder="Buscar por código da disciplina..."
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="mx-auto h-12 w-12 mb-4" />
              <h3 className="text-lg font-medium mb-2">
                Nenhuma disciplina encontrada
              </h3>
              <p>
                Você não está associado a nenhuma disciplina no momento.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </PagesLayout>
  )
}