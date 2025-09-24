"use client"

import { PasswordManager } from "@/components/features/profile/PasswordManager"
import { UserSignatureManager } from "@/components/features/profile/UserSignatureManager"
import { PagesLayout } from "@/components/layout/PagesLayout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileUploadField } from "@/components/ui/FileUploadField"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/utils/api"
import { formatUsernameToProperName } from "@/utils/username-formatter"
import { Eye, FileText, Upload } from "lucide-react"
import { useEffect, useState } from "react"

export default function ProfilePage() {
  const { user } = useAuth()
  const { toast } = useToast()

  if (!user) {
    return (
      <PagesLayout title="Perfil" subtitle="Carregando...">
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      </PagesLayout>
    )
  }

  if (user.role === "student") {
    return <StudentProfile />
  } else if (user.role === "professor") {
    return <ProfessorProfile />
  } else {
    return <AdminProfile />
  }
}

function AdminProfile() {
  const { user } = useAuth()

  return (
    <PagesLayout title="Perfil" subtitle="Perfil do administrador">
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Administrador</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input value={formatUsernameToProperName(user?.username || "")} disabled className="bg-gray-50" />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={user?.email || ""} disabled className="bg-gray-50" />
              </div>
              <div>
                <Label>Função</Label>
                <Input value="Administrador" disabled className="bg-gray-50" />
              </div>
            </div>
          </CardContent>
        </Card>

        <UserSignatureManager />
        <PasswordManager />
      </div>
    </PagesLayout>
  )
}

function StudentProfile() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    nomeCompleto: "",
    matricula: "",
    cpf: "",
    cursoId: 0,
    cr: 0,
    banco: "",
    agencia: "",
    conta: "",
    digitoConta: "",
  })

  const { data: userProfile, isLoading } = api.user.getProfile.useQuery()
  const { data: cursos } = api.course.getCourses.useQuery({ includeStats: false })
  const updateProfileMutation = api.user.updateProfile.useMutation()

  const aluno = userProfile?.studentProfile

  useEffect(() => {
    if (aluno) {
      setFormData({
        nomeCompleto: aluno.nomeCompleto || "",
        matricula: aluno.matricula || "",
        cpf: aluno.cpf || "",
        cursoId: aluno.cursoId || 0,
        cr: aluno.cr || 0,
        banco: aluno.banco || "",
        agencia: aluno.agencia || "",
        conta: aluno.conta || "",
        digitoConta: aluno.digitoConta || "",
      })
    }
  }, [aluno])

  const handleSave = async () => {
    try {
      await updateProfileMutation.mutateAsync({
        studentData: {
          nomeCompleto: formData.nomeCompleto,
          matricula: formData.matricula,
          cpf: formData.cpf,
          cursoId: formData.cursoId,
          cr: formData.cr,
          banco: formData.banco,
          agencia: formData.agencia,
          conta: formData.conta,
          digitoConta: formData.digitoConta,
        },
      })

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso",
      })

      setIsEditing(false)
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Não foi possível atualizar o perfil",
        variant: "destructive",
      })
    }
  }

  const handleCancel = () => {
    if (aluno) {
      setFormData({
        nomeCompleto: aluno.nomeCompleto || "",
        matricula: aluno.matricula || "",
        cpf: aluno.cpf || "",
        cursoId: aluno.cursoId || 0,
        cr: aluno.cr || 0,
        banco: aluno.banco || "",
        agencia: aluno.agencia || "",
        conta: aluno.conta || "",
        digitoConta: aluno.digitoConta || "",
      })
    }
    setIsEditing(false)
  }

  if (isLoading) {
    return (
      <PagesLayout title="Meu Perfil" subtitle="Carregando seus dados...">
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      </PagesLayout>
    )
  }

  return (
    <PagesLayout title="Meu Perfil" subtitle="Gerencie suas informações pessoais">
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Dados Pessoais</CardTitle>
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)}>Editar</Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleCancel}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave}>Salvar</Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nomeCompleto">Nome Completo</Label>
                <Input
                  id="nomeCompleto"
                  value={formData.nomeCompleto}
                  onChange={(e) => setFormData({ ...formData, nomeCompleto: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <Label htmlFor="matricula">Matrícula</Label>
                <Input
                  id="matricula"
                  value={formData.matricula}
                  onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" value={user?.email || ""} disabled className="bg-gray-50" />
              </div>

              <div>
                <Label htmlFor="curso">Curso</Label>
                <Select
                  value={formData.cursoId.toString()}
                  onValueChange={(value) => setFormData({ ...formData, cursoId: parseInt(value) })}
                >
                  <SelectTrigger disabled={!isEditing}>
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

              <div>
                <Label htmlFor="cr">CR (Coeficiente de Rendimento)</Label>
                <Input
                  id="cr"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={formData.cr}
                  onChange={(e) => setFormData({ ...formData, cr: parseFloat(e.target.value) })}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados Bancários (para Bolsistas)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="banco">Banco</Label>
                <Input
                  id="banco"
                  value={formData.banco}
                  onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Ex: Banco do Brasil"
                />
              </div>
              <div>
                <Label htmlFor="agencia">Agência</Label>
                <Input
                  id="agencia"
                  value={formData.agencia}
                  onChange={(e) => setFormData({ ...formData, agencia: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Ex: 1234-5"
                />
              </div>
              <div>
                <Label htmlFor="conta">Conta Corrente</Label>
                <Input
                  id="conta"
                  value={formData.conta}
                  onChange={(e) => setFormData({ ...formData, conta: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Ex: 12345-6"
                />
              </div>
              <div>
                <Label htmlFor="digitoConta">Dígito</Label>
                <Input
                  id="digitoConta"
                  value={formData.digitoConta}
                  onChange={(e) => setFormData({ ...formData, digitoConta: e.target.value })}
                  disabled={!isEditing}
                  maxLength={2}
                  placeholder="Ex: 7"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <DocumentsSection />
        <UserSignatureManager />
        <PasswordManager />
      </div>
    </PagesLayout>
  )
}

function ProfessorProfile() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    nomeCompleto: "",
    matriculaSiape: "",
    cpf: "",
    telefone: "",
    telefoneInstitucional: "",
    regime: "" as "20H" | "40H" | "DE" | "",
  })

  const { data: userProfile, isLoading } = api.user.getProfile.useQuery()
  const updateProfileMutation = api.user.updateProfile.useMutation()

  const professor = userProfile?.professorProfile

  useEffect(() => {
    if (professor) {
      setFormData({
        nomeCompleto: professor.nomeCompleto || "",
        matriculaSiape: professor.matriculaSiape || "",
        cpf: professor.cpf || "",
        telefone: professor.telefone || "",
        telefoneInstitucional: professor.telefoneInstitucional || "",
        regime: professor.regime || "",
      })
    }
  }, [professor])

  const handleSave = async () => {
    try {
      if (!formData.regime) {
        toast({
          title: "Campo obrigatório",
          description: "Por favor, selecione um regime de trabalho",
          variant: "destructive",
        })
        return
      }

      await updateProfileMutation.mutateAsync({
        professorData: {
          nomeCompleto: formData.nomeCompleto,
          cpf: formData.cpf,
          telefone: formData.telefone,
          telefoneInstitucional: formData.telefoneInstitucional,
          regime: formData.regime as "20H" | "40H" | "DE",
        },
      })

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso",
      })

      setIsEditing(false)
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Não foi possível atualizar o perfil",
        variant: "destructive",
      })
    }
  }

  const handleCancel = () => {
    if (professor) {
      setFormData({
        nomeCompleto: professor.nomeCompleto || "",
        matriculaSiape: professor.matriculaSiape || "",
        cpf: professor.cpf || "",
        telefone: professor.telefone || "",
        telefoneInstitucional: professor.telefoneInstitucional || "",
        regime: professor.regime || "",
      })
    }
    setIsEditing(false)
  }

  if (isLoading) {
    return (
      <PagesLayout title="Meu Perfil" subtitle="Carregando seus dados...">
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      </PagesLayout>
    )
  }

  return (
    <PagesLayout title="Meu Perfil" subtitle="Gerencie suas informações pessoais">
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Dados Pessoais</CardTitle>
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)}>Editar</Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleCancel}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave}>Salvar</Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nomeCompleto">Nome Completo</Label>
                <Input
                  id="nomeCompleto"
                  value={formData.nomeCompleto}
                  onChange={(e) => setFormData({ ...formData, nomeCompleto: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <Label htmlFor="matriculaSiape">Matrícula SIAPE</Label>
                <Input
                  id="matriculaSiape"
                  value={formData.matriculaSiape}
                  onChange={(e) => setFormData({ ...formData, matriculaSiape: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" value={user?.email || ""} disabled className="bg-gray-50" />
              </div>

              <div>
                <Label htmlFor="telefone">Telefone Pessoal</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  disabled={!isEditing}
                  placeholder="(xx) xxxxx-xxxx"
                />
              </div>

              <div>
                <Label htmlFor="telefoneInstitucional">Telefone Institucional</Label>
                <Input
                  id="telefoneInstitucional"
                  value={formData.telefoneInstitucional}
                  onChange={(e) => setFormData({ ...formData, telefoneInstitucional: e.target.value })}
                  disabled={!isEditing}
                  placeholder="(xx) xxxx-xxxx"
                />
              </div>

              <div>
                <Label htmlFor="regime">Regime de Trabalho</Label>
                <Select
                  value={formData.regime}
                  onValueChange={(value: "20H" | "40H" | "DE") => setFormData({ ...formData, regime: value })}
                >
                  <SelectTrigger disabled={!isEditing}>
                    <SelectValue placeholder="Selecione o regime" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20H">20 horas</SelectItem>
                    <SelectItem value="40H">40 horas</SelectItem>
                    <SelectItem value="DE">Dedicação Exclusiva</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <DocumentsSection />
        <UserSignatureManager />
        <PasswordManager />
      </div>
    </PagesLayout>
  )
}

function DocumentsSection() {
  const { user } = useAuth()
  const { toast } = useToast()

  const isStudent = user?.role === "student"
  const isProfessor = user?.role === "professor"
  const isAdmin = user?.role === "admin"

  const { data: userProfile, refetch: refetchProfile } = api.user.getProfile.useQuery()
  const updateDocumentMutation = api.onboarding.updateDocument.useMutation()
  const getPresignedUrlMutation = api.file.getPresignedUrlMutation.useMutation()

  if (!isStudent && !isProfessor && !isAdmin) {
    return null
  }

  const handleDocumentUpload = async (docType: string, fileId: string, fileName: string) => {
    try {
      await updateDocumentMutation.mutateAsync({
        documentType: docType as
          | "comprovante_matricula"
          | "historico_escolar"
          | "curriculum_vitae"
          | "comprovante_vinculo",
        fileId,
      })

      toast({
        title: "Documento atualizado",
        description: `${fileName} foi enviado com sucesso.`,
      })

      await refetchProfile()
    } catch (error: any) {
      toast({
        title: "Erro ao enviar documento",
        description: error.message || "Não foi possível enviar o documento.",
        variant: "destructive",
      })
    }
  }

  const handleViewDocument = async (fileId: string, docName: string) => {
    try {
      toast({
        title: "Preparando visualização...",
        description: `Abrindo ${docName}`,
      })

      const url = await getPresignedUrlMutation.mutateAsync({
        fileId: fileId,
        action: "view",
      })

      const newWindow = window.open(url, "_blank", "noopener,noreferrer")
      if (!newWindow) {
        toast({
          title: "Popup bloqueado",
          description: "Permita popups para visualizar o documento em nova aba.",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Documento aberto",
        description: "O documento foi aberto em nova aba.",
      })
    } catch (error: any) {
      toast({
        title: "Erro ao abrir documento",
        description: "Não foi possível abrir o documento para visualização.",
        variant: "destructive",
      })
      console.error("View document error:", error)
    }
  }

  const getRequiredDocuments = () => {
    if (isStudent) {
      return [
        {
          id: "historico_escolar",
          name: "Histórico Escolar",
          description: "Histórico escolar atualizado",
          required: true,
        },
        {
          id: "comprovante_matricula",
          name: "Comprovante de Matrícula",
          description: "Comprovante de matrícula atual",
          required: true,
        },
      ]
    }

    if (isProfessor) {
      return [
        {
          id: "curriculum_vitae",
          name: "Curriculum Vitae",
          description: "CV atualizado",
          required: true,
        },
        {
          id: "comprovante_vinculo",
          name: "Comprovante de Vínculo",
          description: "Comprovante de vínculo institucional",
          required: true,
        },
      ]
    }

    return []
  }

  const documents = getRequiredDocuments()

  const getCurrentFileId = (docId: string) => {
    if (isStudent && userProfile?.studentProfile) {
      switch (docId) {
        case "historico_escolar":
          return userProfile.studentProfile.historicoEscolarFileId
        case "comprovante_matricula":
          return userProfile.studentProfile.comprovanteMatriculaFileId
        default:
          return null
      }
    }

    if (isProfessor && userProfile?.professorProfile) {
      switch (docId) {
        case "curriculum_vitae":
          return userProfile.professorProfile.curriculumVitaeFileId
        case "comprovante_vinculo":
          return userProfile.professorProfile.comprovanteVinculoFileId
        default:
          return null
      }
    }

    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentos
          </div>
          {documents.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                {documents.filter((doc) => getCurrentFileId(doc.id)).length} de {documents.length} enviados
              </span>
              {documents.filter((doc) => getCurrentFileId(doc.id)).length === documents.length && (
                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                  Completo
                </Badge>
              )}
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {documents.map((doc) => {
              const currentFileId = getCurrentFileId(doc.id)

              return (
                <div key={doc.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{doc.name}</h4>
                      {doc.required && (
                        <Badge variant="outline" className="border-red-500 text-red-700">
                          Obrigatório
                        </Badge>
                      )}
                      {currentFileId && (
                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                          Enviado
                        </Badge>
                      )}
                    </div>

                    {currentFileId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDocument(currentFileId, doc.name)}
                        disabled={getPresignedUrlMutation.isPending}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        {getPresignedUrlMutation.isPending ? "Carregando..." : "Visualizar PDF"}
                      </Button>
                    )}
                  </div>

                  {currentFileId && (
                    <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-800">
                        <Upload className="h-4 w-4" />
                        <span className="text-sm font-medium">Arquivo atual enviado</span>
                      </div>
                      <p className="text-xs text-green-700 mt-1">
                        Clique em "Visualizar" para ver o documento ou faça upload de um novo arquivo para substituir.
                      </p>
                    </div>
                  )}

                  <FileUploadField
                    label={currentFileId ? "Substituir documento" : ""}
                    description={doc.description}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    entityType="user_document"
                    entityId={user?.id.toString()}
                    currentFileId={currentFileId}
                    onFileUploaded={(fileId, fileName) => handleDocumentUpload(doc.id, fileId, fileName)}
                    required={doc.required}
                  />
                </div>
              )
            })}
          </div>

          {documents.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Nenhum documento requerido para seu perfil.</p>
              {isAdmin && (
                <p className="text-sm mt-2">Como administrador, você pode gerenciar documentos na seção de arquivos.</p>
              )}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Informações sobre documentos</h4>
                <ul className="text-sm text-blue-800 mt-2 space-y-1">
                  <li>• Documentos obrigatórios são necessários para participar do processo seletivo</li>
                  <li>• Aceitos formatos: PDF, DOC, DOCX, JPG, PNG</li>
                  <li>• Tamanho máximo: 10MB por arquivo</li>
                  <li>• Mantenha seus documentos sempre atualizados</li>
                  <li>• Use o botão "Visualizar" para conferir seus documentos enviados</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
