"use client"
import { PagesLayout } from '@/components/layout/PagesLayout';
import { TableComponent } from '@/components/layout/TableComponent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FilterModal, type FilterValues } from '@/components/ui/FilterModal';
import { api } from '@/utils/api';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
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


type ProjetoListItem = {
  id: number;
  titulo: string;
  status: string;
  departamentoId: number;
  departamentoNome: string;
  semestre: string;
  ano: number;
  bolsasDisponibilizadas: number | null;
  voluntariosSolicitados: number | null;
  totalInscritos: number;
  disciplinas: Array<{ codigo: string; nome: string; }>;
};

type ApiUser = {
  id: number;
  username: string;
  email: string;
  role: string;
};

export default function DashboardAdmin() {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const { data: projetos, isLoading: loadingProjetos } = api.projeto.getProjetos.useQuery();
  const { data: users, isLoading: loadingUsers } = api.user.getUsers.useQuery({});
  
  const [abaAtiva, setAbaAtiva] = useState<
    'projetos' | 'professores' | 'alunos'
  >('projetos');
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({});
  const [groupedView, setGroupedView] = useState(false);

  const handleDownloadPlanilhaPrograd = () => {
    toast.promise(
      Promise.resolve('Planilha download functionality would be implemented here'),
      {
        loading: 'Gerando planilha...',
        success: 'Planilha baixada com sucesso!',
        error: 'Erro ao gerar planilha',
      }
    );
  };



  const getProjetoPdfMutation = api.file.getProjetoPdfUrl.useMutation();

  const handleViewPdf = async (projetoId: number) => {
    try {
      const result = await getProjetoPdfMutation.mutateAsync({
        projetoId: projetoId,
      });

      const newWindow = window.open(result.url, '_blank', 'noopener,noreferrer');
      if (!newWindow) {
        toast.error('Popup bloqueado', {
          description: 'Permita popups para visualizar o PDF em nova aba.',
        });
        return;
      }
    
      toast.success('PDF aberto em nova aba');
    } catch (error) {
      toast.error('Erro ao abrir PDF', {
        description: 'Não foi possível abrir o documento para visualização.',
      });
      console.error('View PDF error:', error);
    }
  };

  // Use real data from APIs
  const actualProjetos = projetos || [];
  const actualUsers = users?.users || [];

  // Filtrar professores e alunos dos usuários
  const professores = actualUsers?.filter((user) => user.role === 'professor') || [];
  const alunos = actualUsers?.filter((user) => user.role === 'student') || [];

  // Calcular contadores de status dos projetos
  const statusCounts = useMemo(() => {
    if (!actualProjetos)
      return {
        draft: 0,
        submitted: 0,
        pendingAdminSignature: 0,
        approved: 0,
        rejected: 0,
      };

    return actualProjetos.reduce(
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
  }, [actualProjetos]);

  const handleApplyFilters = (newFilters: FilterValues) => {
    setFilters(newFilters);
  };

  const handleAnalisarProjeto = (projetoId: number) => {
    router.push(`/home/admin/manage-projects`);
  };

  const handleEditarUsuario = (userId: number, tipo: 'professor' | 'aluno') => {
    if (tipo === 'professor') {
      router.push('/home/admin/professores');
    } else {
      router.push('/home/admin/alunos');
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
          return <Badge variant="default" className="bg-green-500">Aprovado</Badge>;
        } else if (status === 'REJECTED') {
          return <Badge variant="destructive">Rejeitado</Badge>;
        } else if (status === 'SUBMITTED') {
          return <Badge variant="secondary" className="bg-yellow-500 text-white">Em análise</Badge>;
        } else if (status === 'DRAFT') {
          return <Badge variant="outline">Rascunho</Badge>;
        } else if (status === 'PENDING_ADMIN_SIGNATURE') {
          return <Badge variant="secondary" className="bg-purple-500 text-white">Pendente de assinatura</Badge>;
        }
        return <Badge variant="outline">{status}</Badge>;
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
        <div className="text-center">{row.original.voluntariosSolicitados || 0}</div>
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
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            className="rounded-full flex items-center gap-1"
            onClick={() => handleAnalisarProjeto(row.original.id)}
          >
            <Eye className="h-4 w-4" />
            Analisar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full flex items-center gap-1"
            onClick={() => handleViewPdf(row.original.id)}
            disabled={getProjetoPdfMutation.isPending}
          >
            <Download className="h-4 w-4" />
            Visualizar PDF
          </Button>
        </div>
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
      header: 'Ações',
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleEditarUsuario(row.original.id, 'professor')}
        >
          <Pencil className="h-4 w-4 mr-1" />
          Editar
        </Button>
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
      header: 'Ações',
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleEditarUsuario(row.original.id, 'aluno')}
        >
          <Pencil className="h-4 w-4 mr-1" />
          Editar
        </Button>
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
        onClick={() => {
          if (abaAtiva === 'projetos') {
            setGroupedView(!groupedView);
          } else if (abaAtiva === 'professores') {
            router.push('/home/admin/professores');
          } else if (abaAtiva === 'alunos') {
            router.push('/home/admin/alunos');
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

              <TableComponent
                columns={colunasProjetos}
                data={actualProjetos || []}
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
            <TableComponent columns={colunasProfessores} data={professores} />
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
            <TableComponent columns={colunasAlunos} data={alunos} />
          )}
        </>
      )}

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
