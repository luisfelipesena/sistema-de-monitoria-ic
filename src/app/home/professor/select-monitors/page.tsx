"use client"

import { LoadingSkeleton } from "@/components/atoms/LoadingSkeleton"
import { EmptyState } from "@/components/features/professor/select-monitors/EmptyState"
import { ProjectCard } from "@/components/features/professor/select-monitors/ProjectCard"
import { ProjectSummary } from "@/components/features/professor/select-monitors/ProjectSummary"
import { SearchFilter } from "@/components/features/professor/select-monitors/SearchFilter"
import { SelectionDialog } from "@/components/features/professor/select-monitors/SelectionDialog"
import { PagesLayout } from "@/components/layout/PagesLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useMonitorSelection } from "@/hooks/features/useMonitorSelection"
import { useDialogState } from "@/hooks/useDialogState"
import type { MonitorProject } from "@/types/monitor-selection"
import { AlertTriangle } from "lucide-react"
import { useMemo, useRef, useState } from "react"

function hasPendingSelection(project: MonitorProject): boolean {
  const confirmedInterest = project.inscricoes.filter((i) => i.status === "CONFIRMED_INTEREST")
  const alreadySelected = project.inscricoes.filter(
    (i) =>
      i.status === "SELECTED_BOLSISTA" ||
      i.status === "SELECTED_VOLUNTARIO" ||
      i.status === "ACCEPTED_BOLSISTA" ||
      i.status === "ACCEPTED_VOLUNTARIO"
  )
  const totalVagas = (project.bolsasDisponibilizadas || 0) + (project.voluntariosSolicitados || 0)
  return confirmedInterest.length > 0 && alreadySelected.length < totalVagas
}

export default function SelectMonitorsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const selectionDialog = useDialogState<MonitorProject>()
  const projectRefs = useRef<Record<number, HTMLDivElement | null>>({})

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

  const pendingProjects = useMemo(() => filteredProjects.filter(hasPendingSelection), [filteredProjects])

  const handleScrollToProject = (projectId: number) => {
    const el = projectRefs.current[projectId]
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  const handleOpenSelection = (project: MonitorProject) => {
    resetSelection()
    selectionDialog.open(project)
  }

  const handleCloseSelection = () => {
    resetSelection()
    selectionDialog.close()
  }

  const handleSubmit = (motivoTroca?: string) => {
    if (selectionDialog.data) {
      handleSubmitSelection(selectionDialog.data.id, motivoTroca)
      selectionDialog.close()
    }
  }

  if (isLoading) {
    return (
      <PagesLayout title="Seleção de Monitores" subtitle="Carregando projetos e inscrições...">
        <LoadingSkeleton count={3} itemsPerCard={4} />
      </PagesLayout>
    )
  }

  return (
    <PagesLayout title="Seleção de Monitores" subtitle="Selecione bolsistas e voluntários para seus projetos">
      <div className="space-y-6">
        <SearchFilter value={searchTerm} onChange={setSearchTerm} />

        {/* Pendências */}
        {pendingProjects.length > 0 && (
          <Card className="border-amber-400 bg-amber-50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base text-amber-800">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Pendências de Seleção ({pendingProjects.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {pendingProjects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleScrollToProject(project.id)}
                    className="px-3 py-1.5 text-sm font-medium bg-white border border-amber-300 rounded-lg text-amber-800 hover:bg-amber-100 hover:border-amber-400 transition-colors cursor-pointer"
                  >
                    {project.titulo}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <ProjectSummary projects={filteredProjects} />

        <div className="space-y-6">
          {filteredProjects.length === 0 ? (
            <EmptyState />
          ) : (
            filteredProjects.map((project) => (
              <div
                key={project.id}
                ref={(el) => {
                  projectRefs.current[project.id] = el
                }}
              >
                <ProjectCard
                  project={project}
                  onOpenSelection={handleOpenSelection}
                  isPublishing={publishResultsMutation.isPending}
                />
              </div>
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
