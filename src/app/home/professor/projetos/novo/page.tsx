"use client"

export const dynamic = 'force-dynamic'

import { DisciplineSelectionView } from "@/components/features/professor/projetos/novo/DisciplineSelectionView"
import { ProjectFormView } from "@/components/features/professor/projetos/novo/ProjectFormView"
import { MonitoriaFormTemplate } from "@/components/features/projects/MonitoriaFormTemplate"
import { PagesLayout } from "@/components/layout/PagesLayout"
import { useProjectCreation } from "@/hooks/features/useProjectCreation"
import type { MonitoriaFormData } from "@/types"
import { PDFViewer } from "@react-pdf/renderer"
import { Loader2 } from "lucide-react"
import React from "react"

const PDFPreviewComponent = React.memo(({ data }: { data: MonitoriaFormData }) => {
  return (
    <div className="border rounded-lg bg-white">
      <div style={{ width: "100%", height: "800px" }}>
        <PDFViewer width="100%" height="100%" showToolbar={false}>
          <MonitoriaFormTemplate data={data} />
        </PDFViewer>
      </div>
    </div>
  )
})

PDFPreviewComponent.displayName = "PDFPreviewComponent"

export default function NovoProjetoPage() {
  const { states, queries, mutations, handlers, forms } = useProjectCreation()

  if (queries.isLoading) {
    return (
      <PagesLayout title="Novo Projeto de Monitoria">
        <div className="flex justify-center items-center py-8">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="mt-2">Carregando dados necessários...</p>
          </div>
        </div>
      </PagesLayout>
    )
  }

  if (!states.selectedDisciplinaId) {
    return <DisciplineSelectionView disciplines={queries.disciplinas!} onSelect={handlers.handleDisciplinaSelect} />
  }

  const selectedDisciplina = queries.disciplinas?.find((d) => d.id === states.selectedDisciplinaId)

  return (
    <ProjectFormView
      selectedDisciplina={selectedDisciplina}
      hasTemplate={!!queries.currentTemplate}
      isEditingTemplate={states.isEditingTemplate}
      showPreview={states.showPreview}
      isGeneratingPreview={states.isGeneratingPreview}
      isLoadingUser={queries.isLoadingUser}
      pdfKey={states.pdfKey}
      currentPdfData={states.currentPdfData}
      projectForm={forms.form}
      templateForm={forms.templateForm}
      atividades={states.atividades}
      publicoAlvoTipo={states.publicoAlvoTipo}
      publicoAlvoCustom={states.publicoAlvoCustom}
      isSubmittingProject={mutations.createProjeto.isPending}
      isSubmittingTemplate={mutations.upsertTemplate.isPending}
      onBackToSelect={handlers.handleBackToSelect}
      onEditTemplate={() => handlers.setIsEditingTemplate(true)}
      onCancelTemplate={() => handlers.setIsEditingTemplate(false)}
      onSubmitProject={handlers.onSubmitProject}
      onSubmitTemplate={handlers.onSubmitTemplate}
      onAtividadeChange={handlers.handleAtividadeChange}
      onAddAtividade={handlers.handleAddAtividade}
      onRemoveAtividade={handlers.handleRemoveAtividade}
      setPublicoAlvoTipo={handlers.setPublicoAlvoTipo}
      setPublicoAlvoCustom={handlers.setPublicoAlvoCustom}
      onGeneratePreview={handlers.handleGeneratePreview}
      onUpdatePreview={states.showPreview ? handlers.handleUpdatePreview : undefined}
      PDFPreviewComponent={PDFPreviewComponent}
    />
  )
}
