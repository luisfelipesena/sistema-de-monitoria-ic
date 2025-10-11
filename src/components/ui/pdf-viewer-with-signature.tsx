"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Eye, FileSignature, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { PdfSignatureModal } from "./pdf-signature-modal"

interface PdfViewerWithSignatureProps {
  pdfUrl: string
  projectTitle: string
  onSignComplete: (signedPdfBlob: Blob) => void
  loading?: boolean
}

export function PdfViewerWithSignature({
  pdfUrl,
  projectTitle,
  onSignComplete,
  loading = false,
}: PdfViewerWithSignatureProps) {
  const [pdfContent, setPdfContent] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [signatureModalOpen, setSignatureModalOpen] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    const loadPdf = async () => {
      try {
        const response = await fetch(pdfUrl)
        const htmlContent = await response.text()
        setPdfContent(htmlContent)
      } catch (error) {
        console.error("Erro ao carregar PDF:", error)
        toast({
          title: "Erro",
          description: "Erro ao carregar o documento",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (pdfUrl) {
      loadPdf()
    }
  }, [pdfUrl])

  const handleViewPdf = () => {
    if (!pdfContent) return
    const newWindow = window.open("", "_blank")
    if (newWindow) {
      newWindow.document.write(pdfContent)
      newWindow.document.close()
    }
  }

  const handleSignComplete = (signedPdfBlob: Blob) => {
    onSignComplete(signedPdfBlob)
  }

  if (isLoading || loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando documento...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">{projectTitle}</h3>
            <p className="text-sm text-muted-foreground">Documento pronto para assinatura digital</p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleViewPdf} disabled={!pdfContent}>
              <Eye className="h-4 w-4 mr-2" />
              Visualizar PDF
            </Button>

            <Button onClick={() => setSignatureModalOpen(true)} className="bg-green-600 hover:bg-green-700">
              <FileSignature className="h-4 w-4 mr-2" />
              Assinar Digitalmente
            </Button>
          </div>
        </div>

        <PdfSignatureModal
          open={signatureModalOpen}
          onOpenChange={setSignatureModalOpen}
          pdfUrl={pdfUrl}
          onSignComplete={handleSignComplete}
          title={`Assinar: ${projectTitle}`}
          description="Desenhe sua assinatura abaixo. Ela será adicionada ao final do documento."
        />
      </CardContent>
    </Card>
  )
}
