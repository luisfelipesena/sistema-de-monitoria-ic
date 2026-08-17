import { PreviewSection } from "@/components/features/projects/PreviewSection"
import { ProjectForm } from "@/components/features/projects/ProjectForm"
import { TemplateForm } from "@/components/features/projects/TemplateForm"
import { TemplateRequiredAlert } from "@/components/features/projects/TemplateRequiredAlert"
import { PagesLayout } from "@/components/layout/PagesLayout"
import { Button } from "@/components/ui/button"
import type { MonitoriaFormData } from "@/types"
import { Edit3, RotateCcw } from "lucide-react"
import type { UseFormReturn } from "react-hook-form"

interface ProjectFormViewProps {
  selectedDisciplina: {
    id: number
    codigo: string
    nome: string
  } | undefined
  hasTemplate: boolean
  isEditingTemplate: boolean
  showPreview: boolean
  isGeneratingPreview: boolean
  isLoadingUser: boolean
  pdfKey: number
  currentPdfData: MonitoriaFormData | null
  projectForm: UseFormReturn<any>
  templateForm: UseFormReturn<any>
  atividades: string[]
  publicoAlvoTipo: "estudantes_graduacao" | "outro"
  publicoAlvoCustom: string
  isSubmittingProject: boolean
  isSubmittingTemplate: boolean
  onBackToSelect: () => void
  onEditTemplate: () => void
  onCancelTemplate: () => void
  onSubmitProject: (data: any) => Promise<void>
  onSubmitTemplate: (data: any) => Promise<void>
  onAtividadeChange: (index: number, value: string) => void
  onAddAtividade: () => void
  onRemoveAtividade: (index: number) => void
  setPublicoAlvoTipo: (tipo: "estudantes_graduacao" | "outro") => void
  setPublicoAlvoCustom: (value: string) => void
  onGeneratePreview: () => Promise<void>
  onUpdatePreview?: () => Promise<void>
  PDFPreviewComponent: React.ComponentType<{ data: MonitoriaFormData }>
}

export function ProjectFormView({
  selectedDisciplina,
  hasTemplate,
  isEditingTemplate,
  showPreview,
  isGeneratingPreview,
  isLoadingUser,
  pdfKey,
  currentPdfData,
  projectForm,
  templateForm,
  atividades,
  publicoAlvoTipo,
  publicoAlvoCustom,
  isSubmittingProject,
  isSubmittingTemplate,
  onBackToSelect,
  onEditTemplate,
  onCancelTemplate,
  onSubmitProject,
  onSubmitTemplate,
  onAtividadeChange,
  onAddAtividade,
  onRemoveAtividade,
  setPublicoAlvoTipo,
  setPublicoAlvoCustom,
  onGeneratePreview,
  onUpdatePreview,
  PDFPreviewComponent,
}: ProjectFormViewProps) {
  return (
    <PagesLayout
      title={isEditingTemplate ? "Editar Template Padrão" : "Criar Projeto de Monitoria"}
      subtitle={`Disciplina: ${selectedDisciplina?.codigo} - ${selectedDisciplina?.nome}`}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBackToSelect}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Escolher Outra Disciplina
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Section (Left) */}
        <div className="space-y-6">
          {!hasTemplate && !isEditingTemplate ? (
            <TemplateRequiredAlert onCreateTemplate={onEditTemplate} variant="form" />
          ) : isEditingTemplate ? (
            <TemplateForm
              form={templateForm}
              onSubmit={onSubmitTemplate}
              onCancel={onCancelTemplate}
              isSubmitting={isSubmittingTemplate}
              atividades={atividades}
              onAtividadeChange={onAtividadeChange}
              onAddAtividade={onAddAtividade}
              onRemoveAtividade={onRemoveAtividade}
              publicoAlvoTipo={publicoAlvoTipo}
              setPublicoAlvoTipo={setPublicoAlvoTipo}
              publicoAlvoCustom={publicoAlvoCustom}
              setPublicoAlvoCustom={setPublicoAlvoCustom}
            />
          ) : (
            <>
              {/* Visual indicator that template is done and now on project form */}
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 flex items-start gap-3">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-100 shrink-0 mt-0.5">
                  <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-green-800">Template configurado com sucesso!</h4>
                  <p className="text-xs text-green-700 mt-0.5">
                    Agora preencha os dados específicos deste projeto de monitoria abaixo e submeta quando estiver pronto.
                  </p>
                </div>
              </div>

              <ProjectForm
                form={projectForm}
                onSubmit={onSubmitProject}
                isSubmitting={isSubmittingProject}
                atividades={atividades}
                onAtividadeChange={onAtividadeChange}
                onAddAtividade={onAddAtividade}
                onRemoveAtividade={onRemoveAtividade}
                publicoAlvoTipo={publicoAlvoTipo}
                setPublicoAlvoTipo={setPublicoAlvoTipo}
                publicoAlvoCustom={publicoAlvoCustom}
                setPublicoAlvoCustom={setPublicoAlvoCustom}
              />
            </>
          )}
        </div>

        {/* Preview Section (Right) */}
        <div className="space-y-4">
          {!hasTemplate && !isEditingTemplate ? (
            <TemplateRequiredAlert onCreateTemplate={onEditTemplate} variant="sidebar" />
          ) : (
            <div className="bg-gray-50 border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {isEditingTemplate ? "Preview do Template" : "Preview do Documento"}
                </h3>
                <div className="flex gap-2">
                  {!isEditingTemplate && hasTemplate && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onEditTemplate}
                      className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Editar Template
                    </Button>
                  )}
                </div>
              </div>

              <PreviewSection
                showPreview={showPreview}
                isGenerating={isGeneratingPreview}
                isLoadingUser={isLoadingUser}
                onGeneratePreview={onGeneratePreview}
                onUpdatePreview={onUpdatePreview}
              >
                {currentPdfData && <PDFPreviewComponent key={pdfKey} data={currentPdfData} />}
              </PreviewSection>
            </div>
          )}
        </div>
      </div>
    </PagesLayout>
  )
}
