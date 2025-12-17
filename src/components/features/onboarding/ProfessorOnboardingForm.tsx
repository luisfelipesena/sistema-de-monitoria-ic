"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import type { OnboardingStatusResponse } from "@/server/api/routers/onboarding/onboarding"
import {
  GENERO_FEMININO,
  GENERO_MASCULINO,
  GENERO_OUTRO,
  REGIME_20H,
  REGIME_40H,
  REGIME_DE,
  TIPO_PROFESSOR_EFETIVO,
  TIPO_PROFESSOR_LABELS,
  TIPO_PROFESSOR_SUBSTITUTO,
  type Genero,
  type Regime,
  type TipoProfessor,
} from "@/types"
import { api } from "@/utils/api"
import { formatUsernameToProperName } from "@/utils/username-formatter"
import { ArrowRight, CheckCircle, FileSignature, Info, UserCheck } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import SignatureCanvas from "react-signature-canvas"

interface ProfessorOnboardingFormProps {
  onboardingStatus: OnboardingStatusResponse
}

export function ProfessorOnboardingForm({ onboardingStatus }: ProfessorOnboardingFormProps) {
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuth()

  // Get existing profile data for pre-filling (if professor was INACTIVE)
  const existingData = onboardingStatus.existingProfileData
  const isReactivation = onboardingStatus.isInactive

  const [formData, setFormData] = useState({
    nomeCompleto: existingData?.nomeCompleto || "",
    matriculaSiape: existingData?.matriculaSiape || "",
    cpf: existingData?.cpf || "",
    telefone: existingData?.telefone || "",
    telefoneInstitucional: existingData?.telefoneInstitucional || "",
    regime: (existingData?.regime || "") as Regime | "",
    tipoProfessor: (existingData?.tipoProfessor || TIPO_PROFESSOR_EFETIVO) as TipoProfessor,
    departamentoId: existingData?.departamentoId || 0,
    genero: (existingData?.genero || "") as Genero | "",
    especificacaoGenero: existingData?.especificacaoGenero || "",
    nomeSocial: existingData?.nomeSocial || "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSignatureDialog, setShowSignatureDialog] = useState(false)
  const [signatureMode, setSignatureMode] = useState<"draw" | "upload">("draw")
  const signatureRef = useRef<SignatureCanvas>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: departamentos } = api.departamento.getDepartamentos.useQuery({ includeStats: false })
  const createProfileMutation = api.onboarding.createProfessorProfile.useMutation()
  const { data: userProfile } = api.user.getProfile.useQuery()
  const saveSignatureMutation = api.signature.saveDefaultSignature.useMutation()
  const { refetch: refetchOnboardingStatus } = api.onboarding.getStatus.useQuery()

  // Pre-populate name from user data only if no existing data
  useEffect(() => {
    if (user?.username && !formData.nomeCompleto && !existingData?.nomeCompleto) {
      setFormData((prev) => ({
        ...prev,
        nomeCompleto: formatUsernameToProperName(user.username),
      }))
    }
  }, [user, formData.nomeCompleto, existingData?.nomeCompleto])

  const hasProfile = onboardingStatus.profile.exists
  const hasSignature = onboardingStatus.signature?.configured || false
  // Check if required fields are present (cpf, genero, matriculaSiape)
  const hasRequiredFields = !!(existingData?.cpf && existingData?.genero && existingData?.matriculaSiape)
  // Show full form if: no profile, reactivation, OR missing required fields
  const needsProfileForm = !hasProfile || isReactivation || (hasProfile && !hasRequiredFields)
  // Only show signature-only card if profile is complete with all required fields
  const needsSignatureOnly = hasProfile && hasRequiredFields && !hasSignature && !isReactivation
  const [signatureDataURL, setSignatureDataURL] = useState<string | null>(null)

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !formData.nomeCompleto ||
      !formData.matriculaSiape ||
      !formData.cpf ||
      !formData.regime ||
      !formData.departamentoId ||
      !formData.genero
    ) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    // Validar assinatura
    if (!signatureDataURL) {
      toast({
        title: "Assinatura obrigatória",
        description: "Por favor, desenhe ou faça upload da sua assinatura antes de continuar",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      // 1. Criar perfil
      await createProfileMutation.mutateAsync({
        ...formData,
        regime: formData.regime as Regime,
        genero: formData.genero as Genero,
      })

      // 2. Salvar assinatura
      await saveSignatureMutation.mutateAsync({
        signatureData: signatureDataURL,
      })

      toast({
        title: "Sucesso!",
        description: isReactivation
          ? "Conta reativada com sucesso!"
          : "Perfil e assinatura criados com sucesso!",
      })
      await refetchOnboardingStatus()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar perfil",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveSignatureLocally = (signatureData: string) => {
    setSignatureDataURL(signatureData)
    setShowSignatureDialog(false)
    setSignatureMode("draw")
    toast({
      title: "Assinatura configurada!",
      description: "Assinatura salva localmente. Complete o formulário para finalizar.",
    })
  }

  const handleSaveFromDraw = () => {
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      const signatureDataURL = signatureRef.current.toDataURL()
      handleSaveSignatureLocally(signatureDataURL)
    } else {
      toast({
        title: "Erro",
        description: "Por favor, desenhe a assinatura antes de salvar",
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
      handleSaveSignatureLocally(result)
    }
    reader.readAsDataURL(file)
  }

  const handleClearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear()
    }
  }

  const handleContinue = () => {
    router.push("/home/professor/dashboard")
  }

  const isOnboardingComplete = hasProfile && hasRequiredFields && hasSignature

  return (
    <section className="w-full">
      <div className="space-y-8">
        {needsProfileForm && (
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-xl">
                <UserCheck className="h-5 w-5" />
                {isReactivation ? "Reativar Conta" : hasProfile && !hasRequiredFields ? "Complete seu Perfil" : "Informações do Perfil"}
              </CardTitle>
              <p className="text-sm text-gray-600">
                {isReactivation
                  ? "Sua conta foi desativada. Confirme seus dados para reativá-la."
                  : hasProfile && !hasRequiredFields
                    ? "Alguns dados obrigatórios estão faltando. Por favor, complete seu perfil."
                    : "Complete suas informações pessoais e profissionais"}
              </p>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmitProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="nomeCompleto">Nome Completo *</Label>
                    <Input id="nomeCompleto" value={formData.nomeCompleto} disabled className="mt-1 bg-gray-50" />
                    <p className="text-xs text-muted-foreground mt-1">Pré-preenchido com base no seu usuário</p>
                  </div>

                  <div>
                    <Label htmlFor="email">E-mail *</Label>
                    <Input id="email" value={user?.email || ""} disabled className="mt-1 bg-gray-50" />
                    <p className="text-xs text-muted-foreground mt-1">E-mail cadastrado no sistema</p>
                  </div>

                  <div>
                    <Label htmlFor="nomeSocial">Nome Social</Label>
                    <Input
                      id="nomeSocial"
                      value={formData.nomeSocial}
                      onChange={(e) => setFormData({ ...formData, nomeSocial: e.target.value })}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="matriculaSiape">Matrícula SIAPE *</Label>
                    <Input
                      id="matriculaSiape"
                      value={formData.matriculaSiape}
                      onChange={(e) => setFormData({ ...formData, matriculaSiape: e.target.value })}
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="cpf">CPF *</Label>
                    <Input
                      id="cpf"
                      value={formData.cpf}
                      onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                      placeholder="000.000.000-00"
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="telefone">Telefone Pessoal</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      placeholder="(xx) xxxxx-xxxx"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="telefoneInstitucional">Telefone Institucional</Label>
                    <Input
                      id="telefoneInstitucional"
                      value={formData.telefoneInstitucional}
                      onChange={(e) => setFormData({ ...formData, telefoneInstitucional: e.target.value })}
                      placeholder="(xx) xxxx-xxxx"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="genero">Gênero *</Label>
                    <Select
                      value={formData.genero}
                      onValueChange={(value: Genero) => setFormData({ ...formData, genero: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione seu gênero" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={GENERO_MASCULINO}>Masculino</SelectItem>
                        <SelectItem value={GENERO_FEMININO}>Feminino</SelectItem>
                        <SelectItem value={GENERO_OUTRO}>Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.genero === GENERO_OUTRO && (
                    <div>
                      <Label htmlFor="especificacaoGenero">Especificação de Gênero</Label>
                      <Input
                        id="especificacaoGenero"
                        value={formData.especificacaoGenero}
                        onChange={(e) => setFormData({ ...formData, especificacaoGenero: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="departamento">Departamento *</Label>
                    <Select
                      value={formData.departamentoId.toString()}
                      onValueChange={(value) => setFormData({ ...formData, departamentoId: parseInt(value) })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione seu departamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {departamentos?.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id.toString()}>
                            {dept.nome} ({dept.sigla})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="regime">Regime de Trabalho *</Label>
                    <Select
                      value={formData.regime}
                      onValueChange={(value: Regime) => setFormData({ ...formData, regime: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione o regime" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={REGIME_20H}>20 horas</SelectItem>
                        <SelectItem value={REGIME_40H}>40 horas</SelectItem>
                        <SelectItem value={REGIME_DE}>Dedicação Exclusiva</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="tipoProfessor">Tipo de Professor *</Label>
                    <Select
                      value={formData.tipoProfessor}
                      onValueChange={(value: TipoProfessor) => setFormData({ ...formData, tipoProfessor: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={TIPO_PROFESSOR_EFETIVO}>
                          {TIPO_PROFESSOR_LABELS[TIPO_PROFESSOR_EFETIVO]}
                        </SelectItem>
                        <SelectItem value={TIPO_PROFESSOR_SUBSTITUTO}>
                          {TIPO_PROFESSOR_LABELS[TIPO_PROFESSOR_SUBSTITUTO]}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Seção de Assinatura */}
                <div className="border-t pt-6 mt-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <FileSignature className="h-5 w-5" />
                      Assinatura Digital *
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Configure sua assinatura digital para assinar documentos no sistema
                    </p>
                  </div>

                  {signatureDataURL ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 text-green-800">
                          <CheckCircle className="h-5 w-5" />
                          <div>
                            <p className="font-medium">Assinatura configurada</p>
                            <p className="text-sm text-green-700">Sua assinatura foi salva com sucesso</p>
                          </div>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => setShowSignatureDialog(true)}>
                          Alterar
                        </Button>
                      </div>
                      <div className="mt-3 bg-white rounded border p-2 max-w-xs">
                        <img src={signatureDataURL} alt="Assinatura" className="w-full h-auto" />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium text-amber-800 mb-2">Assinatura obrigatória</p>
                          <p className="text-sm text-amber-700 mb-3">
                            A assinatura digital garante a autenticidade e validade legal dos documentos gerados pelo
                            sistema.
                          </p>
                          <Button
                            type="button"
                            onClick={() => setShowSignatureDialog(true)}
                            size="sm"
                            className="bg-amber-600 hover:bg-amber-700"
                          >
                            <FileSignature className="h-4 w-4 mr-2" />
                            Configurar Assinatura
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    size="lg"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmitting
                      ? isReactivation
                        ? "Reativando conta..."
                        : "Criando perfil..."
                      : isReactivation
                        ? "Reativar Conta"
                        : "Criar Perfil"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {needsSignatureOnly && (
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-xl">
                <FileSignature className="h-5 w-5" />
                Configure sua Assinatura Digital
              </CardTitle>
              <p className="text-sm text-gray-600">
                Seu perfil está completo, mas você precisa configurar sua assinatura digital para continuar.
              </p>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                {signatureDataURL ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 text-green-800">
                        <CheckCircle className="h-5 w-5" />
                        <div>
                          <p className="font-medium">Assinatura configurada</p>
                          <p className="text-sm text-green-700">Sua assinatura foi salva com sucesso</p>
                        </div>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => setShowSignatureDialog(true)}>
                        Alterar
                      </Button>
                    </div>
                    <div className="mt-3 bg-white rounded border p-2 max-w-xs">
                      <img src={signatureDataURL} alt="Assinatura" className="w-full h-auto" />
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-amber-800 mb-2">Assinatura obrigatória</p>
                        <p className="text-sm text-amber-700 mb-3">
                          A assinatura digital garante a autenticidade e validade legal dos documentos gerados pelo sistema.
                        </p>
                        <Button
                          type="button"
                          onClick={() => setShowSignatureDialog(true)}
                          size="sm"
                          className="bg-amber-600 hover:bg-amber-700"
                        >
                          <FileSignature className="h-4 w-4 mr-2" />
                          Configurar Assinatura
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  onClick={async () => {
                    if (!signatureDataURL) {
                      toast({
                        title: "Assinatura obrigatória",
                        description: "Por favor, configure sua assinatura antes de continuar",
                        variant: "destructive",
                      })
                      return
                    }
                    setIsSubmitting(true)
                    try {
                      await saveSignatureMutation.mutateAsync({ signatureData: signatureDataURL })
                      toast({
                        title: "Sucesso!",
                        description: "Assinatura salva com sucesso!",
                      })
                      await refetchOnboardingStatus()
                    } catch (error: any) {
                      toast({
                        title: "Erro",
                        description: error.message || "Erro ao salvar assinatura",
                        variant: "destructive",
                      })
                    } finally {
                      setIsSubmitting(false)
                    }
                  }}
                  disabled={isSubmitting || !signatureDataURL}
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? "Salvando..." : "Salvar Assinatura e Continuar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isOnboardingComplete && (
          <Card className="shadow-lg border-green-200 bg-green-50">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                Onboarding Concluído!
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center p-8">
              <p className="text-green-700 mb-6 text-lg">
                Parabéns! Seu perfil está completo e você já pode utilizar todas as funcionalidades do sistema.
              </p>
              <Button onClick={handleContinue} size="lg" className="bg-green-600 hover:bg-green-700 px-8">
                Continuar para o Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showSignatureDialog} onOpenChange={setShowSignatureDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configure sua Assinatura Digital</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-blue-800">
                      <p className="font-medium mb-1">Dica:</p>
                      <p>
                        Desenhe sua assinatura de forma clara e legível. Esta será sua assinatura padrão para todos os
                        documentos.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="text-sm text-muted-foreground">Selecione uma imagem da sua assinatura:</div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50 text-center">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="signature-upload"
                  />
                  <Label htmlFor="signature-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center gap-2">
                      <FileSignature className="h-12 w-12 text-gray-400" />
                      <span className="text-sm font-medium">Clique para selecionar uma imagem</span>
                      <span className="text-xs text-muted-foreground">PNG, JPG ou JPEG</span>
                    </div>
                  </Label>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-blue-800">
                      <p className="font-medium mb-1">Dica:</p>
                      <p>Selecione uma imagem clara da sua assinatura em fundo branco para melhor resultado.</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="flex justify-between">
            {signatureMode === "draw" ? (
              <Button variant="outline" onClick={handleClearSignature}>
                Limpar
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSignatureDialog(false)
                  setSignatureMode("draw")
                }}
              >
                Cancelar
              </Button>
              {signatureMode === "draw" && (
                <Button onClick={handleSaveFromDraw} disabled={isSubmitting}>
                  {isSubmitting ? "Salvando..." : "Salvar Assinatura"}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}
