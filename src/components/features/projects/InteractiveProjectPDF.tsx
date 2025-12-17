"use client"

import { MonitoriaFormTemplate } from "@/components/features/projects/MonitoriaFormTemplate"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { MonitoriaFormData } from "@/types"
import { api } from "@/utils/api"
import { PDFViewer } from "@react-pdf/renderer"
import { CheckCircle, FileSignature, Loader2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import SignatureCanvas from "react-signature-canvas"

interface InteractiveProjectPDFProps {
  formData: MonitoriaFormData
  userRole: "professor" | "admin"
  onSignatureComplete?: () => void
}

export function InteractiveProjectPDF({ formData, userRole, onSignatureComplete }: InteractiveProjectPDFProps) {
  const { toast } = useToast()
  const [showSignatureDialog, setShowSignatureDialog] = useState(false)
  const [signedData, setSignedData] = useState<MonitoriaFormData>(formData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingSignatures, setIsLoadingSignatures] = useState(true)
  const [useCustomSignature, setUseCustomSignature] = useState(false)
  const signatureRef = useRef<SignatureCanvas>(null)

  const professorSignature = api.projeto.signProfessor.useMutation()
  const saveDefaultSignature = api.signature.saveDefaultSignature.useMutation()
  const { data: userProfile } = api.user.getProfile.useQuery()

  const getDefaultSignature = () => {
    if (userRole === "professor") {
      return userProfile?.professorProfile?.assinaturaDefault || userProfile?.assinaturaDefault
    }
    return userProfile?.assinaturaDefault
  }

  const hasDefaultSignature = !!getDefaultSignature()

  useEffect(() => {
    const loadExistingSignatures = async () => {
      if (!formData.projetoId) {
        setIsLoadingSignatures(false)
        return
      }

      setSignedData({
        ...formData,
        assinaturaProfessor: formData.assinaturaProfessor,
        dataAssinaturaProfessor: formData.assinaturaProfessor ? new Date().toLocaleDateString("pt-BR") : undefined,
      })
      setIsLoadingSignatures(false)
    }

    loadExistingSignatures()
  }, [formData])

  const handleOpenSignature = () => {
    if (hasDefaultSignature && !useCustomSignature) {
      // Se tem assinatura padrão, abre o dialog para dar opção ao usuário
      setShowSignatureDialog(true)
      return
    }
    setShowSignatureDialog(true)
  }

  const handleUseDefaultSignature = async () => {
    const defaultSignature = getDefaultSignature()
    if (!defaultSignature || !formData.projetoId) {
      toast({
        title: "Erro",
        description: "Assinatura padrão não encontrada",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      if (userRole === "professor") {
        await professorSignature.mutateAsync({
          projetoId: formData.projetoId,
          signatureImage: defaultSignature,
        })

        const updatedFormData = {
          ...formData,
          assinaturaProfessor: defaultSignature,
          dataAssinaturaProfessor: new Date().toLocaleDateString("pt-BR"),
          signingMode: "professor" as const,
        }
        setSignedData(updatedFormData)
      } else {
        toast({
          title: "Erro",
          description: "Apenas professores podem assinar projetos.",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Sucesso",
        description: "Documento assinado com sua assinatura padrão!",
      })
      onSignatureComplete?.()
    } catch (error) {
      console.error("Error using default signature:", error)
      toast({
        title: "Erro",
        description: "Erro ao usar assinatura padrão",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
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
          await professorSignature.mutateAsync({
            projetoId: formData.projetoId,
            signatureImage: signatureDataURL,
          })

          // Save as user's default signature for future use
          try {
            await saveDefaultSignature.mutateAsync({ signatureData: signatureDataURL })
          } catch (err) {
            console.warn("Failed to save default signature, but project was signed:", err)
          }

          const updatedFormData = {
            ...formData,
            assinaturaProfessor: signatureDataURL,
            dataAssinaturaProfessor: new Date().toLocaleDateString("pt-BR"),
            signingMode: "professor" as const,
          }
          setSignedData(updatedFormData)
        } else {
          toast({
            title: "Erro",
            description: "Apenas professores podem assinar projetos.",
            variant: "destructive",
          })
          return
        }

        setShowSignatureDialog(false)
        toast({
          title: "Sucesso",
          description: "Assinatura salva com sucesso!",
        })
        onSignatureComplete?.()
      } catch (error) {
        console.error("Error saving signature:", error)
        toast({
          title: "Erro",
          description: "Erro ao salvar assinatura",
          variant: "destructive",
        })
      } finally {
        setIsSubmitting(false)
      }
    } else {
      toast({
        title: "Erro",
        description: "Por favor, faça a assinatura antes de salvar",
        variant: "destructive",
      })
    }
  }

  const currentFormData = {
    ...signedData,
    signingMode: userRole,
  }

  const hasSignature = !!currentFormData.assinaturaProfessor

  const roleLabel = userRole === "professor" ? "Professor" : "Coordenador"

  if (isLoadingSignatures) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Carregando dados do documento...</span>
          </CardContent>
        </Card>
      </div>
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
              <div className="flex items-center gap-2">
                {hasDefaultSignature ? (
                  <>
                    <Button onClick={handleOpenSignature} disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Assinando...
                        </>
                      ) : (
                        <>
                          <FileSignature className="h-4 w-4 mr-2" />
                          Usar Assinatura Padrão
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setUseCustomSignature(true)
                        setShowSignatureDialog(true)
                      }}
                      disabled={isSubmitting}
                    >
                      Desenhar Nova Assinatura
                    </Button>
                  </>
                ) : (
                  <Button onClick={handleOpenSignature} disabled={isSubmitting}>
                    <FileSignature className="h-4 w-4 mr-2" />
                    Assinar como {roleLabel}
                  </Button>
                )}
              </div>
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
          <div className="border rounded-lg bg-white">
            <PDFViewer width="100%" height="800px" showToolbar>
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
            {hasDefaultSignature && !useCustomSignature && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 font-medium mb-2">💡 Você tem uma assinatura padrão configurada</p>
                <p className="text-blue-700 text-sm">
                  Use sua assinatura padrão ou desenhe uma nova assinatura específica para este documento.
                </p>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    onClick={() => {
                      setShowSignatureDialog(false)
                      handleUseDefaultSignature()
                    }}
                  >
                    Usar Assinatura Padrão
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setUseCustomSignature(true)}>
                    Desenhar Nova
                  </Button>
                </div>
              </div>
            )}

            {(!hasDefaultSignature || useCustomSignature) && (
              <>
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
              </>
            )}
          </div>

          {(!hasDefaultSignature || useCustomSignature) && (
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleClearSignature}>
                Limpar
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSignatureDialog(false)
                    setUseCustomSignature(false)
                  }}
                >
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
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
