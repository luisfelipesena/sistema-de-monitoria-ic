"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileUploadField } from "@/components/ui/FileUploadField"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { ADMIN, PROFESSOR, STUDENT } from "@/types"
import { api } from "@/utils/api"
import { FileText, Upload } from "lucide-react"

interface DocumentConfig {
  id: string
  name: string
  description: string
  required: boolean
}

export function DocumentsSection() {
  const { user } = useAuth()
  const { toast } = useToast()

  const isStudent = user?.role === STUDENT
  const isProfessor = user?.role === PROFESSOR
  const isAdmin = user?.role === ADMIN

  const { data: userProfile, refetch: refetchProfile } = api.user.getProfile.useQuery()
  const updateDocumentMutation = api.onboarding.updateDocument.useMutation()

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
    } catch (error) {
      toast({
        title: "Erro ao enviar documento",
        description: error instanceof Error ? error.message : "Não foi possível enviar o documento.",
        variant: "destructive",
      })
    }
  }

  const getRequiredDocuments = (): DocumentConfig[] => {
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
          required: false,
        },
        {
          id: "comprovante_vinculo",
          name: "Comprovante de Vínculo",
          description: "Comprovante de vínculo institucional",
          required: false,
        },
      ]
    }

    return []
  }

  const documents = getRequiredDocuments()

  const getCurrentFileId = (docId: string): string | null => {
    if (isStudent && userProfile?.studentProfile) {
      switch (docId) {
        case "historico_escolar":
          return userProfile.studentProfile.historicoEscolarFileId || null
        case "comprovante_matricula":
          return userProfile.studentProfile.comprovanteMatriculaFileId || null
        default:
          return null
      }
    }

    if (isProfessor && userProfile?.professorProfile) {
      switch (docId) {
        case "curriculum_vitae":
          return userProfile.professorProfile.curriculumVitaeFileId || null
        case "comprovante_vinculo":
          return userProfile.professorProfile.comprovanteVinculoFileId || null
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
                  <div className="flex items-center gap-2 mb-3">
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
                    <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-800">
                        <Upload className="h-4 w-4" />
                        <span className="text-sm font-medium">Arquivo atual enviado</span>
                      </div>
                      <p className="text-xs text-green-700 mt-1">
                        Faça upload de um novo arquivo para substituir o atual.
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
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
