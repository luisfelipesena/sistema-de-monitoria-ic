"use client"

import { MonitoriaFormTemplate } from "@/components/features/projects/MonitoriaFormTemplate"
import { Button } from "@/components/ui/button"
import { MonitoriaFormData } from "@/types"
import { AlertCircle, CheckCircle, Eye, EyeOff, FileText, Loader2, RefreshCw } from "lucide-react"
import dynamic from "next/dynamic"
import { useMemo, useState } from "react"

// PDFViewer wrapper to prevent SSR issues - separate file for ESM compatibility
const ClientOnlyPDFViewer = dynamic(
  () => import("@/components/features/projects/PDFViewerWrapper").then((mod) => mod.PDFViewerWrapper),
  { ssr: false, loading: () => <div className="flex justify-center items-center h-[600px]"><Loader2 className="h-8 w-8 animate-spin" /></div> }
)

interface ProjectPDFPreviewProps {
  formData: Partial<MonitoriaFormData>
  hasRequiredFields: boolean
}

export const ProjectPDFPreview = function ProjectPDFPreviewComponent({
  formData,
  hasRequiredFields,
}: ProjectPDFPreviewProps) {
  const [showPreview, setShowPreview] = useState(false)
  const [pdfRenderKey, setPdfRenderKey] = useState(0)
  const [pdfData, setPdfData] = useState<MonitoriaFormData | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleActivatePreview = () => {
    if (formData && hasRequiredFields) {
      setPdfData(formData as MonitoriaFormData)
      setPdfRenderKey((prev) => prev + 1)
      setShowPreview(true)
    }
  }

  const handleHidePreview = () => {
    setShowPreview(false)
    setPdfData(null)
  }

  const handleUpdatePdf = () => {
    if (formData && hasRequiredFields) {
      setIsUpdating(true)
      setPdfData(formData as MonitoriaFormData)
      setPdfRenderKey((prev) => prev + 1)

      setTimeout(() => {
        setIsUpdating(false)
      }, 800)
    }
  }

  const hasChanges = useMemo(() => {
    if (!pdfData || !formData) return false
    return JSON.stringify(pdfData) !== JSON.stringify(formData)
  }, [pdfData, formData])

  const memoizedPdfViewer = useMemo(() => {
    if (!pdfData || !showPreview) return null

    return (
      <div key={pdfRenderKey} className="pdf-container h-[600px] w-full border rounded">
        <ClientOnlyPDFViewer width="100%" height="100%" showToolbar={false}>
          <MonitoriaFormTemplate data={pdfData} />
        </ClientOnlyPDFViewer>
      </div>
    )
  }, [pdfRenderKey, pdfData, showPreview])

  const renderContent = () => {
    if (!hasRequiredFields) {
      return (
        <div className="p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 mb-4 text-orange-500" />
          <h4 className="text-lg font-medium text-gray-700 mb-2">Campos obrigatórios pendentes</h4>
          <p className="text-gray-500 text-sm mb-4">
            Preencha todos os campos obrigatórios para gerar o preview do PDF
          </p>
          <div className="text-xs text-gray-400 bg-gray-50 p-3 rounded">
            <strong>Campos obrigatórios:</strong> Título, Descrição, Departamento, Disciplinas, Ano, Semestre, Tipo de
            Proposição, Carga Horária, Número de Semanas, Público Alvo
          </div>
        </div>
      )
    }

    if (!showPreview) {
      return (
        <div className="p-8 text-center">
          <FileText className="mx-auto h-12 w-12 text-blue-400 mb-4" />
          <h4 className="text-lg font-medium text-blue-700 mb-2">Preview PDF Disponível</h4>
          <p className="text-blue-600 text-sm mb-4">
            Clique para gerar o PDF com os dados atuais do formulário. O PDF não será atualizado automaticamente.
          </p>
          <Button onClick={handleActivatePreview}>
            <Eye className="h-4 w-4 mr-2" />
            Gerar Preview
          </Button>
        </div>
      )
    }

    if (isUpdating) {
      return (
        <div className="h-[600px] w-full flex items-center justify-center bg-blue-50 border rounded-md">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 text-blue-600 mb-4 animate-spin" />
            <h4 className="text-lg font-medium text-blue-700 mb-2">Atualizando PDF</h4>
            <p className="text-blue-600 text-sm">Aguarde enquanto o documento é atualizado...</p>
          </div>
        </div>
      )
    }

    return memoizedPdfViewer
  }

  return (
    <div className="border rounded-lg bg-white shadow-sm">
      <div className="bg-blue-50 border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasRequiredFields ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-orange-500" />
            )}
            <span className="text-sm font-medium">{hasRequiredFields ? "Preview Disponível" : "Campos Pendentes"}</span>

            {showPreview && hasChanges && !isUpdating && (
              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded border border-orange-300">
                📝 Formulário foi alterado
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {showPreview && (
              <Button variant="outline" size="sm" onClick={handleHidePreview} className="text-gray-600 border-gray-300">
                <EyeOff className="h-3 w-3 mr-1" />
                Ocultar
              </Button>
            )}

            {showPreview && hasRequiredFields && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleUpdatePdf}
                disabled={isUpdating}
                className={
                  hasChanges
                    ? "text-orange-700 border-orange-400 bg-orange-50 font-medium"
                    : "text-blue-600 border-blue-300"
                }
              >
                {isUpdating ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3 mr-1" />
                )}
                {hasChanges ? "Atualizar PDF" : "Atualizar"}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="p-2">{renderContent()}</div>
    </div>
  )
}
