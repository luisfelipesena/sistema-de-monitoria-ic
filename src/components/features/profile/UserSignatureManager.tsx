import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/utils/api"
import { CheckCircle, Eye, FileSignature, Info, PenTool, Trash2 } from "lucide-react"
import { useRef, useState } from "react"
import SignatureCanvas from "react-signature-canvas"

type SignatureMode = "draw" | "upload"

export function UserSignatureManager() {
  const { toast } = useToast()
  const sigPadRef = useRef<SignatureCanvas>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [showSignatureEditor, setShowSignatureEditor] = useState(false)
  const [signatureMode, setSignatureMode] = useState<SignatureMode>("draw")
  const [previewSignature, setPreviewSignature] = useState<string | null>(null)
  const [isSigned, setIsSigned] = useState(false)

  const { data: signature, isLoading, refetch } = api.signature.getDefaultSignature.useQuery()
  const saveSignatureMutation = api.signature.saveDefaultSignature.useMutation()
  const deleteSignatureMutation = api.signature.deleteDefaultSignature.useMutation()

  const handleSaveSignature = async (signatureData: string) => {
    try {
      await saveSignatureMutation.mutateAsync({ signatureData })

      toast({
        title: "Assinatura salva",
        description: "Sua assinatura foi salva com sucesso!",
      })
      setShowSignatureEditor(false)
      setSignatureMode("draw")
      refetch()
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar a assinatura",
        variant: "destructive",
      })
    }
  }

  const handleDeleteSignature = async () => {
    try {
      await deleteSignatureMutation.mutateAsync()

      toast({
        title: "Assinatura removida",
        description: "Sua assinatura foi removida com sucesso",
      })
      refetch()
    } catch (error: any) {
      toast({
        title: "Erro ao remover",
        description: error.message || "Não foi possível remover a assinatura",
        variant: "destructive",
      })
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Formato inválido",
        description: "Por favor, selecione uma imagem",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      handleSaveSignature(result)
    }
    reader.readAsDataURL(file)
  }

  const handlePreviewSignature = () => {
    if (signature?.signatureData) {
      setPreviewSignature(signature.signatureData)
    }
  }

  const handleClearSignature = () => {
    sigPadRef.current?.clear()
    setIsSigned(false)
  }

  const handleSaveFromPad = () => {
    if (sigPadRef.current?.isEmpty()) {
      toast({
        title: "Assinatura vazia",
        description: "Por favor, desenhe sua assinatura.",
        variant: "destructive",
      })
      return
    }
    const signatureImage = sigPadRef.current?.toDataURL("image/png")
    if (signatureImage) {
      handleSaveSignature(signatureImage)
    }
  }

  const handleBeginStroke = () => {
    setIsSigned(true)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenTool className="h-5 w-5" />
            Assinatura Digital
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const hasSignature = signature?.signatureData

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PenTool className="h-5 w-5" />
          Assinatura Digital
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Configure sua assinatura digital para usar nos projetos de monitoria. Você pode desenhar sua assinatura ou
            fazer upload de uma imagem.
          </AlertDescription>
        </Alert>

        {hasSignature ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Assinatura configurada</p>
                  <p className="text-sm text-green-700">
                    Salva em:{" "}
                    {signature?.dataAssinatura
                      ? new Date(signature.dataAssinatura).toLocaleString("pt-BR")
                      : "Data não disponível"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handlePreviewSignature}>
                  <Eye className="h-4 w-4 mr-2" />
                  Visualizar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteSignature}
                  disabled={deleteSignatureMutation.isPending}
                  isLoading={deleteSignatureMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover
                </Button>
              </div>
            </div>

            <div className="flex justify-center">
              <Button variant="outline" onClick={() => setShowSignatureEditor(true)}>
                <PenTool className="h-4 w-4 mr-2" />
                Alterar Assinatura
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">ou</p>
                <Button onClick={() => setShowSignatureEditor(true)}>
                  <PenTool className="h-4 w-4 mr-2" />
                  Desenhar Assinatura
                </Button>
              </div>
            </div>
          </div>
        )}

        {showSignatureEditor && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PenTool className="h-5 w-5" />
                  {hasSignature ? "Alterar Assinatura" : "Configure sua Assinatura"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Mode Toggle */}
                <div className="flex gap-2 border-b pb-2">
                  <Button
                    variant={signatureMode === "draw" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSignatureMode("draw")}
                  >
                    Desenhar
                  </Button>
                  <Button
                    variant={signatureMode === "upload" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSignatureMode("upload")}
                  >
                    Fazer Upload
                  </Button>
                </div>

                {signatureMode === "draw" ? (
                  <>
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Desenhe sua assinatura no campo abaixo. Você pode limpar e redesenhar quantas vezes quiser.
                      </AlertDescription>
                    </Alert>

                    <div className="border rounded-md bg-gray-50 p-2">
                      <SignatureCanvas
                        ref={sigPadRef}
                        penColor="black"
                        canvasProps={{
                          className: "w-full h-40 rounded-md bg-white",
                        }}
                        backgroundColor="white"
                        onBegin={handleBeginStroke}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={handleClearSignature}>
                        Limpar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowSignatureEditor(false)
                          setSignatureMode("draw")
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleSaveFromPad}
                        disabled={!isSigned || saveSignatureMutation.isPending}
                        isLoading={saveSignatureMutation.isPending}
                      >
                        Salvar Assinatura
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Selecione uma imagem clara da sua assinatura em fundo branco para melhor resultado.
                      </AlertDescription>
                    </Alert>

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50 text-center">
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="signature-upload-editor"
                      />
                      <Label htmlFor="signature-upload-editor" className="cursor-pointer">
                        <div className="flex flex-col items-center gap-2">
                          <FileSignature className="h-12 w-12 text-gray-400" />
                          <span className="text-sm font-medium">Clique para selecionar uma imagem</span>
                          <span className="text-xs text-muted-foreground">PNG, JPG ou JPEG</span>
                        </div>
                      </Label>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowSignatureEditor(false)
                          setSignatureMode("draw")
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {previewSignature && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Prévia da Assinatura</h3>
              <div className="border rounded-lg p-4 bg-gray-50 flex justify-center">
                <img src={previewSignature} alt="Assinatura" className="max-w-full max-h-32 object-contain" />
              </div>
              <div className="flex justify-end mt-4">
                <Button onClick={() => setPreviewSignature(null)}>Fechar</Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
