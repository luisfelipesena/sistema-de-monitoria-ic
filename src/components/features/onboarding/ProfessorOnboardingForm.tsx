"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { FileUploadField } from "@/components/ui/FileUploadField"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { OnboardingStatusResponse } from "@/server/api/routers/onboarding/onboarding"
import { api } from "@/utils/api"
import { AlertTriangle, ArrowRight, BookOpen, CheckCircle, Info, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface ProfessorOnboardingFormProps {
  onboardingStatus: OnboardingStatusResponse
}

export function ProfessorOnboardingForm({ onboardingStatus }: ProfessorOnboardingFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    nomeCompleto: "",
    matriculaSiape: "",
    cpf: "",
    telefone: "",
    telefoneInstitucional: "",
    regime: "" as "20H" | "40H" | "DE" | "",
    departamentoId: 0,
    genero: "" as "MASCULINO" | "FEMININO" | "OUTRO" | "",
    especificacaoGenero: "",
    nomeSocial: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedDisciplinas, setSelectedDisciplinas] = useState<number[]>([])
  const [newDisciplina, setNewDisciplina] = useState({
    nome: "",
    codigo: "",
    turma: "T1",
    cargaHoraria: 0,
    periodo: 1,
  })

  const { data: departamentos } = api.departamento.getDepartamentos.useQuery({ includeStats: false })
  const { data: disciplinas, refetch: refetchDisciplinas } = api.discipline.getDisciplines.useQuery()
  const createProfileMutation = api.onboarding.createProfessorProfile.useMutation()
  const updateDocumentMutation = api.onboarding.updateDocument.useMutation()
  const createDisciplinaMutation = api.discipline.create.useMutation()
  const linkDisciplinasMutation = api.onboarding.linkDisciplinas.useMutation()
  const { refetch: refetchOnboardingStatus } = api.onboarding.getStatus.useQuery()

  const hasProfile = onboardingStatus.profile.exists
  const { data: userProfile } = api.user.getProfile.useQuery(undefined, {
    enabled: hasProfile, // Only fetch when profile exists
  })
  const requiredDocs = onboardingStatus.documents.required
  const uploadedDocs = onboardingStatus.documents.uploaded
  const missingDocs = onboardingStatus.documents.missing
  const hasDisciplinas = onboardingStatus.disciplinas?.configured || false

  // Get professor's department ID from user profile or form data
  const professorDepartamentoId = hasProfile
    ? userProfile?.professorProfile?.departamentoId || formData.departamentoId
    : formData.departamentoId

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nomeCompleto || !formData.cpf || !formData.regime || !formData.departamentoId || !formData.genero) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }

    setIsSubmitting(true)
    try {
      await createProfileMutation.mutateAsync({
        ...formData,
        regime: formData.regime as "20H" | "40H" | "DE",
        genero: formData.genero as "MASCULINO" | "FEMININO" | "OUTRO",
      })
      toast.success("Perfil criado com sucesso!")
      await refetchOnboardingStatus()
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar perfil")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDocumentUpload = async (docType: string, fileId: string, fileName: string) => {
    try {
      await updateDocumentMutation.mutateAsync({
        documentType: docType as "curriculum_vitae" | "comprovante_vinculo",
        fileId,
      })

      toast.success("Documento vinculado com sucesso!")
      await refetchOnboardingStatus()
    } catch (error: any) {
      toast.error(error.message || "Erro ao vincular documento")
    }
  }

  const handleCreateDisciplina = async () => {
    const departamentoId = professorDepartamentoId || formData.departamentoId

    if (!newDisciplina.nome || !newDisciplina.codigo || !departamentoId) {
      toast.error("Preencha todos os campos da disciplina e certifique-se de ter um departamento selecionado")
      return
    }

    try {
      const disciplina = await createDisciplinaMutation.mutateAsync({
        ...newDisciplina,
        departamentoId,
      })

      setSelectedDisciplinas([...selectedDisciplinas, disciplina.id])
      setNewDisciplina({ nome: "", codigo: "", turma: "T1", cargaHoraria: 0, periodo: 1 })
      // Refetch disciplines to include the newly created one
      await refetchDisciplinas()
      toast.success("Disciplina criada e selecionada com sucesso!")
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar disciplina")
    }
  }

  const handleLinkDisciplinas = async () => {
    if (selectedDisciplinas.length === 0) {
      toast.error("Selecione pelo menos uma disciplina")
      return
    }

    try {
      await linkDisciplinasMutation.mutateAsync({
        disciplinaIds: selectedDisciplinas,
      })

      toast.success("Disciplinas vinculadas com sucesso!")
      await refetchOnboardingStatus()
    } catch (error: any) {
      toast.error(error.message || "Erro ao vincular disciplinas")
    }
  }

  const handleContinue = () => {
    router.push("/home/professor/dashboard")
  }

  const getDocumentStatus = (docType: string) => {
    if (uploadedDocs.includes(docType)) {
      return "uploaded"
    }
    if (requiredDocs.includes(docType)) {
      return "required"
    }
    return "optional"
  }

  const documents = [
    {
      id: "curriculum_vitae",
      name: "Curriculum Vitae",
      description: "CV atualizado com experiência acadêmica e profissional",
      required: true,
    },
    {
      id: "comprovante_vinculo",
      name: "Comprovante de Vínculo",
      description: "Comprovante de vínculo institucional com a universidade",
      required: true,
    },
  ]

  const isOnboardingComplete = hasProfile && missingDocs.length === 0 && hasDisciplinas

  const departamentoDisciplinas =
    disciplinas?.filter((d) => d.departamentoId === professorDepartamentoId && professorDepartamentoId > 0) || []

  // Refetch disciplines when department changes
  useEffect(() => {
    if (professorDepartamentoId > 0) {
      refetchDisciplinas()
    }
  }, [professorDepartamentoId, refetchDisciplinas])

  return (
    <section className="w-full">
      <div className="space-y-8">
        {!hasProfile && (
          <Card className="shadow-lg">
            <CardContent className="p-8">
              <form onSubmit={handleSubmitProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="nomeCompleto">Nome Completo *</Label>
                    <Input
                      id="nomeCompleto"
                      value={formData.nomeCompleto}
                      onChange={(e) => setFormData({ ...formData, nomeCompleto: e.target.value })}
                      required
                      className="mt-1"
                    />
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
                    <Label htmlFor="matriculaSiape">Matrícula SIAPE</Label>
                    <Input
                      id="matriculaSiape"
                      value={formData.matriculaSiape}
                      onChange={(e) => setFormData({ ...formData, matriculaSiape: e.target.value })}
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
                      onValueChange={(value: "MASCULINO" | "FEMININO" | "OUTRO") =>
                        setFormData({ ...formData, genero: value })
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione seu gênero" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MASCULINO">Masculino</SelectItem>
                        <SelectItem value="FEMININO">Feminino</SelectItem>
                        <SelectItem value="OUTRO">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.genero === "OUTRO" && (
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
                      onValueChange={(value: "20H" | "40H" | "DE") => setFormData({ ...formData, regime: value })}
                    >
                      <SelectTrigger className="mt-1">
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

                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    size="lg"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmitting ? "Criando perfil..." : "Criar Perfil"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Documentos</CardTitle>
            <p className="text-sm text-gray-600">Envie os documentos necessários para validar seu perfil</p>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              {documents.map((doc) => {
                const status = getDocumentStatus(doc.id)
                const isUploaded = status === "uploaded"

                return (
                  <div key={doc.id} className="border rounded-lg p-6 bg-gray-50">
                    <div className="flex items-center gap-3 mb-4">
                      <h4 className="font-medium text-base">{doc.name}</h4>
                      {isUploaded && (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Enviado
                        </Badge>
                      )}
                      {status === "required" && !isUploaded && (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Obrigatório
                        </Badge>
                      )}
                    </div>

                    {!isUploaded && (
                      <FileUploadField
                        label=""
                        description={doc.description}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        entityType="professor_document"
                        onFileUploaded={(fileId, fileName) => handleDocumentUpload(doc.id, fileId, fileName)}
                        disabled={!hasProfile}
                        required={doc.required}
                      />
                    )}

                    {isUploaded && <p className="text-sm text-green-700 font-medium">✅ {doc.description}</p>}
                  </div>
                )
              })}

              {!hasProfile && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <Info className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                  <p className="text-blue-800 text-sm">
                    Complete primeiro suas informações pessoais para poder enviar documentos.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {hasProfile && missingDocs.length === 0 && !hasDisciplinas && (
          <Card className="shadow-lg border-amber-200 bg-amber-50">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-amber-800">
                <BookOpen className="h-5 w-5" />
                Configuração de Disciplinas
              </CardTitle>
              <p className="text-sm text-amber-700">
                Selecione as disciplinas que irá lecionar ou crie novas disciplinas
              </p>
            </CardHeader>
            <CardContent className="p-8">
              {professorDepartamentoId === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-amber-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-amber-800 mb-2">Selecione seu departamento</h3>
                  <p className="text-sm text-amber-700">
                    Para configurar suas disciplinas, primeiro complete suas informações pessoais e selecione seu
                    departamento.
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="border-blue-200 bg-blue-50">
                      <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-blue-800 text-lg">
                          <CheckCircle className="h-5 w-5" />
                          Selecionar Disciplinas Existentes
                        </CardTitle>
                        <p className="text-sm text-blue-700">
                          Escolha entre as disciplinas já cadastradas no seu departamento
                        </p>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {departamentoDisciplinas.length > 0 ? (
                          <div className="space-y-4">
                            <div className="max-h-48 overflow-y-auto border rounded-lg bg-white p-3">
                              <div className="grid gap-2">
                                {departamentoDisciplinas.map((disciplina) => (
                                  <div
                                    key={disciplina.id}
                                    className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                                      selectedDisciplinas.includes(disciplina.id)
                                        ? "border-blue-300 bg-blue-100"
                                        : "border-gray-200 hover:border-blue-200"
                                    }`}
                                  >
                                    <div className="flex items-center space-x-3">
                                      <Checkbox
                                        id={`disciplina-${disciplina.id}`}
                                        checked={selectedDisciplinas.includes(disciplina.id)}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            setSelectedDisciplinas([...selectedDisciplinas, disciplina.id])
                                          } else {
                                            setSelectedDisciplinas(
                                              selectedDisciplinas.filter((id) => id !== disciplina.id)
                                            )
                                          }
                                        }}
                                      />
                                      <div>
                                        <Label
                                          htmlFor={`disciplina-${disciplina.id}`}
                                          className="text-sm font-medium cursor-pointer"
                                        >
                                          {disciplina.codigo} - {disciplina.nome}
                                        </Label>
                                      </div>
                                    </div>

                                    {selectedDisciplinas.includes(disciplina.id) && (
                                      <Badge variant="default" className="bg-blue-600 text-white">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Selecionada
                                      </Badge>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {selectedDisciplinas.length > 0 && (
                              <div className="bg-blue-100 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-800 mb-3 font-medium">
                                  {selectedDisciplinas.length} disciplina(s) selecionada(s)
                                </p>
                                <Button
                                  onClick={handleLinkDisciplinas}
                                  disabled={linkDisciplinasMutation.isPending}
                                  size="lg"
                                  className="w-full bg-blue-600 hover:bg-blue-700"
                                >
                                  {linkDisciplinasMutation.isPending ? "Vinculando..." : `Confirmar Seleção`}
                                </Button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-6">
                            <BookOpen className="h-10 w-10 text-blue-400 mx-auto mb-3" />
                            <p className="text-sm font-medium text-blue-700 mb-2">
                              Nenhuma disciplina encontrada neste departamento
                            </p>
                            <p className="text-xs text-blue-600">
                              Você pode criar uma nova disciplina usando o formulário ao lado
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="border-green-200 bg-green-50">
                      <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-green-800 text-lg">
                          <Plus className="h-5 w-5" />
                          Criar Nova Disciplina
                        </CardTitle>
                        <p className="text-sm text-green-700">Cadastre uma nova disciplina que você irá lecionar</p>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <Label htmlFor="disciplinaNome">Nome da Disciplina *</Label>
                              <Input
                                id="disciplinaNome"
                                value={newDisciplina.nome}
                                onChange={(e) => setNewDisciplina({ ...newDisciplina, nome: e.target.value })}
                                placeholder="Ex: Algoritmos e Estruturas de Dados"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor="disciplinaCodigo">Código *</Label>
                              <Input
                                id="disciplinaCodigo"
                                value={newDisciplina.codigo}
                                onChange={(e) => setNewDisciplina({ ...newDisciplina, codigo: e.target.value })}
                                placeholder="Ex: CIC0001"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor="disciplinaTurma">Turma *</Label>
                              <Select
                                value={newDisciplina.turma}
                                onValueChange={(value) => setNewDisciplina({ ...newDisciplina, turma: value })}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Selecione a turma" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                                    <SelectItem key={`T${num}`} value={`T${num}`}>
                                      T{num}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label htmlFor="cargaHoraria">Carga Horária</Label>
                                <Input
                                  id="cargaHoraria"
                                  type="number"
                                  value={newDisciplina.cargaHoraria}
                                  onChange={(e) =>
                                    setNewDisciplina({ ...newDisciplina, cargaHoraria: parseInt(e.target.value) || 0 })
                                  }
                                  placeholder="60"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label htmlFor="periodo">Período</Label>
                                <Select
                                  value={newDisciplina.periodo.toString()}
                                  onValueChange={(value) =>
                                    setNewDisciplina({ ...newDisciplina, periodo: parseInt(value) })
                                  }
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Array.from({ length: 10 }, (_, i) => i + 1).map((periodo) => (
                                      <SelectItem key={periodo} value={periodo.toString()}>
                                        {periodo}º
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>

                          <div className="bg-green-100 border border-green-200 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              <Info className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-green-800">
                                A disciplina será criada e automaticamente selecionada para você lecionar.
                              </p>
                            </div>
                          </div>

                          <Button
                            onClick={handleCreateDisciplina}
                            disabled={
                              createDisciplinaMutation.isPending || !newDisciplina.nome || !newDisciplina.codigo
                            }
                            size="lg"
                            className="w-full bg-green-600 hover:bg-green-700"
                          >
                            {createDisciplinaMutation.isPending ? "Criando..." : "Criar e Selecionar Disciplina"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {selectedDisciplinas.length > 0 && (
                    <div className="bg-amber-100 border border-amber-200 rounded-lg p-6">
                      <div className="text-center">
                        <CheckCircle className="h-8 w-8 text-amber-600 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-amber-800 mb-2">Disciplinas Configuradas</h3>
                        <p className="text-sm text-amber-700 mb-4">
                          Você selecionou {selectedDisciplinas.length} disciplina(s). Confirme para continuar.
                        </p>
                        <Button
                          onClick={handleLinkDisciplinas}
                          disabled={linkDisciplinasMutation.isPending}
                          size="lg"
                          className="bg-amber-600 hover:bg-amber-700 px-8"
                        >
                          {linkDisciplinasMutation.isPending ? "Configurando..." : "Confirmar Configuração"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
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
    </section>
  )
}
