"use client"

import { MonitoriaFormData, MonitoriaFormTemplate } from "@/components/features/projects/MonitoriaFormTemplate"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { api } from "@/utils/api"
import { PDFViewer } from "@react-pdf/renderer"
import { CheckCircle, FileSignature, Loader2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import SignatureCanvas from "react-signature-canvas"
// import { toast } from "sonner"

interface InteractiveProjectPDFProps {
  formData: MonitoriaFormData
  userRole: "professor" | "admin"
  onSignatureComplete?: () => void
}

export function InteractiveProjectPDF({ formData, userRole, onSignatureComplete }: InteractiveProjectPDFProps) {
  const [showSignatureDialog, setShowSignatureDialog] = useState(false)
  const [signedData, setSignedData] = useState<MonitoriaFormData>(formData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const signatureRef = useRef<SignatureCanvas>(null)

  const { data: pdfData, isLoading: isLoadingSignatures } = api.projeto.getProjectPdfData.useQuery(
    { id: formData.projetoId! },
    { enabled: !!formData.projetoId }
  )

  const professorSignatureMutation = api.projeto.assinarProjetoProfessor.useMutation()
  const adminSignatureMutation = api.projeto.assinarProjetoAdmin.useMutation()

  useEffect(() => {
    if (pdfData) {
      setSignedData({
        ...formData,
        assinaturaProfessor: pdfData.assinaturaProfessor ?? undefined,
        // dataAssinaturaProfessor: pdfData.dataAssinaturaProfessor,
        // assinaturaAdmin: pdfData.assinaturaAdmin,
        // dataAssinaturaAdmin: pdfData.dataAssinaturaAdmin,
      })
    }
  }, [pdfData, formData])

  const handleOpenSignature = () => {
    setShowSignatureDialog(true)
  }

  const handleClearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear()
    }
  }

  const handleSaveSignature = async () => {
    if (signatureRef.current && !signatureRef.current.isEmpty() && formData.projetoId) {
      setIsSubmitting(true)
      try {
        const signatureDataURL = signatureRef.current.toDataURL()

        if (userRole === "professor") {
          await professorSignatureMutation.mutateAsync({
            projetoId: formData.projetoId,
            signatureImage: signatureDataURL,
          })

          setSignedData({
            ...signedData,
            assinaturaProfessor: signatureDataURL,
            dataAssinaturaProfessor: new Date().toLocaleDateString("pt-BR"),
          })
        } else if (userRole === "admin") {
          await adminSignatureMutation.mutateAsync({
            projetoId: formData.projetoId,
            signatureImage: signatureDataURL,
          })

          setSignedData({
            ...signedData,
            assinaturaAdmin: signatureDataURL,
            dataAssinaturaAdmin: new Date().toLocaleDateString("pt-BR"),
            dataAprovacao: new Date().toLocaleDateString("pt-BR"),
          })
        }

        setShowSignatureDialog(false)
        // toast.success("Assinatura salva com sucesso!")
        onSignatureComplete?.()
      } catch (error) {
        console.error("Erro ao salvar assinatura:", error)
        // toast.error("Erro ao salvar assinatura")
      } finally {
        setIsSubmitting(false)
      }
    } else {
      // toast.error("Por favor, faça a assinatura antes de salvar")
    }
  }

  const currentFormData = {
    ...signedData,
    signingMode: userRole,
  }

  const hasSignature =
    userRole === "professor" ? !!currentFormData.assinaturaProfessor : !!currentFormData.assinaturaAdmin

  const roleLabel = userRole === "professor" ? "Professor" : "Coordenador"

  if (isLoadingSignatures) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Carregando dados do documento...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileSignature className="h-5 w-5" />
              Documento do Projeto - {currentFormData.titulo}
            </span>
            {!hasSignature && (
              <Button onClick={handleOpenSignature} className="ml-4">
                <FileSignature className="h-4 w-4 mr-2" />
                Assinar como {roleLabel}
              </Button>
            )}
            {hasSignature && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Assinado por {roleLabel}</span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg bg-white h-[800px]">
            <PDFViewer width="100%" height="100%" showToolbar>
              <MonitoriaFormTemplate data={currentFormData} />
            </PDFViewer>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showSignatureDialog} onOpenChange={setShowSignatureDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assinatura Digital - {roleLabel}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">Desenhe sua assinatura no espaço abaixo:</div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
              <SignatureCanvas
                ref={signatureRef}
                canvasProps={{
                  width: 600,
                  height: 200,
                  className: "signature-canvas bg-white rounded border",
                }}
                backgroundColor="white"
              />
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleClearSignature}>
                Limpar
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowSignatureDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveSignature} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Salvar Assinatura
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
