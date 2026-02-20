"use client"

import { LoadingSpinner } from "@/components/atoms/LoadingSpinner"
import { ProjectAnalysisDialog } from "@/components/features/admin/manage-projects/ProjectAnalysisDialog"
import { ProjectDeleteDialog } from "@/components/features/admin/manage-projects/ProjectDeleteDialog"
import { ProjectFilesDialog } from "@/components/features/admin/manage-projects/ProjectFilesDialog"
import { ProjectRejectDialog } from "@/components/features/admin/manage-projects/ProjectRejectDialog"
import { ProjectsStatsCards } from "@/components/features/admin/manage-projects/ProjectsStatsCards"
import { createProjectColumns } from "@/components/features/admin/manage-projects/ProjectTableColumns"
import { PagesLayout } from "@/components/layout/PagesLayout"
import { TableComponent } from "@/components/layout/TableComponent"
import { useProjectManagement } from "@/hooks/features/useProjectManagement"
import { api } from "@/utils/api"
import { useMemo } from "react"

export default function ManageProjectsPage() {
  const {
    projetos,
    loadingProjetos,
    statusCounts,
    totalCount,
    columnFilters,
    setColumnFilters,
    page,
    pageSize,
    setPage,
    setPageSize,
    groupedView,
    setGroupedView,
    rejectFeedback,
    setRejectFeedback,
    loadingPdfProjetoId,
    previewDialog,
    rejectDialog,
    deleteDialog,
    filesDialog,
    projectFiles,
    loadingProjectFiles,
    handleViewProjectPDF,
    handleDownloadFile,
    handleApproveProject,
    handleRejectProject,
    handleDeleteProject,
    handleOpenRejectDialog,
    handleGoToDocumentSigning,
    isApproving,
    isRejecting,
    isDeleting,
  } = useProjectManagement()

  // Fetch disciplinas for autocomplete filter
  const { data: disciplinas } = api.discipline.getDisciplines.useQuery()

  const disciplinaFilterOptions = useMemo(() => {
    const options: { value: string; label: string }[] = []

    if (disciplinas) {
      for (const d of disciplinas) {
        options.push({ value: d.codigo, label: `${d.codigo} - ${d.nome}` })
      }
    }

    // Add unique professor names from current page data as suggestions
    if (projetos) {
      const seenNames = new Set<string>()
      for (const p of projetos) {
        const nome = p.professorResponsavelNome
        if (nome && !seenNames.has(nome)) {
          seenNames.add(nome)
          options.push({ value: nome, label: `Prof. ${nome}` })
        }
      }
    }

    return options
  }, [disciplinas, projetos])

  const columns = useMemo(
    () =>
      createProjectColumns(
        {
          onPreview: previewDialog.open,
          onViewPDF: handleViewProjectPDF,
          onViewFiles: filesDialog.open,
          onDelete: deleteDialog.open,
          loadingPdfProjetoId,
          isDeletingProject: isDeleting,
          disciplinaFilterOptions,
        },
        groupedView
      ),
    [
      previewDialog.open,
      handleViewProjectPDF,
      filesDialog.open,
      deleteDialog.open,
      loadingPdfProjetoId,
      isDeleting,
      groupedView,
      disciplinaFilterOptions,
    ]
  )

  return (
    <PagesLayout title="Gerenciar Projetos" subtitle="Administração de projetos de monitoria">
      {loadingProjetos ? (
        <LoadingSpinner message="Carregando projetos..." />
      ) : (
        <>
          <ProjectsStatsCards
            total={totalCount}
            draft={statusCounts.draft}
            submitted={statusCounts.submitted}
            approved={statusCounts.approved}
            rejected={statusCounts.rejected}
          />

          <TableComponent
            columns={columns}
            data={projetos}
            columnFilters={columnFilters}
            onColumnFiltersChange={setColumnFilters}
            isLoading={loadingProjetos}
            serverPagination={{
              totalCount,
              pageIndex: page,
              pageSize,
              onPageChange: setPage,
              onPageSizeChange: setPageSize,
            }}
          />
        </>
      )}

      <ProjectAnalysisDialog
        isOpen={previewDialog.isOpen}
        onClose={previewDialog.close}
        project={previewDialog.data}
        onApprove={handleApproveProject}
        onReject={() => previewDialog.data && handleOpenRejectDialog(previewDialog.data)}
        isApproving={isApproving}
      />

      <ProjectRejectDialog
        isOpen={rejectDialog.isOpen}
        onClose={rejectDialog.close}
        project={rejectDialog.data}
        feedback={rejectFeedback}
        onFeedbackChange={setRejectFeedback}
        onConfirm={handleRejectProject}
        isRejecting={isRejecting}
      />

      <ProjectDeleteDialog
        isOpen={deleteDialog.isOpen}
        onClose={deleteDialog.close}
        project={deleteDialog.data}
        onConfirm={handleDeleteProject}
        isDeleting={isDeleting}
      />

      <ProjectFilesDialog
        isOpen={filesDialog.isOpen}
        onClose={filesDialog.close}
        project={filesDialog.data}
        files={projectFiles}
        isLoading={loadingProjectFiles}
        onDownload={handleDownloadFile}
      />
    </PagesLayout>
  )
}
