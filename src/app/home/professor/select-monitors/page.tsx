"use client"

import { useState, useMemo } from "react"
import { PagesLayout } from "@/components/layout/PagesLayout"
import { LoadingSkeleton } from "@/components/atoms/LoadingSkeleton"
import { useDialogState } from "@/hooks/useDialogState"
import { useMonitorSelection } from "@/hooks/features/useMonitorSelection"
import { SearchFilter } from "@/components/features/professor/select-monitors/SearchFilter"
import { ProjectSummary } from "@/components/features/professor/select-monitors/ProjectSummary"
import { ProjectCard } from "@/components/features/professor/select-monitors/ProjectCard"
import { SelectionDialog } from "@/components/features/professor/select-monitors/SelectionDialog"
import { EmptyState } from "@/components/features/professor/select-monitors/EmptyState"
import type { MonitorProject } from "@/types/monitor-selection"

export default function SelectMonitorsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const selectionDialog = useDialogState<MonitorProject>()

  const {
    projetos,
    isLoading,
    selectedCandidates,
    feedback,
    setFeedback,
    selectMonitorsMutation,
    publishResultsMutation,
    handleSelectCandidate,
    handleSubmitSelection,
    resetSelection,
  } = useMonitorSelection()

  const filteredProjects = useMemo(
    () => projetos.filter((project) => project.titulo.toLowerCase().includes(searchTerm.toLowerCase())),
    [projetos, searchTerm]
  )

  const handleOpenSelection = (project: MonitorProject) => {
    resetSelection()
    selectionDialog.open(project)
  }

  const handleCloseSelection = () => {
    resetSelection()
    selectionDialog.close()
  }

  const handleSubmit = () => {
    if (selectionDialog.data) {
      handleSubmitSelection(selectionDialog.data.id)
      selectionDialog.close()
    }
  }

  if (isLoading) {
    return (
      <PagesLayout title="Seleção de Monitores" subtitle="Carregando projetos e inscricaos...">
        <LoadingSkeleton count={3} itemsPerCard={4} />
      </PagesLayout>
    )
  }

  return (
    <PagesLayout title="Seleção de Monitores" subtitle="Selecione bolsistas e voluntários para seus projetos">
      <div className="space-y-6">
        <SearchFilter value={searchTerm} onChange={setSearchTerm} />

        <ProjectSummary projects={filteredProjects} />

        <div className="space-y-6">
          {filteredProjects.length === 0 ? (
            <EmptyState />
          ) : (
            filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onOpenSelection={handleOpenSelection}
                isPublishing={publishResultsMutation.isPending}
              />
            ))
          )}
        </div>

        <SelectionDialog
          isOpen={selectionDialog.isOpen}
          onClose={handleCloseSelection}
          project={selectionDialog.data}
          selectedCandidates={selectedCandidates}
          feedback={feedback}
          onFeedbackChange={setFeedback}
          onSelectCandidate={(id, tipo) =>
            selectionDialog.data && handleSelectCandidate(id, tipo, selectionDialog.data)
          }
          onSubmit={handleSubmit}
          isSubmitting={selectMonitorsMutation.isPending}
        />
      </div>
    </PagesLayout>
  )
}
