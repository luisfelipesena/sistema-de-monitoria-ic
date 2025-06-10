"use client"

import { PagesLayout } from "@/components/layout/PagesLayout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileUploader } from "@/components/ui/FileUploader"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserRole } from "@/types/enums"
import { api } from "@/utils/api"
import {
  Building2,
  Camera,
  CheckCircle,
  FileText,
  GraduationCap,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  Shield,
  Signature,
  User,
  XCircle,
} from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export const dynamic = "force-dynamic"

interface StudentFormData {
  nomeCompleto: string
  emailInstitucional: string
  telefone: string
  endereco: {
    rua: string
    numero: string
    bairro: string
    cidade: string
    estado: string
    cep: string
    complemento?: string
  }
}

interface ProfessorFormData {
  nomeCompleto: string
  emailInstitucional: string
  telefone: string
  telefoneInstitucional: string
  matriculaSiape: string
}

export default function ProfilePage() {
  const { data: user, isLoading: userLoading } = api.auth.me.useQuery()
  const [activeTab, setActiveTab] = useState("profile")
  const [formData, setFormData] = useState<StudentFormData | ProfessorFormData>({
    nomeCompleto: "",
    emailInstitucional: "",
    telefone: "",
  } as StudentFormData | ProfessorFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: studentProfile, isLoading: studentLoading } = api.student.getProfile.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user && user.role === UserRole.STUDENT }
  )

  const { data: professorProfile, isLoading: professorLoading } = api.professor.getProfile.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user && user.role === UserRole.PROFESSOR }
  )

  const { data: cursos } = api.curso.list.useQuery({})
  const { data: departamentos } = api.departamento.list.useQuery()

  const updateStudentProfile = api.student.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Perfil atualizado com sucesso!")
    },
    onError: (error) => {
      toast.error("Erro ao atualizar perfil", { description: error.message })
    },
  })

  const updateStudentDocuments = api.student.updateStudentDocuments.useMutation({
    onSuccess: () => {
      toast.success("Documentos atualizados com sucesso!")
    },
    onError: (error) => {
      toast.error("Erro ao atualizar documentos", { description: error.message })
    },
  })

  const updateProfessorProfile = api.professor.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Perfil atualizado com sucesso!")
    },
    onError: (error) => {
      toast.error("Erro ao atualizar perfil", { description: error.message })
    },
  })

  useEffect(() => {
    if (user?.role === UserRole.STUDENT && studentProfile) {
      setFormData({
        nomeCompleto: studentProfile.nomeCompleto,
        emailInstitucional: studentProfile.emailInstitucional,
        telefone: studentProfile.telefone || "",
        endereco: {
          rua: studentProfile.endereco?.rua || "",
          numero: studentProfile.endereco?.numero?.toString() || "",
          bairro: studentProfile.endereco?.bairro || "",
          cidade: studentProfile.endereco?.cidade || "",
          estado: studentProfile.endereco?.estado || "",
          cep: studentProfile.endereco?.cep || "",
          complemento: studentProfile.endereco?.complemento || "",
        },
      } as StudentFormData)
    } else if (user?.role === UserRole.PROFESSOR && professorProfile) {
      setFormData({
        nomeCompleto: professorProfile.nomeCompleto,
        emailInstitucional: professorProfile.emailInstitucional,
        telefone: professorProfile.telefone || "",
        telefoneInstitucional: professorProfile.telefoneInstitucional || "",
        matriculaSiape: professorProfile.matriculaSiape || "",
      } as ProfessorFormData)
    }
  }, [user, studentProfile, professorProfile])

  const handleSaveProfile = async () => {
    if (!user) return

    setIsSubmitting(true)
    try {
      if (user.role === UserRole.STUDENT) {
        const studentData = formData as StudentFormData
        await updateStudentProfile.mutateAsync({
          userId: user.id,
          nomeCompleto: studentData.nomeCompleto,
          emailInstitucional: studentData.emailInstitucional,
          telefone: studentData.telefone,
          endereco: {
            ...studentData.endereco,
            numero: parseInt(studentData.endereco.numero) || undefined,
          },
        })
      } else if (user.role === UserRole.PROFESSOR) {
        const professorData = formData as ProfessorFormData
        await updateProfessorProfile.mutateAsync({
          userId: user.id,
          nomeCompleto: professorData.nomeCompleto,
          emailInstitucional: professorData.emailInstitucional,
          telefone: professorData.telefone,
          telefoneInstitucional: professorData.telefoneInstitucional,
          matriculaSiape: professorData.matriculaSiape,
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveDocuments = async (documentData: any) => {
    if (!user) return

    setIsSubmitting(true)
    try {
      await updateStudentDocuments.mutateAsync({
        userId: user.id,
        ...documentData,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (userLoading || studentLoading || professorLoading) {
    return (
      <PagesLayout title="Meu Perfil" subtitle="Gerencie suas informações pessoais">
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Carregando informações do perfil...</p>
          </div>
        </div>
      </PagesLayout>
    )
  }

  if (!user) {
    return null
  }

  return (
    <PagesLayout title="Meu Perfil" subtitle="Gerencie suas informações pessoais">
      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="relative mx-auto w-24 h-24">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                      {user.username?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 h-8 w-8 rounded-full p-0"
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">
                      {user.role === UserRole.STUDENT
                        ? studentProfile?.nomeCompleto
                        : professorProfile?.nomeCompleto || user.username}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {user.role === UserRole.STUDENT ? "Estudante" : "Professor"}
                    </Badge>
                  </div>

                  <Separator />

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{user.email}</span>
                    </div>

                    {user.role === UserRole.STUDENT && studentProfile && (
                      <>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <GraduationCap className="w-4 h-4" />
                          <span className="truncate">{studentProfile.curso?.nome || "Curso não definido"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="w-4 h-4" />
                          <span>Matrícula: {studentProfile.matricula}</span>
                        </div>
                      </>
                    )}

                    {user.role === UserRole.PROFESSOR && professorProfile && (
                      <>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Building2 className="w-4 h-4" />
                          <span className="truncate">
                            {professorProfile.departamento?.nome || "Departamento não definido"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Shield className="w-4 h-4" />
                          <span>SIAPE: {professorProfile.matriculaSiape}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 h-12">
                <TabsTrigger
                  value="profile"
                  className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <User className="w-4 h-4" />
                  Informações Pessoais
                </TabsTrigger>
                {user.role === UserRole.STUDENT && (
                  <TabsTrigger
                    value="documents"
                    className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <FileText className="w-4 h-4" />
                    Documentos
                  </TabsTrigger>
                )}
                <TabsTrigger
                  value="signature"
                  className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Signature className="w-4 h-4" />
                  Assinatura Digital
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-6">
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5 text-primary" />
                      <div>
                        <CardTitle>Informações Pessoais</CardTitle>
                        <CardDescription>Atualize suas informações de perfil</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="nomeCompleto" className="text-sm font-medium">
                            Nome Completo
                          </Label>
                          <Input
                            id="nomeCompleto"
                            value={formData.nomeCompleto || ""}
                            onChange={(e) => setFormData({ ...formData, nomeCompleto: e.target.value })}
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="emailInstitucional" className="text-sm font-medium">
                            Email Institucional
                          </Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="emailInstitucional"
                              type="email"
                              value={formData.emailInstitucional || ""}
                              onChange={(e) => setFormData({ ...formData, emailInstitucional: e.target.value })}
                              className="pl-10 h-10"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="telefone" className="text-sm font-medium">
                            Telefone Pessoal
                          </Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="telefone"
                              value={formData.telefone || ""}
                              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                              className="pl-10 h-10"
                              placeholder="(71) 9999-9999"
                            />
                          </div>
                        </div>

                        {user.role === UserRole.PROFESSOR && (
                          <div className="space-y-2">
                            <Label htmlFor="telefoneInstitucional" className="text-sm font-medium">
                              Telefone Institucional
                            </Label>
                            <div className="relative">
                              <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="telefoneInstitucional"
                                value={(formData as ProfessorFormData).telefoneInstitucional || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    telefoneInstitucional: e.target.value,
                                  } as ProfessorFormData)
                                }
                                className="pl-10 h-10"
                                placeholder="(71) 3283-0000"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {user.role === UserRole.STUDENT && (
                      <>
                        <Separator />
                        <div className="space-y-6">
                          <div className="flex items-center gap-2">
                            <GraduationCap className="w-5 h-5 text-primary" />
                            <h3 className="text-lg font-semibold">Informações Acadêmicas</h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Matrícula</Label>
                              <Input value={studentProfile?.matricula || ""} disabled className="bg-muted h-10" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">CPF</Label>
                              <Input value={studentProfile?.cpf || ""} disabled className="bg-muted h-10" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Coeficiente de Rendimento</Label>
                              <Input value={studentProfile?.cr || ""} disabled className="bg-muted h-10" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Curso</Label>
                              <Input value={studentProfile?.curso?.nome || ""} disabled className="bg-muted h-10" />
                            </div>
                          </div>
                        </div>

                        <Separator />
                        <div className="space-y-6">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-primary" />
                            <h3 className="text-lg font-semibold">Endereço</h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label htmlFor="rua" className="text-sm font-medium">
                                Rua
                              </Label>
                              <Input
                                id="rua"
                                value={(formData as StudentFormData).endereco?.rua || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    endereco: { ...(formData as StudentFormData).endereco, rua: e.target.value },
                                  } as StudentFormData)
                                }
                                className="h-10"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="numero" className="text-sm font-medium">
                                Número
                              </Label>
                              <Input
                                id="numero"
                                value={(formData as StudentFormData).endereco?.numero || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    endereco: { ...(formData as StudentFormData).endereco, numero: e.target.value },
                                  } as StudentFormData)
                                }
                                className="h-10"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="bairro" className="text-sm font-medium">
                                Bairro
                              </Label>
                              <Input
                                id="bairro"
                                value={(formData as StudentFormData).endereco?.bairro || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    endereco: { ...(formData as StudentFormData).endereco, bairro: e.target.value },
                                  } as StudentFormData)
                                }
                                className="h-10"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="cidade" className="text-sm font-medium">
                                Cidade
                              </Label>
                              <Input
                                id="cidade"
                                value={(formData as StudentFormData).endereco?.cidade || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    endereco: { ...(formData as StudentFormData).endereco, cidade: e.target.value },
                                  } as StudentFormData)
                                }
                                className="h-10"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="estado" className="text-sm font-medium">
                                Estado
                              </Label>
                              <Input
                                id="estado"
                                value={(formData as StudentFormData).endereco?.estado || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    endereco: { ...(formData as StudentFormData).endereco, estado: e.target.value },
                                  } as StudentFormData)
                                }
                                className="h-10"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="cep" className="text-sm font-medium">
                                CEP
                              </Label>
                              <Input
                                id="cep"
                                value={(formData as StudentFormData).endereco?.cep || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    endereco: { ...(formData as StudentFormData).endereco, cep: e.target.value },
                                  } as StudentFormData)
                                }
                                className="h-10"
                                placeholder="00000-000"
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {user.role === UserRole.PROFESSOR && (
                      <>
                        <Separator />
                        <div className="space-y-6">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-primary" />
                            <h3 className="text-lg font-semibold">Informações Profissionais</h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">SIAPE</Label>
                              <Input
                                value={professorProfile?.matriculaSiape || ""}
                                disabled
                                className="bg-muted h-10"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Regime</Label>
                              <Input value={professorProfile?.regime || ""} disabled className="bg-muted h-10" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Departamento</Label>
                              <Input
                                value={professorProfile?.departamento?.nome || ""}
                                disabled
                                className="bg-muted h-10"
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    <Separator />
                    <div className="flex justify-end pt-4">
                      <Button onClick={handleSaveProfile} disabled={isSubmitting} size="lg" className="min-w-[140px]">
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Salvar Alterações
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {user.role === UserRole.STUDENT && (
                <TabsContent value="documents" className="space-y-6">
                  <Card>
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        <div>
                          <CardTitle>Documentos Acadêmicos</CardTitle>
                          <CardDescription>Gerencie e atualize seus documentos</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-8">
                      <div className="grid gap-8">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="text-base font-semibold">Comprovante de Matrícula</Label>
                              <p className="text-sm text-muted-foreground mt-1">
                                Documento que comprova sua matrícula ativa na instituição
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {studentProfile?.comprovanteMatriculaFileId ? (
                                <Badge variant="default" className="gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Enviado
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="gap-1">
                                  <XCircle className="w-3 h-3" />
                                  Pendente
                                </Badge>
                              )}
                            </div>
                          </div>

                          <Card className="border-dashed border-2">
                            <CardContent className="p-6">
                              <FileUploader
                                onFileSelect={async (file) => {
                                  if (file) {
                                    try {
                                      setIsSubmitting(true)

                                      const formData = new FormData()
                                      formData.append("file", file)
                                      formData.append("tipo", "comprovante_matricula")

                                      const response = await fetch("/api/files/upload", {
                                        method: "POST",
                                        body: formData,
                                      })

                                      if (!response.ok) {
                                        throw new Error("Falha no upload")
                                      }

                                      const result = await response.json()
                                      await handleSaveDocuments({ comprovanteMatriculaFileId: result.fileId })
                                      toast.success("Comprovante de matrícula atualizado com sucesso!")
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
                            </CardContent>
                          </Card>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="text-base font-semibold">Histórico Escolar</Label>
                              <p className="text-sm text-muted-foreground mt-1">
                                Histórico acadêmico completo com notas e disciplinas cursadas
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {studentProfile?.comprovanteResidenciaFileId ? (
                                <Badge variant="default" className="gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Enviado
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="gap-1">
                                  <XCircle className="w-3 h-3" />
                                  Pendente
                                </Badge>
                              )}
                            </div>
                          </div>

                          <Card className="border-dashed border-2">
                            <CardContent className="p-6">
                              <FileUploader
                                onFileSelect={async (file) => {
                                  if (file) {
                                    try {
                                      setIsSubmitting(true)

                                      const formData = new FormData()
                                      formData.append("file", file)
                                      formData.append("tipo", "historico_escolar")

                                      const response = await fetch("/api/files/upload", {
                                        method: "POST",
                                        body: formData,
                                      })

                                      if (!response.ok) {
                                        throw new Error("Falha no upload")
                                      }

                                      const result = await response.json()
                                      await handleSaveDocuments({ comprovanteResidenciaFileId: result.fileId })
                                      toast.success("Histórico escolar atualizado com sucesso!")
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
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              <TabsContent value="signature">
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                      <Signature className="w-5 h-5 text-primary" />
                      <div>
                        <CardTitle>Assinatura Digital</CardTitle>
                        <CardDescription>Configure sua assinatura digital para documentos oficiais</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-16 space-y-4">
                      <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                        <Signature className="w-10 h-10 text-muted-foreground" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold">Assinatura Digital</h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                          Esta funcionalidade permitirá que você assine documentos digitalmente de forma segura e
                          oficial.
                        </p>
                      </div>
                      <Badge variant="outline" className="mt-4">
                        Em Desenvolvimento
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </PagesLayout>
  )
}
