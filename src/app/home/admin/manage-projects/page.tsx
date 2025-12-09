"use client"

import { useMemo } from "react"
import { PagesLayout } from "@/components/layout/PagesLayout"
import { TableComponent } from "@/components/layout/TableComponent"
import { LoadingSpinner } from "@/components/atoms/LoadingSpinner"
import { Button } from "@/components/ui/button"
import { ProjectsStatsCards } from "@/components/features/admin/manage-projects/ProjectsStatsCards"
import { createProjectColumns } from "@/components/features/admin/manage-projects/ProjectTableColumns"
import { ProjectAnalysisDialog } from "@/components/features/admin/manage-projects/ProjectAnalysisDialog"
import { ProjectRejectDialog } from "@/components/features/admin/manage-projects/ProjectRejectDialog"
import { ProjectDeleteDialog } from "@/components/features/admin/manage-projects/ProjectDeleteDialog"
import { ProjectFilesDialog } from "@/components/features/admin/manage-projects/ProjectFilesDialog"
import { useProjectManagement } from "@/hooks/features/useProjectManagement"
import { FileSignature } from "lucide-react"

export default function ManageProjectsPage() {
  const {
    projetos,
    loadingProjetos,
    statusCounts,
    columnFilters,
    setColumnFilters,
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
    ]
  )

  const dashboardActions = (
    <>
      <Button variant="secondary" onClick={handleGoToDocumentSigning} className="flex items-center gap-2">
        <FileSignature className="h-4 w-4" />
        Assinatura de Documentos
      </Button>
      <Button variant={groupedView ? "secondary" : "primary"} onClick={() => setGroupedView(!groupedView)}>
        {groupedView ? "Visão Normal" : "Agrupar por Departamento"}
      </Button>
    </>
  )

  return (
    <PagesLayout
      title="Gerenciar Projetos"
      subtitle="Administração de projetos de monitoria"
      actions={dashboardActions}
    >
      {loadingProjetos ? (
        <LoadingSpinner message="Carregando projetos..." />
      ) : (
        <>
          <ProjectsStatsCards
            total={projetos.length}
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
          />
        </>
      )}

      <ProjectAnalysisDialog
        isOpen={previewDialog.isOpen}
        onClose={previewDialog.close}
        project={previewDialog.data}
        onApprove={handleApproveProject}
        onReject={() => previewDialog.data && handleOpenRejectDialog(previewDialog.data)}
        onViewPDF={handleViewProjectPDF}
        isApproving={isApproving}
        isLoadingPdf={loadingPdfProjetoId === previewDialog.data?.id}
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
