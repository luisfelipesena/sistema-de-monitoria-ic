"use client"

import { Button } from "@/components/ui/button"
import { Eye, FileText, Loader2, RefreshCw } from "lucide-react"
import React from "react"

interface PreviewSectionProps {
  showPreview: boolean
  isGenerating: boolean
  isLoadingUser?: boolean
  onGeneratePreview: () => void
  onUpdatePreview?: () => void
  children?: React.ReactNode
  title?: string
  subtitle?: string
}

export const PreviewSection: React.FC<PreviewSectionProps> = ({
  showPreview,
  isGenerating,
  isLoadingUser = false,
  onGeneratePreview,
  onUpdatePreview,
  children,
  title = "Gere o Preview",
  subtitle = "Visualize como ficará o documento antes de salvar",
}) => {
  if (!showPreview) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h4 className="text-lg font-medium text-gray-900 mb-2">{title}</h4>
        <p className="text-gray-600 mb-4">{subtitle}</p>

        <Button
          onClick={onGeneratePreview}
          disabled={isGenerating}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Gerando Preview...
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 mr-2" />
              Gerar Preview
            </>
          )}
        </Button>
      </div>
    )
  }

  if (isLoadingUser) {
    return (
      <div className="flex flex-col justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
        <p>Carregando dados do professor...</p>
      </div>
    )
  }

  if (!children) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Erro ao carregar preview</p>
      </div>
    )
  }

  return (
    <>
      {onUpdatePreview && (
        <div className="mb-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onUpdatePreview}
            disabled={isGenerating}
            className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Atualizando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar Preview
              </>
            )}
          </Button>
        </div>
      )}
      {children}
    </>
  )
}