'use client';

import { PagesLayout } from '@/components/layout/PagesLayout';
import { TableComponent } from '@/components/layout/TableComponent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FilterModal, FilterValues } from '@/components/ui/FilterModal';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { useProjetos } from '@/hooks/use-projeto';
import { ProjetoListItem } from '@/routes/api/projeto/-types';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ColumnDef } from '@tanstack/react-table';
import { Eye, Filter, Plus, Users } from 'lucide-react';
import { useMemo, useState } from 'react';

export const Route = createFileRoute(
  '/home/_layout/admin/_layout/manage-projects',
)({
  component: ManageProjectsPage,
});

function ManageProjectsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: projetos, isLoading: loadingProjetos } = useProjetos();

  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({});
  const [searchTerm, setSearchTerm] = useState('');

  const projetosFiltrados = useMemo(() => {
    if (!projetos) return [];

    return projetos.filter((projeto) => {
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (
          !projeto.titulo.toLowerCase().includes(search) &&
          !projeto.professorResponsavelNome.toLowerCase().includes(search) &&
          !projeto.departamentoNome.toLowerCase().includes(search)
        ) {
          return false;
        }
      }

      if (filters.status && projeto.status !== filters.status) return false;
      if (
        filters.departamento &&
        projeto.departamentoId.toString() !== filters.departamento
      )
        return false;
      if (filters.semestre && projeto.semestre !== filters.semestre)
        return false;
      if (filters.ano && projeto.ano.toString() !== filters.ano) return false;
      return true;
    });
  }, [projetos, filters, searchTerm]);

  const handleViewProject = (id: number) => {
    navigate({
      to: '/home/admin/project/$id',
      params: { id: id.toString() },
    });
  };

  const columns: ColumnDef<ProjetoListItem>[] = [
    {
      header: 'Projeto',
      accessorKey: 'titulo',
      cell: ({ row }) => (
        <div>
          <span className="font-medium">{row.original.titulo}</span>
          <div className="text-sm text-gray-500">
            ID: #{row.original.id} • {row.original.departamentoNome}
          </div>
        </div>
      ),
    },
    {
      header: 'Professor',
      accessorKey: 'professorResponsavelNome',
      cell: ({ row }) => (
        <div>
          <span className="font-medium">
            {row.original.professorResponsavelNome}
          </span>
        </div>
      ),
    },
    {
      header: 'Semestre',
      accessorKey: 'semestre',
      cell: ({ row }) => (
        <span>
          {row.original.ano}.{row.original.semestre === 'SEMESTRE_1' ? 1 : 2}
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => {
        const status = row.original.status;
        const statusMap = {
          DRAFT: { label: 'Rascunho', variant: 'secondary' as const },
          PENDING_PROFESSOR_SIGNATURE: {
            label: 'Pend. Professor',
            variant: 'warning' as const,
          },
          SUBMITTED: { label: 'Em Análise', variant: 'muted' as const },
          APPROVED: { label: 'Aprovado', variant: 'success' as const },
          REJECTED: { label: 'Rejeitado', variant: 'destructive' as const },
        };
        const config = statusMap[status as keyof typeof statusMap] || {
          label: status,
          variant: 'secondary' as const,
        };
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      header: 'Bolsas',
      accessorKey: 'bolsasDisponibilizadas',
      cell: ({ row }) => (
        <div className="text-center">
          <span className="font-medium">
            {row.original.bolsasDisponibilizadas || 0}
          </span>
          <div className="text-xs text-gray-500">
            {row.original.bolsasSolicitadas} solicitadas
          </div>
        </div>
      ),
    },
    {
      header: 'Voluntários',
      accessorKey: 'voluntariosSolicitados',
      cell: ({ row }) => (
        <div className="text-center">{row.original.voluntariosSolicitados}</div>
      ),
    },
    {
      header: 'Ações',
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewProject(row.original.id)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (user?.role !== 'admin') {
    return (
      <PagesLayout title="Acesso Negado">
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Apenas administradores podem acessar esta página.
          </p>
        </div>
      </PagesLayout>
    );
  }

  const pageActions = (
    <>
      <Button
        variant="outline"
        onClick={() => setFilterModalOpen(true)}
        className="text-gray-600"
      >
        <Filter className="w-4 h-4 mr-2" />
        Filtros
      </Button>
      <Button
        className="bg-[#1B2A50] text-white hover:bg-[#24376c]"
        onClick={() => navigate({ to: '/home/admin/projects' })}
      >
        <Plus className="w-4 h-4 mr-2" />
        Novo Projeto
      </Button>
    </>
  );

  return (
    <PagesLayout
      title="Gerenciar Projetos"
      subtitle="Administração completa de projetos de monitoria"
      actions={pageActions}
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por título, professor ou departamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">
                {projetos?.length || 0}
              </div>
              <p className="text-sm text-muted-foreground">Total de Projetos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {projetos?.filter((p) => p.status === 'APPROVED').length || 0}
              </div>
              <p className="text-sm text-muted-foreground">Aprovados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">
                {projetos?.filter((p) => p.status === 'SUBMITTED').length || 0}
              </div>
              <p className="text-sm text-muted-foreground">Em Análise</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">
                {projetos?.filter((p) => p.status === 'REJECTED').length || 0}
              </div>
              <p className="text-sm text-muted-foreground">Rejeitados</p>
            </CardContent>
          </Card>
        </div>

        {Object.values(filters).some(Boolean) && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">
                Filtros ativos: {Object.values(filters).filter(Boolean).length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({})}
                className="text-blue-600 border-blue-300"
              >
                Limpar filtros
              </Button>
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Projetos de Monitoria ({projetosFiltrados.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingProjetos ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  <p className="mt-2">Carregando projetos...</p>
                </div>
              </div>
            ) : (
              <TableComponent columns={columns} data={projetosFiltrados} />
            )}
          </CardContent>
        </Card>
      </div>

      <FilterModal
        open={filterModalOpen}
        onOpenChange={setFilterModalOpen}
        type="admin"
        onApplyFilters={setFilters}
        initialFilters={filters}
      />
    </PagesLayout>
  );
}
