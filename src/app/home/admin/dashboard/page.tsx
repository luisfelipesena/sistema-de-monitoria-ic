"use client"
import { AlunosTable } from "@/components/features/admin/dashboard/AlunosTable"
import { DashboardActions } from "@/components/features/admin/dashboard/DashboardActions"
import { DashboardStatsCards } from "@/components/features/admin/dashboard/DashboardStatsCards"
import { DashboardTabs } from "@/components/features/admin/dashboard/DashboardTabs"
import { ProfessoresTable } from "@/components/features/admin/dashboard/ProfessoresTable"
import { ProjectsTable } from "@/components/features/admin/dashboard/ProjectsTable"
import { PagesLayout } from "@/components/layout/PagesLayout"
import { useDashboard } from "@/hooks/features/useDashboard"
import { useProactiveRemindersBackground } from "@/hooks/use-proactive-reminders"
import { Loader } from "lucide-react"

export default function DashboardAdmin() {
  // Execute proactive reminders in background when admin accesses dashboard
  useProactiveRemindersBackground()
  const {
    abaAtiva,
    setAbaAtiva,
    groupedView,
    setGroupedView,
    columnFilters,
    setColumnFilters,
    deletingProjetoId,
    projetos,
    professores,
    alunos,
    statusCounts,
    loadingProjetos,
    loadingUsers,
    handleAnalisarProjeto,
    handleEditarUsuario,
    handleDeleteProjeto,
  } = useDashboard()

  const dashboardActions = (
    <DashboardActions
      abaAtiva={abaAtiva}
      groupedView={groupedView}
      onToggleGroupedView={() => {
        if (abaAtiva === "projetos") {
          setGroupedView(!groupedView)
        }
      }}
    />
  )

  return (
    <PagesLayout title="Dashboard" actions={dashboardActions}>
      <DashboardTabs activeTab={abaAtiva} onTabChange={setAbaAtiva} />

      {abaAtiva === "projetos" && (
        <>
          {loadingProjetos ? (
            <div className="flex justify-center items-center py-8">
              <Loader className="h-8 w-8 animate-spin" />
              <span className="ml-2">Carregando projetos...</span>
            </div>
          ) : (
            <>
              <DashboardStatsCards statusCounts={statusCounts} />
              <ProjectsTable
                projetos={projetos}
                groupedView={groupedView}
                deletingProjetoId={deletingProjetoId}
                onAnalisarProjeto={handleAnalisarProjeto}
                onDeleteProjeto={handleDeleteProjeto}
                columnFilters={columnFilters}
                onColumnFiltersChange={setColumnFilters}
              />
            </>
          )}
        </>
      )}

      {abaAtiva === "professores" && (
        <>
          {loadingUsers ? (
            <div className="flex justify-center items-center py-8">
              <Loader className="h-8 w-8 animate-spin" />
              <span className="ml-2">Carregando professores...</span>
            </div>
          ) : (
            <ProfessoresTable professores={professores} onEditarUsuario={handleEditarUsuario} />
          )}
        </>
      )}

      {abaAtiva === "alunos" && (
        <>
          {loadingUsers ? (
            <div className="flex justify-center items-center py-8">
              <Loader className="h-8 w-8 animate-spin" />
              <span className="ml-2">Carregando alunos...</span>
            </div>
          ) : (
            <AlunosTable alunos={alunos} onEditarUsuario={handleEditarUsuario} />
          )}
        </>
      )}

    </PagesLayout>
  )
}
