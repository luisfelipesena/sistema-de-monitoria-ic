"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { SEMESTRE_LABELS, type Semestre } from "@/types"
import { api } from "@/utils/api"
import { AlertCircle, CheckCircle, FileSignature, Loader2, RotateCcw } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense, useRef, useState } from "react"
import SignatureCanvas from "react-signature-canvas"

function SignConsolidacaoContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const { toast } = useToast()
  const signatureRef = useRef<SignatureCanvas>(null)
  const [chefeNome, setChefeNome] = useState("")
  const [isSigning, setIsSigning] = useState(false)
  const [signatureComplete, setSignatureComplete] = useState(false)
  const [signatureMode, setSignatureMode] = useState<"draw" | "upload">("draw")
  const [uploadedSignatureUrl, setUploadedSignatureUrl] = useState<string | null>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Arquivo inválido",
        description: "Selecione uma imagem (PNG, JPG ou SVG).",
        variant: "destructive",
      })
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      setUploadedSignatureUrl(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Fetch consolidation signature status by token
  const {
    data: consolidacaoData,
    isLoading,
    error,
  } = api.relatorios.getConsolidacaoByToken.useQuery(
    { token: token || "" },
    {
      enabled: !!token,
      retry: false,
    }
  )

  const signMutation = api.relatorios.signConsolidacaoByToken.useMutation({
    onSuccess: () => {
      setSignatureComplete(true)
      toast({
        title: "Consolidação assinada com sucesso!",
        description: "A consolidação dos resultados foi assinada digitalmente.",
      })
    },
    onError: (err: { message: string }) => {
      toast({
        title: "Erro ao assinar",
        description: err.message,
        variant: "destructive",
      })
    },
  })

  const clearSignature = () => {
    if (signatureMode === "draw") {
      signatureRef.current?.clear()
    } else {
      setUploadedSignatureUrl(null)
    }
  }

  const handleSign = async () => {
    let signatureDataUrl = ""

    if (signatureMode === "draw") {
      if (!signatureRef.current || signatureRef.current.isEmpty()) {
        toast({
          title: "Assinatura necessária",
          description: "Por favor, desenhe sua assinatura antes de continuar.",
          variant: "destructive",
        })
        return
      }
      signatureDataUrl = signatureRef.current.toDataURL("image/png")
    } else {
      if (!uploadedSignatureUrl) {
        toast({
          title: "Arquivo necessário",
          description: "Por favor, selecione uma imagem da sua assinatura.",
          variant: "destructive",
        })
        return
      }
      signatureDataUrl = uploadedSignatureUrl
    }

    const nomeFinal = chefeNome.trim() || consolidacaoData?.chefeNome || ""
    if (!nomeFinal) {
      toast({
        title: "Nome necessário",
        description: "Por favor, informe seu nome completo.",
        variant: "destructive",
      })
      return
    }

    if (!token) {
      toast({
        title: "Token inválido",
        description: "Link de assinatura inválido.",
        variant: "destructive",
      })
      return
    }

    setIsSigning(true)
    try {
      await signMutation.mutateAsync({
        token,
        chefeAssinatura: signatureDataUrl,
        chefeNome: nomeFinal,
      })
    } finally {
      setIsSigning(false)
    }
  }

  // No token provided
  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle>Link Inválido</CardTitle>
            <CardDescription>
              Este link de assinatura é inválido. Por favor, utilize o link enviado por e-mail.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <CardTitle className="text-lg">Carregando dados da consolidação...</CardTitle>
          <CardDescription>Aguarde enquanto verificamos as informações.</CardDescription>
        </Card>
      </div>
    )
  }

  // Error state
  if (error || !consolidacaoData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle>Erro ao carregar</CardTitle>
            <CardDescription>
              {error?.message || "Não foi possível carregar a consolidação. O link pode ter expirado."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Already signed state
  if (consolidacaoData.isSigned || signatureComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-green-700">Consolidação Assinada!</CardTitle>
            <CardDescription>
              A consolidação de resultados para o período {consolidacaoData.ano}.
              {SEMESTRE_LABELS[consolidacaoData.semestre as Semestre]} foi assinada digitalmente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-1 mb-4 text-left">
              <p>
                <strong>Assinado por:</strong> {consolidacaoData.chefeNome || chefeNome}
              </p>
              <p>
                <strong>Data:</strong>{" "}
                {consolidacaoData.chefeAssinouEm
                  ? new Date(consolidacaoData.chefeAssinouEm).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : new Date().toLocaleDateString("pt-BR")}
              </p>
            </div>
            <Button asChild className="w-full">
              <Link href="/">Ir para a Página Inicial</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header Banner */}
        <Card>
          <CardHeader className="text-center border-b bg-white">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <FileSignature className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-xl text-blue-900">
              Assinatura da Consolidação de Resultados de Monitoria
            </CardTitle>
            <CardDescription className="text-base">
              Departamento de Ciência da Computação — Período {consolidacaoData.ano}.
              {SEMESTRE_LABELS[consolidacaoData.semestre as Semestre]}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm text-blue-800 space-y-1">
              <p>
                <strong>Destinatário:</strong> {consolidacaoData.chefeNome || "Chefe do Departamento"}
              </p>
              <p>
                <strong>E-mail:</strong> {consolidacaoData.chefeEmail}
              </p>
              <p className="pt-2 text-xs text-blue-600">
                Ao assinar este documento, você confirma e valida os resultados do processo seletivo de monitoria para matérias com bolsa de monitoria no período selecionado.
              </p>
            </div>

            {/* Form */}
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="chefeNome">Nome Completo do Chefe de Departamento</Label>
                <Input
                  id="chefeNome"
                  value={chefeNome}
                  onChange={(e) => setChefeNome(e.target.value)}
                  placeholder={consolidacaoData.chefeNome || "Digite seu nome completo"}
                />
              </div>

              {/* Signature method selector */}
              <div className="space-y-2">
                <Label>Método de Assinatura</Label>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={signatureMode === "draw" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSignatureMode("draw")}
                  >
                    Desenhar Assinatura
                  </Button>
                  <Button
                    type="button"
                    variant={signatureMode === "upload" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSignatureMode("upload")}
                  >
                    Upload de Imagem
                  </Button>
                </div>
              </div>

              {/* Draw Signature Canvas */}
              {signatureMode === "draw" && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Desenhe sua assinatura no quadro abaixo</Label>
                    <Button type="button" variant="ghost" size="sm" onClick={clearSignature}>
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Limpar
                    </Button>
                  </div>
                  <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                    <SignatureCanvas
                      ref={signatureRef}
                      canvasProps={{
                        className: "w-full h-40 cursor-crosshair",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Upload Signature Image */}
              {signatureMode === "upload" && (
                <div className="space-y-2">
                  <Label htmlFor="signature-file">Selecione uma imagem da sua assinatura</Label>
                  <Input
                    id="signature-file"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="cursor-pointer"
                  />
                  {uploadedSignatureUrl && (
                    <div className="mt-2 p-2 border rounded bg-white text-center">
                      <p className="text-xs text-gray-500 mb-1">Pré-visualização da assinatura:</p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={uploadedSignatureUrl}
                        alt="Assinatura"
                        className="max-h-24 mx-auto object-contain"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Sign Button */}
              <div className="pt-4">
                <Button onClick={handleSign} disabled={isSigning} className="w-full text-base py-6 bg-emerald-600 hover:bg-emerald-700">
                  {isSigning ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Assinando Consolidação...
                    </>
                  ) : (
                    <>
                      <FileSignature className="mr-2 h-5 w-5" />
                      Confirmar e Assinar Consolidação
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function SignConsolidacaoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <SignConsolidacaoContent />
    </Suspense>
  )
}
