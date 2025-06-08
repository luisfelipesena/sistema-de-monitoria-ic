import { PagesLayout } from '@/components/layout/PagesLayout';
import { TableComponent } from '@/components/layout/TableComponent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FilterModal, FilterValues } from '@/components/ui/FilterModal';
import { useProjetos } from '@/hooks/use-projeto';
import { useProgradExport } from '@/hooks/use-relatorios';
import { useUsers } from '@/hooks/use-user';
import { ProjetoListItem } from '@/routes/api/projeto/-types';
import { ApiUser } from '@/routes/api/user/-types';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ColumnDef } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Eye,
  FileSignature,
  Filter,
  FolderKanban,
  Hand,
  List,
  Loader,
  Mail,
  Pencil,
  User,
  Users,
} from 'lucide-react';

export const Route = createFileRoute('/home/_layout/admin/_layout/dashboard')({
  component: DashboardAdmin,
});

function DashboardAdmin() {
  const navigate = useNavigate();
  const { data: projetos, isLoading: loadingProjetos } = useProjetos();
  const { data: users, isLoading: loadingUsers } = useUsers();
  const downloadPlanilhaMutation = useProgradExport();

  const [abaAtiva, setAbaAtiva] = useState<
    'projetos' | 'professores' | 'alunos'
  >('projetos');
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({});
  const [groupedView, setGroupedView] = useState(false);

  const handleDownloadPlanilhaPrograd = () => {
    toast.promise(
      downloadPlanilhaMutation.mutateAsync(),
      {
        loading: 'Gerando planilha...',
        success: 'Planilha baixada com sucesso!',
        error: 'Erro ao gerar planilha',
      }
    );
  };

  // Filtrar professores e alunos dos usuários
  const professores = users?.filter((user) => user.role === 'professor') || [];
  const alunos = users?.filter((user) => user.role === 'student') || [];

  // Calcular contadores de status dos projetos
  const statusCounts = useMemo(() => {
    if (!projetos)
      return {
        draft: 0,
        submitted: 0,
        pendingAdminSignature: 0,
        approved: 0,
        rejected: 0,
      };

    return projetos.reduce(
      (acc, projeto) => {
        switch (projeto.status) {
          case 'DRAFT':
            acc.draft++;
            break;
          case 'SUBMITTED':
            acc.submitted++;
            break;
          case 'PENDING_ADMIN_SIGNATURE':
            acc.pendingAdminSignature++;
            break;
          case 'APPROVED':
            acc.approved++;
            break;
          case 'REJECTED':
            acc.rejected++;
            break;
        }
        return acc;
      },
      { draft: 0, submitted: 0, pendingAdminSignature: 0, approved: 0, rejected: 0 },
    );
  }, [projetos]);

  // Aplicar filtros aos projetos
  const projetosFiltrados = useMemo(() => {
    if (!projetos) return [];

    return projetos.filter((projeto) => {
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
  }, [projetos, filters]);

  // Agrupar projetos por departamento (se ativado)
  const projetosExibidos = useMemo(() => {
    if (!groupedView) return projetosFiltrados;

    const grouped = projetosFiltrados.reduce(
      (acc, projeto) => {
        const dept = projeto.departamentoNome;
        if (!acc[dept]) acc[dept] = [];
        acc[dept].push(projeto);
        return acc;
      },
      {} as Record<string, ProjetoListItem[]>,
    );

    return Object.values(grouped).flat();
  }, [projetosFiltrados, groupedView]);

  const handleApplyFilters = (newFilters: FilterValues) => {
    setFilters(newFilters);
  };

  const handleAnalisarProjeto = (projetoId: number) => {
    navigate({
      to: '/home/admin/project/$id',
      params: { id: projetoId.toString() },
    });
  };

  const handleEditarUsuario = (userId: number, tipo: 'professor' | 'aluno') => {
    if (tipo === 'professor') {
      navigate({ to: '/home/admin/professores' });
    } else {
      navigate({ to: '/home/admin/alunos' });
    }
  };

  const handleAdicionarUsuario = (tipo: 'professor' | 'aluno') => {
    if (tipo === 'professor') {
      navigate({ to: '/home/admin/professores' });
    } else {
      navigate({ to: '/home/admin/alunos' });
    }
  };

  // Column definitions for projects table
  const colunasProjetos: ColumnDef<ProjetoListItem>[] = [
    {
      header: () => (
        <div className="flex items-center gap-2">
          <List className="h-5 w-5 text-gray-400" />
          Componente curricular
        </div>
      ),
      accessorKey: 'titulo',
      cell: ({ row }) => {
        const disciplinas = row.original.disciplinas;
        const codigoDisciplina =
          disciplinas.length > 0 ? disciplinas[0].codigo : 'N/A';
        return (
          <div>
            <span className="font-semibold text-base text-gray-900">
              {codigoDisciplina}
            </span>
            {groupedView && (
              <div className="text-xs text-muted-foreground">
                {row.original.departamentoNome}
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <Loader className="h-5 w-5 text-gray-400" />
          Status
        </div>
      ),
      accessorKey: 'status',
      cell: ({ row }) => {
        const status = row.original.status;
        if (status === 'APPROVED') {
          return <Badge variant="success">Aprovado</Badge>;
        } else if (status === 'REJECTED') {
          return <Badge variant="destructive">Rejeitado</Badge>;
        } else if (status === 'SUBMITTED') {
          return <Badge variant="warning">Em análise</Badge>;
        } else if (status === 'DRAFT') {
          return <Badge variant="muted">Rascunho</Badge>;
        }
        return <Badge variant="muted">{status}</Badge>;
      },
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-gray-400" />
          Bolsistas
        </div>
      ),
      accessorKey: 'bolsasDisponibilizadas',
      cell: ({ row }) => {
        const bolsas = row.original.bolsasDisponibilizadas || 0;
        return <span>{bolsas}</span>;
      },
    },
    {
      header: () => (
        <div className="flex items-center justify-center gap-2">
          <Hand className="h-5 w-5 text-gray-400" />
          Voluntários
        </div>
      ),
      accessorKey: 'voluntariosSolicitados',
      cell: ({ row }) => (
        <div className="text-center">{row.original.voluntariosSolicitados}</div>
      ),
    },
    {
      header: () => (
        <div className="flex items-center justify-center gap-2">
          <Users className="h-5 w-5 text-gray-400" />
          Inscritos
        </div>
      ),
      accessorKey: 'totalInscritos',
      cell: ({ row }) => (
        <div className="text-center text-base">
          {row.original.totalInscritos}
        </div>
      ),
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-gray-400" />
          Ações
        </div>
      ),
      accessorKey: 'acoes',
      cell: ({ row }) => (
        <Button
          variant="primary"
          size="sm"
          className="rounded-full flex items-center gap-1"
          onClick={() => handleAnalisarProjeto(row.original.id)}
        >
          <Eye className="h-4 w-4" />
          Analisar
        </Button>
      ),
    },
  ];

  const colunasProfessores: ColumnDef<ApiUser>[] = [
    {
      header: () => (
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-gray-400" />
          Nome do Professor
        </div>
      ),
      accessorKey: 'username',
      cell: ({ row }) => (
        <span className="font-semibold text-base text-gray-900">
          {row.original.username}
        </span>
      ),
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-gray-400" />
          Email
        </div>
      ),
      accessorKey: 'email',
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-gray-400" />
          Ações
        </div>
      ),
      accessorKey: 'acoes',
      cell: ({ row }) => (
        <div className="flex gap-2 ml-auto w-full">
          <Button
            variant="secondary"
            size="sm"
            className="rounded-full flex items-center gap-1"
            onClick={() => handleEditarUsuario(row.original.id, 'professor')}
          >
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
        </div>
      ),
    },
  ];

  const colunasAlunos: ColumnDef<ApiUser>[] = [
    {
      header: () => (
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-gray-400" />
          Nome do Aluno
        </div>
      ),
      accessorKey: 'username',
      cell: ({ row }) => (
        <span className="font-semibold text-base text-gray-900">
          {row.original.username}
        </span>
      ),
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-gray-400" />
          Email
        </div>
      ),
      accessorKey: 'email',
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-gray-400" />
          Ações
        </div>
      ),
      accessorKey: 'acoes',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="rounded-full flex items-center gap-1"
            onClick={() => handleEditarUsuario(row.original.id, 'aluno')}
          >
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
        </div>
      ),
    },
  ];

  // Action buttons
  const dashboardActions = (
    <>
      {abaAtiva === 'projetos' && (
        <Button
          variant="outline"
          className="text-green-600 border-green-600 hover:bg-green-50"
          onClick={handleDownloadPlanilhaPrograd}
        >
          <Download className="w-4 h-4 mr-2" />
          Planilhas PROGRAD
        </Button>
      )}
      <Button
        variant={groupedView ? 'secondary' : 'primary'}
        className="bg-[#1B2A50] text-white hover:bg-[#24376c] transition-colors"
        onClick={() => {
          if (abaAtiva === 'projetos') {
            setGroupedView(!groupedView);
          } else if (abaAtiva === 'professores') {
            handleAdicionarUsuario('professor');
          } else if (abaAtiva === 'alunos') {
            handleAdicionarUsuario('aluno');
          }
        }}
      >
        {abaAtiva === 'projetos' ? (
          <>
            <FolderKanban className="w-4 h-4 mr-2" />
            {groupedView ? 'Visão Normal' : 'Agrupar por Departamento'}
          </>
        ) : abaAtiva === 'professores' ? (
          'Adicionar Professor'
        ) : (
          'Adicionar Aluno'
        )}
      </Button>
      <Button
        variant="outline"
        className="text-gray-600"
        onClick={() => setFilterModalOpen(true)}
      >
        <Filter className="w-4 h-4 mr-1" />
        Filtros
      </Button>
    </>
  );

  return (
    <PagesLayout title="Dashboard" actions={dashboardActions}>
      <div className="mb-6 flex gap-6 border-b border-gray-200">
        {[
          { id: 'projetos', label: 'Projetos' },
          { id: 'professores', label: 'Professores' },
          { id: 'alunos', label: 'Alunos' },
        ].map((aba) => (
          <button
            key={aba.id}
            onClick={() => setAbaAtiva(aba.id as any)}
            className={`py-2 px-1 text-base font-medium border-b-2 transition-colors ${
              abaAtiva === aba.id
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-black hover:border-gray-300'
            }`}
          >
            {aba.label}
          </button>
        ))}
      </div>

      {/* CONTEUDO DA ABA PROJETOS*/}
      {abaAtiva === 'projetos' && (
        <>
          {loadingProjetos ? (
            <div className="flex justify-center items-center py-8">
              <Loader className="h-8 w-8 animate-spin" />
              <span className="ml-2">Carregando projetos...</span>
            </div>
          ) : (
            <>
              {/* Cards de Resumo */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Rascunhos
                    </CardTitle>
                    <AlertTriangle className="h-4 w-4 text-gray-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-600">
                      {statusCounts.draft}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Aguardando assinatura admin
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Pend. Assinatura
                    </CardTitle>
                    <FileSignature className="h-4 w-4 text-purple-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {statusCounts.pendingAdminSignature}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Aguardando assinatura
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Em Análise
                    </CardTitle>
                    <Clock className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">
                      {statusCounts.submitted}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Para aprovação
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Aprovados
                    </CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {statusCounts.approved}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Projetos ativos
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Rejeitados
                    </CardTitle>
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {statusCounts.rejected}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Requer revisão
                    </p>
                  </CardContent>
                </Card>
              </div>

              {filters.status ||
              filters.departamento ||
              filters.semestre ||
              filters.ano ? (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-700">
                      Filtros ativos:{' '}
                      {Object.values(filters).filter(Boolean).length}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilters({})}
                    >
                      Limpar filtros
                    </Button>
                  </div>
                </div>
              ) : null}
              <TableComponent
                columns={colunasProjetos}
                data={projetosExibidos || []}
              />
            </>
          )}
        </>
      )}

      {/* ABA COM TABELA PROFESSORES*/}
      {abaAtiva === 'professores' && (
        <>
          {loadingUsers ? (
            <div className="flex justify-center items-center py-8">
              <Loader className="h-8 w-8 animate-spin" />
              <span className="ml-2">Carregando professores...</span>
            </div>
          ) : (
            <>
              {filters.status ||
              filters.departamento ||
              filters.semestre ||
              filters.ano ? (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-700">
                      Filtros ativos:{' '}
                      {Object.values(filters).filter(Boolean).length}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilters({})}
                    >
                      Limpar filtros
                    </Button>
                  </div>
                </div>
              ) : null}
              <TableComponent columns={colunasProfessores} data={professores} />
            </>
          )}
        </>
      )}

      {/* ABA COM TABELA ALUNOS*/}
      {abaAtiva === 'alunos' && (
        <>
          {loadingUsers ? (
            <div className="flex justify-center items-center py-8">
              <Loader className="h-8 w-8 animate-spin" />
              <span className="ml-2">Carregando alunos...</span>
            </div>
          ) : (
            <>
              {filters.status ||
              filters.departamento ||
              filters.semestre ||
              filters.ano ? (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-700">
                      Filtros ativos:{' '}
                      {Object.values(filters).filter(Boolean).length}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilters({})}
                    >
                      Limpar filtros
                    </Button>
                  </div>
                </div>
              ) : null}
              <TableComponent columns={colunasAlunos} data={alunos} />
            </>
          )}
        </>
      )}

      {/* Modal de Filtros */}
      <FilterModal
        open={filterModalOpen}
        onOpenChange={setFilterModalOpen}
        type="admin"
        onApplyFilters={handleApplyFilters}
        initialFilters={filters}
      />
    </PagesLayout>
  );
}

export default DashboardAdmin;
