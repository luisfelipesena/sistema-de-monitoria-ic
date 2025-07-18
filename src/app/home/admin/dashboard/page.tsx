"use client";
import { PagesLayout } from "@/components/layout/PagesLayout";
import { TableComponent } from "@/components/layout/TableComponent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterModal, type FilterValues } from "@/components/ui/FilterModal";
import {
  DashboardProjectItem,
  MonitorConsolidado,
  UserListItem,
} from "@/types";
import { api } from "@/utils/api";
import { getCurrentSemester } from "@/utils/utils";
import { useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
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
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export default function DashboardAdmin() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: projetos, isLoading: loadingProjetos } =
    api.projeto.getProjetos.useQuery();
  const { data: users, isLoading: loadingUsers } = api.user.getUsers.useQuery(
    {}
  );

  const [abaAtiva, setAbaAtiva] = useState<
    "projetos" | "professores" | "alunos"
  >("projetos");
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({});
  const [groupedView, setGroupedView] = useState(false);
  const [loadingPdfProjetoId, setLoadingPdfProjetoId] = useState<number | null>(null);

  const activeFilters = Object.values(filters).filter(
    (v) => v !== undefined && v !== ""
  ).length;

  const { refetch: generateProgradSpreadsheet } =
    api.relatorios.getConsolidatedMonitoringData.useQuery(
      {
        ano: new Date().getFullYear(),
        semestre: getCurrentSemester().semester,
      },
      { enabled: false }
    );

  const handleDownloadPlanilhaPrograd = async () => {
    try {
      toast.promise(
        (async () => {
          const {
            data: result,
            isError,
            error,
          } = await generateProgradSpreadsheet();

          if (isError || !result) {
            throw new Error(error?.message || "Erro ao buscar dados");
          }

          if (result.length === 0) {
            throw new Error("Não há dados para gerar a planilha");
          }

          const csvHeader = [
            "Matrícula Monitor",
            "Nome Monitor",
            "Email Monitor",
            "CR",
            "Tipo Monitoria",
            "Valor Bolsa",
            "Projeto",
            "Disciplinas",
            "Professor Responsável",
            "SIAPE Professor",
            "Departamento",
            "Carga Horária Semanal",
            "Total Horas",
            "Data Início",
            "Data Fim",
            "Status",
            "Período",
          ];

          const csvData = result.map((item: MonitorConsolidado) => [
            item.monitor.matricula,
            item.monitor.nome,
            item.monitor.email,
            item.monitor.cr.toFixed(2),
            item.monitoria.tipo === "BOLSISTA" ? "Bolsista" : "Voluntário",
            item.monitoria.valorBolsa
              ? `R$ ${item.monitoria.valorBolsa.toFixed(2)}`
              : "N/A",
            item.projeto.titulo,
            item.projeto.disciplinas,
            item.professor.nome,
            item.professor.matriculaSiape || "N/A",
            item.professor.departamento,
            item.projeto.cargaHorariaSemana,
            item.projeto.cargaHorariaSemana * item.projeto.numeroSemanas,
            item.monitoria.dataInicio,
            item.monitoria.dataFim,
            item.monitoria.status,
            `${item.projeto.ano}.${
              item.projeto.semestre === "SEMESTRE_1" ? "1" : "2"
            }`,
          ]);

          const csvContent = [csvHeader, ...csvData]
            .map((row) =>
              row.map((cell: string | number) => `"${cell}"`).join(",")
            )
            .join("\n");

          const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;",
          });
          const link = document.createElement("a");
          const url = URL.createObjectURL(blob);
          link.setAttribute("href", url);
          link.setAttribute(
            "download",
            `planilha-prograd-${new Date().getFullYear()}-1.csv`
          );
          link.style.visibility = "hidden";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        })(),
        {
          loading: "Gerando planilha PROGRAD...",
          success: "Planilha PROGRAD baixada com sucesso!",
          error: (err) => `Erro ao gerar planilha: ${err.message}`,
        }
      );
    } catch (error) {
      console.error("Erro ao gerar planilha PROGRAD:", error);
    }
  };

  const handleGenerateEditalInterno = () => {
    router.push("/home/admin/edital-management");
  };

  const handleManageProjectsClick = () => {
    router.push("/home/admin/manage-projects");
  };

  const getProjetoPdfMutation = api.file.getProjetoPdfUrl.useMutation();

  const handleViewPdf = async (projetoId: number) => {
    setLoadingPdfProjetoId(projetoId);
    try {
      const result = await getProjetoPdfMutation.mutateAsync({
        projetoId: projetoId,
      });

      const newWindow = window.open(
        result.url,
        "_blank",
        "noopener,noreferrer"
      );
      if (!newWindow) {
        toast.error("Popup bloqueado", {
          description: "Permita popups para visualizar o PDF em nova aba.",
        });
        return;
      }

      toast.success("PDF aberto em nova aba");
    } catch (error) {
      toast.error("Erro ao abrir PDF", {
        description: "Não foi possível abrir o documento para visualização.",
      });
      console.error("View PDF error:", error);
    } finally {
      setLoadingPdfProjetoId(null);
    }
  };

  // Use real data from APIs and map to ensure type compatibility
  const actualProjetos = (projetos || []).map((projeto) => ({
    ...projeto,
    bolsasDisponibilizadas: projeto.bolsasDisponibilizadas ?? null,
  })) as DashboardProjectItem[];
  const actualUsers = users?.users || [];

  // Filtrar professores e alunos dos usuários
  const professores =
    actualUsers?.filter((user) => user.role === "professor") || [];
  const alunos = actualUsers?.filter((user) => user.role === "student") || [];

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
          case "DRAFT":
            acc.draft++;
            break;
          case "SUBMITTED":
            acc.submitted++;
            break;
          case "PENDING_ADMIN_SIGNATURE":
            acc.pendingAdminSignature++;
            break;
          case "APPROVED":
            acc.approved++;
            break;
          case "REJECTED":
            acc.rejected++;
            break;
        }
        return acc;
      },
      {
        draft: 0,
        submitted: 0,
        pendingAdminSignature: 0,
        approved: 0,
        rejected: 0,
      }
    );
  }, [actualProjetos]);

  const handleApplyFilters = (newFilters: FilterValues) => {
    setFilters(newFilters);
  };

  const handleAnalisarProjeto = (projetoId: number) => {
    router.push(`/home/admin/manage-projects?projeto=${projetoId}`);
  };

  const handleEditarUsuario = (userId: number, tipo: "professor" | "aluno") => {
    if (tipo === "professor") {
      router.push("/home/admin/professores");
    } else {
      router.push("/home/admin/alunos");
    }
  };

  // Column definitions for projects table
  const colunasProjetos: ColumnDef<DashboardProjectItem>[] = [
    {
      header: () => (
        <div className="flex items-center gap-2">
          <List className="h-5 w-5 text-gray-400" />
          Componente curricular
        </div>
      ),
      accessorKey: "titulo",
      cell: ({ row }) => {
        const disciplinas = row.original.disciplinas;
        const codigoDisciplina =
          disciplinas.length > 0 ? disciplinas[0].codigo : "N/A";
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
      accessorKey: "status",
      cell: ({ row }) => {
        const status = row.original.status;
        if (status === "APPROVED") {
          return (
            <Badge variant="default" className="bg-green-500">
              Aprovado
            </Badge>
          );
        } else if (status === "REJECTED") {
          return <Badge variant="destructive">Rejeitado</Badge>;
        } else if (status === "SUBMITTED") {
          return (
            <Badge variant="secondary" className="bg-yellow-500 text-white">
              Em análise
            </Badge>
          );
        } else if (status === "DRAFT") {
          return <Badge variant="outline">Rascunho</Badge>;
        } else if (status === "PENDING_ADMIN_SIGNATURE") {
          return (
            <Badge variant="secondary" className="bg-purple-500 text-white">
              Pendente de assinatura
            </Badge>
          );
        }
        return <Badge variant="outline">{status}</Badge>;
      },
    },
    {
      header: () => (
        <div className="flex items-center justify-center gap-2">
          <Hand className="h-5 w-5 text-gray-400" />
          Voluntários
        </div>
      ),
      accessorKey: "voluntariosSolicitados",
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.voluntariosSolicitados || 0}
        </div>
      ),
    },
    {
      header: () => (
        <div className="flex items-center justify-center gap-2">
          <Users className="h-5 w-5 text-gray-400" />
          Inscritos
        </div>
      ),
      accessorKey: "totalInscritos",
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
      accessorKey: "acoes",
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
            disabled={loadingPdfProjetoId === row.original.id}
          >
            <Download className="h-4 w-4" />
            {loadingPdfProjetoId === row.original.id ? 'Carregando...' : 'Visualizar PDF'}
          </Button>
        </div>
      ),
    },
  ];

  const colunasProfessores: ColumnDef<UserListItem>[] = [
    {
      header: () => (
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-gray-400" />
          Nome do Professor
        </div>
      ),
      accessorKey: "username",
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-gray-400" />
          Email
        </div>
      ),
      accessorKey: "email",
    },
    {
      header: "Ações",
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleEditarUsuario(row.original.id, "professor")}
        >
          <Pencil className="h-4 w-4 mr-1" />
          Editar
        </Button>
      ),
    },
  ];

  const colunasAlunos: ColumnDef<UserListItem>[] = [
    {
      header: () => (
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-gray-400" />
          Nome do Aluno
        </div>
      ),
      accessorKey: "username",
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-gray-400" />
          Email
        </div>
      ),
      accessorKey: "email",
    },
    {
      header: "Ações",
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleEditarUsuario(row.original.id, "aluno")}
        >
          <Pencil className="h-4 w-4 mr-1" />
          Editar
        </Button>
      ),
    },
  ];

  // Action buttons
  const dashboardActions = (
    <div className="flex flex-wrap gap-2 sm:gap-3">
      {abaAtiva === "projetos" && (
        <>
          <Button
            variant="outline"
            size="sm"
            className="text-purple-600 border-purple-600 hover:bg-purple-50 text-xs sm:text-sm px-2 sm:px-4"
            onClick={handleGenerateEditalInterno}
          >
            <FileSignature className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Editais Internos</span>
            <span className="sm:hidden">Editais</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-green-600 border-green-600 hover:bg-green-50 text-xs sm:text-sm px-2 sm:px-4 disabled:text-gray-700 disabled:bg-gray-300"
            onClick={() => handleDownloadPlanilhaPrograd()}
            disabled={!actualProjetos || actualProjetos.length === 0}
          >
            <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Planilha PROGRAD</span>
            <span className="sm:hidden">PROGRAD</span>
          </Button>
        </>
      )}
      {abaAtiva === "professores" && (
        <Button
          variant="primary"
          size="sm"
          onClick={() => router.push("/home/admin/professores")}
          className="text-xs sm:text-sm px-2 sm:px-4"
        >
          <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Gerenciar Professores</span>
          <span className="sm:hidden">Gerenciar</span>
        </Button>
      )}
      {abaAtiva === "alunos" && (
        <Button
          variant="primary"
          size="sm"
          onClick={() => router.push("/home/admin/alunos")}
          className="text-xs sm:text-sm px-2 sm:px-4"
        >
          <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Gerenciar Alunos</span>
          <span className="sm:hidden">Gerenciar</span>
        </Button>
      )}
      <Button
        variant={groupedView ? "secondary" : "outline"}
        size="sm"
        className="text-xs sm:text-sm px-2 sm:px-4"
        onClick={() => {
          if (abaAtiva === "projetos") {
            setGroupedView(!groupedView);
          }
        }}
      >
        <FolderKanban className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
        <span className="hidden sm:inline">
          {groupedView ? "Visão Normal" : "Agrupar por Departamento"}
        </span>
        <span className="sm:hidden">{groupedView ? "Normal" : "Agrupar"}</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setFilterModalOpen(true)}
        className="relative text-xs sm:text-sm px-2 sm:px-4"
      >
        <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
        Filtros
        {activeFilters > 0 && (
          <span className="absolute -top-1 -right-1 bg-blue-600 text-white sm:text-xs rounded-full px-1.5 sm:px-2 py-0.5">
            {activeFilters}
          </span>
        )}
      </Button>
    </div>
  );

  return (
    <PagesLayout title="Dashboard" actions={dashboardActions}>
      <div className="mb-4 sm:mb-6 flex gap-3 sm:gap-6 border-b border-gray-200 overflow-x-auto">
        {[
          { id: "projetos", label: "Projetos" },
          { id: "professores", label: "Professores" },
          { id: "alunos", label: "Alunos" },
        ].map((aba) => (
          <button
            key={aba.id}
            onClick={() =>
              setAbaAtiva(aba.id as "projetos" | "professores" | "alunos")
            }
            className={`py-2 px-1 text-sm sm:text-base font-medium border-b-2 transition-colors whitespace-nowrap ${
              abaAtiva === aba.id
                ? "border-black text-black"
                : "border-transparent text-gray-500 hover:text-black hover:border-gray-300"
            }`}
          >
            {aba.label}
          </button>
        ))}
      </div>

      {/* CONTEUDO DA ABA PROJETOS*/}
      {abaAtiva === "projetos" && (
        <>
          {loadingProjetos ? (
            <div className="flex justify-center items-center py-8">
              <Loader className="h-8 w-8 animate-spin" />
              <span className="ml-2">Carregando projetos...</span>
            </div>
          ) : (
            <>
              {/* Cards de Resumo */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium">
                      Rascunhos
                    </CardTitle>
                    <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg sm:text-2xl font-bold text-gray-600">
                      {statusCounts.draft}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Projetos em edição
                    </p>
                  </CardContent>
                </Card>

                <Link href="/home/admin/assinatura-documentos">
                  <Card className="hover:bg-gray-100 transition-colors cursor-pointer">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xs sm:text-sm font-medium">
                        Pend. Assinatura
                      </CardTitle>
                      <FileSignature className="h-3 w-3 sm:h-4 sm:w-4 text-[hsl(var(--pending))]" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg sm:text-2xl font-bold text-[hsl(var(--pending))]">
                        {statusCounts.pendingAdminSignature}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Aguardando assinatura admin
                      </p>
                    </CardContent>
                  </Card>
                </Link>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium">
                      Em Análise
                    </CardTitle>
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg sm:text-2xl font-bold text-yellow-600">
                      {statusCounts.submitted}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Para aprovação admin
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium">
                      Aprovados
                    </CardTitle>
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg sm:text-2xl font-bold text-green-600">
                      {statusCounts.approved}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Prontos para edital interno
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium">
                      Rejeitados
                    </CardTitle>
                    <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg sm:text-2xl font-bold text-red-600">
                      {statusCounts.rejected}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Necessitam revisão
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
      {abaAtiva === "professores" && (
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
      {abaAtiva === "alunos" && (
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
