'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileUploadField } from '@/components/ui/FileUploadField'
import { api } from '@/utils/api'
import { useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle, AlertTriangle, ArrowRight, Info } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { OnboardingStatusResponse } from '@/server/api/routers/onboarding/onboarding'

interface StudentOnboardingFormProps {
  onboardingStatus: OnboardingStatusResponse
}

export function StudentOnboardingForm({ onboardingStatus }: StudentOnboardingFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    nomeCompleto: '',
    matricula: '',
    cpf: '',
    cr: '',
    cursoId: 0,
    telefone: '',
    genero: '' as 'MASCULINO' | 'FEMININO' | 'OUTRO' | '',
    especificacaoGenero: '',
    nomeSocial: '',
    rg: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: cursos } = api.course.getCourses.useQuery({ includeStats: false })
  const createProfileMutation = api.onboarding.createStudentProfile.useMutation()
  const updateDocumentMutation = api.onboarding.updateDocument.useMutation()
  const { refetch: refetchOnboardingStatus } = api.onboarding.getStatus.useQuery()

  const hasProfile = onboardingStatus.profile.exists
  const requiredDocs = onboardingStatus.documents.required
  const uploadedDocs = onboardingStatus.documents.uploaded
  const missingDocs = onboardingStatus.documents.missing

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nomeCompleto || !formData.matricula || !formData.cpf || !formData.cursoId || !formData.genero || !formData.cr) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    const crValue = parseFloat(formData.cr)
    if (isNaN(crValue) || crValue < 0 || crValue > 10) {
      toast.error('CR deve ser um número válido entre 0 e 10')
      return
    }

    setIsSubmitting(true)
    try {
      await createProfileMutation.mutateAsync({
        ...formData,
        cr: crValue,
        genero: formData.genero as 'MASCULINO' | 'FEMININO' | 'OUTRO'
      })
      toast.success('Perfil criado com sucesso!')
      await refetchOnboardingStatus()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar perfil')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDocumentUpload = async (docType: string, fileId: string, fileName: string) => {
    try {
      await updateDocumentMutation.mutateAsync({
        documentType: docType as 'comprovante_matricula' | 'historico_escolar',
        fileId,
      })

      toast.success('Documento vinculado com sucesso!')
      await refetchOnboardingStatus()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao vincular documento')
    }
  }

  const handleContinue = () => {
    router.push('/home/student/dashboard')
  }

  const getDocumentStatus = (docType: string) => {
    if (uploadedDocs.includes(docType)) {
      return 'uploaded'
    }
    if (requiredDocs.includes(docType)) {
      return 'required'
    }
    return 'optional'
  }

  const documents = [
    {
      id: 'comprovante_matricula',
      name: 'Comprovante de Matrícula',
      description: 'Comprovante de matrícula atual',
      required: true,
    },
    {
      id: 'historico_escolar',
      name: 'Histórico Escolar',
      description: 'Histórico escolar atualizado',
      required: false,
    },
  ]

  const requiredDocsCompleted = hasProfile && requiredDocs.every(docType => uploadedDocs.includes(docType))
  const isOnboardingComplete = hasProfile && missingDocs.length === 0

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
                    <Label htmlFor="matricula">Matrícula *</Label>
                    <Input
                      id="matricula"
                      value={formData.matricula}
                      onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
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
                    <Label htmlFor="rg">RG</Label>
                    <Input
                      id="rg"
                      value={formData.rg}
                      onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      placeholder="(xx) xxxxx-xxxx"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="genero">Gênero *</Label>
                    <Select
                      value={formData.genero}
                      onValueChange={(value: 'MASCULINO' | 'FEMININO' | 'OUTRO') =>
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

                  {formData.genero === 'OUTRO' && (
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
                    <Label htmlFor="curso">Curso *</Label>
                    <Select
                      value={formData.cursoId.toString()}
                      onValueChange={(value) =>
                        setFormData({ ...formData, cursoId: parseInt(value) })
                      }
                    >
                      <SelectTrigger className="mt-1">
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
                    <Label htmlFor="cr">CR (Coeficiente de Rendimento) *</Label>
                    <Input
                      id="cr"
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={formData.cr}
                      onChange={(e) => setFormData({ ...formData, cr: e.target.value })}
                      required
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <Button type="submit" disabled={isSubmitting} size="lg" className="w-full bg-blue-600 hover:bg-blue-700">
                    {isSubmitting ? 'Criando perfil...' : 'Criar Perfil'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Documentos</CardTitle>
            <p className="text-sm text-gray-600">
              Envie os documentos necessários para validar seu perfil
            </p>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              {documents.map((doc) => {
                const status = getDocumentStatus(doc.id)
                const isUploaded = status === 'uploaded'
                
                return (
                  <div 
                    key={doc.id} 
                    className="border rounded-lg p-6 bg-gray-50"
                    data-status={status}
                    data-uploaded={isUploaded}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <h4 className="font-medium text-base">{doc.name}</h4>
                      {isUploaded && (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Enviado
                        </Badge>
                      )}
                      {status === 'required' && !isUploaded && (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Obrigatório
                        </Badge>
                      )}
                      {status === 'optional' && !isUploaded && (
                        <Badge variant="outline">Opcional</Badge>
                      )}
                    </div>
                    
                    {!isUploaded && (
                      <FileUploadField
                        label=""
                        description={doc.description}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        entityType="student_document"
                        onFileUploaded={(fileId, fileName) => handleDocumentUpload(doc.id, fileId, fileName)}
                        disabled={!hasProfile}
                        required={doc.required}
                      />
                    )}

                    {isUploaded && (
                      <p className="text-sm text-green-700 font-medium">
                        ✅ {doc.description}
                      </p>
                    )}
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

        {requiredDocsCompleted && !isOnboardingComplete && (
          <Card className="shadow-lg border-blue-200 bg-blue-50">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-blue-800">
                <CheckCircle className="h-5 w-5" />
                Documentos Obrigatórios Enviados!
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center p-8">
              <p className="text-blue-700 mb-6">
                Você enviou todos os documentos obrigatórios. Pode continuar ou enviar documentos opcionais se desejar.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={handleContinue}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 px-8"
                >
                  Continuar para o Dashboard
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    const firstOptionalDoc = document.querySelector('[data-status="optional"]:not([data-uploaded="true"])')
                    if (firstOptionalDoc) {
                      firstOptionalDoc.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    }
                  }}
                  className="px-8"
                >
                  Enviar Documentos Opcionais
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
                Parabéns! Seu perfil está completo com todos os documentos e você já pode utilizar todas as funcionalidades do sistema.
              </p>
              <Button
                onClick={handleContinue}
                size="lg"
                className="bg-green-600 hover:bg-green-700 px-8"
              >
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