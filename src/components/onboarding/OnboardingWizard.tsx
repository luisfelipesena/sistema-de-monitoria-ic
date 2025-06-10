"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileUploader } from "@/components/ui/FileUploader"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserRole } from "@/types/enums"
import { api } from "@/utils/api"
import { CheckCircle, FileText, Upload, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

interface OnboardingWizardProps {
  userId?: number
  userRole: UserRole
  invitationData?: {
    email: string
    token: string
  }
}

export function OnboardingWizard({ userId, userRole, invitationData }: OnboardingWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<any>(invitationData ? { emailInstitucional: invitationData.email } : {})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: onboardingStatus, refetch } = api.onboarding.getStatus.useQuery(
    { userId: userId! },
    { enabled: !!userId }
  )
  const { data: cursos } = api.curso.list.useQuery({})
  const { data: departamentos } = api.departamento.list.useQuery()

  const completeStudentOnboarding = api.onboarding.completeStudentOnboarding.useMutation({
    onSuccess: () => {
      toast.success("Perfil criado com sucesso!")
      refetch()
      router.push("/dashboard")
    },
    onError: (error) => {
      toast.error("Erro ao criar perfil", { description: error.message })
    },
  })

  const completeProfessorOnboarding = api.onboarding.completeProfessorOnboarding.useMutation({
    onSuccess: () => {
      toast.success("Perfil criado com sucesso!")
      refetch()
      router.push("/dashboard")
    },
    onError: (error) => {
      toast.error("Erro ao criar perfil", { description: error.message })
    },
  })

  const acceptInvitationAndOnboard = api.onboarding.acceptInvitationAndOnboard.useMutation({
    onSuccess: () => {
      toast.success("Convite aceito e perfil criado com sucesso!")
      router.push("/dashboard")
    },
    onError: (error: { message: string }) => {
      toast.error("Erro ao aceitar convite", { description: error.message })
    },
  })

  const uploadFile = async (file: File, tipo: string): Promise<string> => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("tipo", tipo)

    const response = await fetch("/api/files/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error("Falha no upload")
    }

    const result = await response.json()
    return result.fileId
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (userRole === UserRole.STUDENT) {
      if (!formData.comprovanteMatriculaFileId) {
        toast.error("Por favor, faça upload do comprovante de matrícula")
        return
      }
      if (!userId) {
        toast.error("ID de usuário não encontrado.")
        return
      }

      setIsSubmitting(true)
      try {
        await completeStudentOnboarding.mutateAsync({
          userId,
          ...formData,
        })
      } finally {
        setIsSubmitting(false)
      }
    } else if (userRole === UserRole.PROFESSOR) {
      setIsSubmitting(true)
      try {
        if (invitationData) {
          await acceptInvitationAndOnboard.mutateAsync({
            ...formData,
            token: invitationData.token,
          })
        } else if (userId) {
          await completeProfessorOnboarding.mutateAsync({
            userId,
            ...formData,
          })
        }
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  if (userId && onboardingStatus?.isComplete) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <CardTitle>Perfil Completo!</CardTitle>
          <CardDescription>Seu perfil foi configurado com sucesso. Você pode acessar o sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push("/dashboard")} className="w-full">
            Ir para Dashboard
          </Button>
        </CardContent>
      </Card>
    )
  }

  const steps = [
    { id: 1, title: "Informações Pessoais", icon: User },
    { id: 2, title: "Documentos", icon: FileText },
  ]

  if (userRole === UserRole.STUDENT) {
    steps.push({ id: 3, title: "Endereço", icon: Upload })
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.id ? "bg-blue-600 border-blue-600 text-white" : "border-gray-300 text-gray-400"
                }`}
              >
                <step.icon className="w-5 h-5" />
              </div>
              <span className={`ml-2 text-sm ${currentStep >= step.id ? "text-blue-600" : "text-gray-400"}`}>
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${currentStep > step.id ? "bg-blue-600" : "bg-gray-300"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleFormSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Configurar Perfil - {userRole === UserRole.STUDENT ? "Estudante" : "Professor"}</CardTitle>
            <CardDescription>Preencha as informações necessárias para completar seu perfil</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nomeCompleto">Nome Completo *</Label>
                    <Input
                      id="nomeCompleto"
                      value={formData.nomeCompleto || ""}
                      onChange={(e) => setFormData({ ...formData, nomeCompleto: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="emailInstitucional">Email Institucional *</Label>
                    <Input
                      id="emailInstitucional"
                      type="email"
                      value={formData.emailInstitucional || ""}
                      onChange={(e) => setFormData({ ...formData, emailInstitucional: e.target.value })}
                      required
                      disabled={!!invitationData}
                    />
                  </div>
                </div>

                {userRole === UserRole.STUDENT ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="matricula">Matrícula *</Label>
                        <Input
                          id="matricula"
                          value={formData.matricula || ""}
                          onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="cpf">CPF *</Label>
                        <Input
                          id="cpf"
                          value={formData.cpf || ""}
                          onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="cr">Coeficiente de Rendimento *</Label>
                        <Input
                          id="cr"
                          type="number"
                          step="0.01"
                          min="0"
                          max="10"
                          value={formData.cr || ""}
                          onChange={(e) => setFormData({ ...formData, cr: parseFloat(e.target.value) })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="cursoId">Curso *</Label>
                        <Select
                          value={formData.cursoId?.toString()}
                          onValueChange={(value) => setFormData({ ...formData, cursoId: parseInt(value) })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione seu curso" />
                          </SelectTrigger>
                          <SelectContent>
                            {cursos?.map((curso) => (
                              <SelectItem key={curso.id} value={curso.id.toString()}>
                                {curso.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="genero">Gênero</Label>
                      <Select
                        value={formData.genero || "OUTRO"}
                        onValueChange={(value) => setFormData({ ...formData, genero: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione seu gênero" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MASCULINO">Masculino</SelectItem>
                          <SelectItem value="FEMININO">Feminino</SelectItem>
                          <SelectItem value="OUTRO">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="matriculaSiape">SIAPE *</Label>
                        <Input
                          id="matriculaSiape"
                          value={formData.matriculaSiape || ""}
                          onChange={(e) => setFormData({ ...formData, matriculaSiape: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="cpf">CPF *</Label>
                        <Input
                          id="cpf"
                          value={formData.cpf || ""}
                          onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="departamentoId">Departamento *</Label>
                        <Select
                          value={formData.departamentoId?.toString()}
                          onValueChange={(value) => setFormData({ ...formData, departamentoId: parseInt(value) })}
                        >
                          <SelectTrigger>
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
                        <Label htmlFor="regime">Regime de Trabalho</Label>
                        <Select
                          value={formData.regime || "DE"}
                          onValueChange={(value) => setFormData({ ...formData, regime: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o regime" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="20H">20 Horas</SelectItem>
                            <SelectItem value="40H">40 Horas</SelectItem>
                            <SelectItem value="DE">Dedicação Exclusiva</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="genero">Gênero</Label>
                      <Select
                        value={formData.genero || "OUTRO"}
                        onValueChange={(value) => setFormData({ ...formData, genero: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione seu gênero" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MASCULINO">Masculino</SelectItem>
                          <SelectItem value="FEMININO">Feminino</SelectItem>
                          <SelectItem value="OUTRO">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="telefoneInstitucional">Telefone Institucional</Label>
                      <Input
                        id="telefoneInstitucional"
                        value={formData.telefoneInstitucional || ""}
                        onChange={(e) => setFormData({ ...formData, telefoneInstitucional: e.target.value })}
                      />
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone || ""}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && userRole === UserRole.STUDENT && (
              <div className="space-y-4">
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    Faça upload dos documentos necessários para completar sua inscrição.
                  </AlertDescription>
                </Alert>

                <div>
                  <Label>Comprovante de Matrícula *</Label>
                  <FileUploader
                    onFileSelect={async (file) => {
                      if (file) {
                        try {
                          setIsSubmitting(true)
                          const fileId = await uploadFile(file, "comprovante_matricula")
                          setFormData({ ...formData, comprovanteMatriculaFileId: fileId })
                          toast.success("Comprovante de matrícula enviado com sucesso!")
                        } catch (error) {
                          console.error("Upload error:", error)
                          toast.error("Erro ao fazer upload do arquivo")
                        } finally {
                          setIsSubmitting(false)
                        }
                      }
                    }}
                    allowedTypes={["application/pdf", "image/png", "image/jpeg"]}
                    maxSizeInMB={5}
                  />
                  {formData.comprovanteMatriculaFileId && (
                    <p className="text-sm text-green-600 mt-1">✓ Arquivo enviado</p>
                  )}
                </div>

                <div>
                  <Label>Histórico Escolar (Opcional)</Label>
                  <FileUploader
                    onFileSelect={async (file) => {
                      if (file) {
                        try {
                          setIsSubmitting(true)
                          const fileId = await uploadFile(file, "historico_escolar")
                          setFormData({ ...formData, historicoEscolarFileId: fileId })
                          toast.success("Histórico escolar enviado com sucesso!")
                        } catch (error) {
                          console.error("Upload error:", error)
                          toast.error("Erro ao fazer upload do arquivo")
                        } finally {
                          setIsSubmitting(false)
                        }
                      }
                    }}
                    allowedTypes={["application/pdf"]}
                    maxSizeInMB={10}
                  />
                  {formData.historicoEscolarFileId && <p className="text-sm text-green-600 mt-1">✓ Arquivo enviado</p>}
                </div>
              </div>
            )}

            {currentStep === 3 && userRole === UserRole.STUDENT && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rua">Rua</Label>
                    <Input
                      id="rua"
                      value={formData.endereco?.rua || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          endereco: { ...formData.endereco, rua: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="numero">Número</Label>
                    <Input
                      id="numero"
                      type="number"
                      value={formData.endereco?.numero || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          endereco: { ...formData.endereco, numero: parseInt(e.target.value) },
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="bairro">Bairro</Label>
                    <Input
                      id="bairro"
                      value={formData.endereco?.bairro || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          endereco: { ...formData.endereco, bairro: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      value={formData.endereco?.cidade || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          endereco: { ...formData.endereco, cidade: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="estado">Estado</Label>
                    <Input
                      id="estado"
                      value={formData.endereco?.estado || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          endereco: { ...formData.endereco, estado: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cep">CEP</Label>
                    <Input
                      id="cep"
                      value={formData.endereco?.cep || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          endereco: { ...formData.endereco, cep: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="complemento">Complemento</Label>
                    <Input
                      id="complemento"
                      value={formData.endereco?.complemento || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          endereco: { ...formData.endereco, complemento: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-6">
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                  Anterior
                </Button>
              )}

              <div className="flex-1" />

              {currentStep < steps.length ? (
                <Button type="button" onClick={() => setCurrentStep(currentStep + 1)}>
                  Próximo
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Criando..." : "Finalizar Perfil"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
