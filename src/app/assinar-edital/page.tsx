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

function SignEditalContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const { toast } = useToast()
  const signatureRef = useRef<SignatureCanvas>(null)
  const [chefeNome, setChefeNome] = useState("")
  const [isSigning, setIsSigning] = useState(false)
  const [signatureComplete, setSignatureComplete] = useState(false)

  // Fetch edital data using token
  const {
    data: editalData,
    isLoading,
    error,
  } = api.edital.getEditalByToken.useQuery(
    { token: token || "" },
    {
      enabled: !!token,
      retry: false,
    }
  )

  const signMutation = api.edital.signEditalByToken.useMutation({
    onSuccess: () => {
      setSignatureComplete(true)
      toast({
        title: "Edital assinado com sucesso!",
        description: "O edital foi assinado digitalmente. O coordenador será notificado.",
      })
    },
    onError: (error) => {
      toast({
        title: "Erro ao assinar",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const clearSignature = () => {
    signatureRef.current?.clear()
  }

  const handleSign = async () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      toast({
        title: "Assinatura necessária",
        description: "Por favor, desenhe sua assinatura antes de continuar.",
        variant: "destructive",
      })
      return
    }

    if (!chefeNome.trim()) {
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
      const signatureDataUrl = signatureRef.current.toDataURL("image/png")
      await signMutation.mutateAsync({
        token,
        assinatura: signatureDataUrl,
        chefeNome: chefeNome.trim(),
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
              Este link de assinatura é inválido. Por favor, utilize o link enviado por email.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/">
              <Button variant="outline">Voltar para o início</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-muted-foreground">Verificando link de assinatura...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error || !editalData) {
    const errorMessage = error?.message || "Não foi possível carregar os dados do edital."
    const isExpired = errorMessage.includes("expirou")
    const isUsed = errorMessage.includes("utilizado")

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div
              className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${isExpired || isUsed ? "bg-yellow-100" : "bg-red-100"}`}
            >
              <AlertCircle className={`h-6 w-6 ${isExpired || isUsed ? "text-yellow-600" : "text-red-600"}`} />
            </div>
            <CardTitle>{isExpired ? "Link Expirado" : isUsed ? "Link Já Utilizado" : "Erro"}</CardTitle>
            <CardDescription>{errorMessage}</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {(isExpired || isUsed) && (
              <p className="text-sm text-muted-foreground">
                Entre em contato com o coordenador de monitoria para solicitar um novo link de assinatura.
              </p>
            )}
            <Link href="/">
              <Button variant="outline">Voltar para o início</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success state
  if (signatureComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Edital Assinado!</CardTitle>
            <CardDescription>
              O edital <strong>{editalData.edital.titulo}</strong> foi assinado com sucesso.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              O coordenador de monitoria foi notificado e poderá prosseguir com a publicação do edital.
            </p>
            <p className="text-xs text-muted-foreground">Você pode fechar esta página.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { edital, token: tokenData } = editalData
  const semestreLabel = edital.periodoInscricao ? SEMESTRE_LABELS[edital.periodoInscricao.semestre as Semestre] : ""

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <FileSignature className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Assinatura de Edital</h1>
          <p className="text-muted-foreground mt-1">Sistema de Monitoria IC - UFBA</p>
        </div>

        {/* Edital Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileSignature className="h-5 w-5" />
              Detalhes do Edital
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Número do Edital</Label>
                <p className="font-medium">{edital.numeroEdital}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Período</Label>
                <p className="font-medium">
                  {semestreLabel}/{edital.periodoInscricao?.ano}
                </p>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Título</Label>
              <p className="font-medium">{edital.titulo}</p>
            </div>
            {edital.descricaoHtml && (
              <div>
                <Label className="text-muted-foreground">Descrição</Label>
                <div
                  className="text-sm mt-1 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: edital.descricaoHtml }}
                />
              </div>
            )}
            {edital.periodoInscricao && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Início das Inscrições</Label>
                  <p className="font-medium">
                    {new Date(edital.periodoInscricao.dataInicio).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fim das Inscrições</Label>
                  <p className="font-medium">{new Date(edital.periodoInscricao.dataFim).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Signature Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Assinatura Digital</CardTitle>
            <CardDescription>
              Preencha seu nome completo e desenhe sua assinatura para assinar o edital como Chefe do Departamento.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name Input */}
            <div className="space-y-2">
              <Label htmlFor="chefeNome">Nome Completo do Chefe do Departamento</Label>
              <Input
                id="chefeNome"
                placeholder="Digite seu nome completo"
                value={chefeNome}
                onChange={(e) => setChefeNome(e.target.value)}
                disabled={isSigning}
              />
            </div>

            {/* Signature Canvas */}
            <div className="space-y-2">
              <Label>Assinatura</Label>
              <div className="border-2 border-gray-300 rounded-lg bg-white">
                <SignatureCanvas
                  ref={signatureRef}
                  canvasProps={{
                    width: 700,
                    height: 200,
                    className: "signature-canvas w-full",
                    style: { maxWidth: "100%", height: "auto" },
                  }}
                  backgroundColor="white"
                />
              </div>
              <p className="text-xs text-muted-foreground">Desenhe sua assinatura no campo acima usando o mouse ou toque.</p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <Button type="button" variant="outline" onClick={clearSignature} disabled={isSigning}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Limpar Assinatura
              </Button>

              <Button type="button" onClick={handleSign} disabled={isSigning} className="sm:min-w-[200px]">
                {isSigning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Assinando...
                  </>
                ) : (
                  <>
                    <FileSignature className="w-4 h-4 mr-2" />
                    Assinar Edital
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Informações Importantes</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>
                    Este link expira em{" "}
                    <strong>{new Date(tokenData.expiresAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</strong>
                  </li>
                  <li>Após assinar, o edital poderá ser publicado pelo coordenador</li>
                  <li>Sua assinatura digital será incluída no documento oficial</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Instituto de Computação - Universidade Federal da Bahia</p>
          <p>Departamento de Ciência da Computação</p>
        </div>
      </div>

      <style>{`
        .signature-canvas {
          touch-action: none;
        }
      `}</style>
    </div>
  )
}

export default function SignEditalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <SignEditalContent />
    </Suspense>
  )
}
