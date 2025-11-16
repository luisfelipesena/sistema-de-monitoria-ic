'use client'
import { PagesLayout } from '@/components/layout/PagesLayout'
import { FilterModal } from '@/components/ui/FilterModal'
import { useDashboard } from '@/hooks/features/useDashboard'
import { Loader } from 'lucide-react'
import { DashboardStatsCards } from '@/components/features/admin/dashboard/DashboardStatsCards'
import { DashboardTabs } from '@/components/features/admin/dashboard/DashboardTabs'
import { ProjectsTable } from '@/components/features/admin/dashboard/ProjectsTable'
import { ProfessoresTable } from '@/components/features/admin/dashboard/ProfessoresTable'
import { AlunosTable } from '@/components/features/admin/dashboard/AlunosTable'
import { DashboardActions } from '@/components/features/admin/dashboard/DashboardActions'

export default function DashboardAdmin() {
  const {
    abaAtiva,
    setAbaAtiva,
    filterModalOpen,
    setFilterModalOpen,
    filters,
    groupedView,
    setGroupedView,
    loadingPdfProjetoId,
    activeFilters,
    projetos,
    professores,
    alunos,
    statusCounts,
    loadingProjetos,
    loadingUsers,
    handleViewPdf,
    handleAnalisarProjeto,
    handleEditarUsuario,
    handleApplyFilters,
  } = useDashboard()

  const dashboardActions = (
    <DashboardActions
      abaAtiva={abaAtiva}
      groupedView={groupedView}
      activeFilters={activeFilters}
      onToggleGroupedView={() => {
        if (abaAtiva === 'projetos') {
          setGroupedView(!groupedView)
        }
      }}
      onOpenFilters={() => setFilterModalOpen(true)}
    />
  )

  return (
    <PagesLayout title="Dashboard" actions={dashboardActions}>
      <DashboardTabs activeTab={abaAtiva} onTabChange={setAbaAtiva} />

      {abaAtiva === 'projetos' && (
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
                loadingPdfId={loadingPdfProjetoId}
                onAnalisarProjeto={handleAnalisarProjeto}
                onViewPdf={handleViewPdf}
              />
            </>
          )}
        </>
      )}

      {abaAtiva === 'professores' && (
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

      {abaAtiva === 'alunos' && (
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

      <FilterModal
        open={filterModalOpen}
        onOpenChange={setFilterModalOpen}
        type="admin"
        onApplyFilters={handleApplyFilters}
        initialFilters={filters}
      />
    </PagesLayout>
  )
}
