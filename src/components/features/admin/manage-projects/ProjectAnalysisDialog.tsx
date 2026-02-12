"use client"

import { MonitoriaFormTemplate } from "@/components/features/projects/MonitoriaFormTemplate"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import type { ManageProjectItem, MonitoriaFormData } from "@/types"
import { api } from "@/utils/api"
import { Check, X, Loader2, MessageSquare } from "lucide-react"
import dynamic from "next/dynamic"
import { useMemo, useState } from "react"

// PDFViewer wrapper to prevent SSR issues - separate file for ESM compatibility
const ClientOnlyPDFViewer = dynamic(
  () => import("@/components/features/projects/PDFViewerWrapper").then((mod) => mod.PDFViewerWrapper),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-[600px] bg-gray-50 rounded-lg border"><Loader2 className="h-8 w-8 animate-spin text-gray-500" /><span className="ml-2 text-gray-600">Carregando documento...</span></div> }
)

interface ProjectAnalysisDialogProps {
  isOpen: boolean
  onClose: () => void
  project: ManageProjectItem | null
  onApprove: () => void
  onReject: () => void
  isApproving: boolean
}

export function ProjectAnalysisDialog({
  isOpen,
  onClose,
  project,
  onApprove,
  onReject,
  isApproving,
}: ProjectAnalysisDialogProps) {
  const { toast } = useToast()
  const [showRevisionForm, setShowRevisionForm] = useState(false)
  const [revisionMessage, setRevisionMessage] = useState("")
  const apiUtils = api.useUtils()

  // Fetch full project data when dialog is open
  const { data: fullProject, isLoading: isLoadingProject } = api.projeto.getProjeto.useQuery(
    { id: project?.id ?? 0 },
    { enabled: isOpen && !!project?.id }
  )

  const requestRevision = api.projeto.requestRevision.useMutation({
    onSuccess: async () => {
      toast({
        title: "Revisão solicitada",
        description: "O professor foi notificado e poderá editar o projeto.",
      })
      await apiUtils.projeto.getProjetosFiltered.invalidate()
      setShowRevisionForm(false)
      setRevisionMessage("")
      onClose()
    },
    onError: (error) => {
      toast({
        title: "Erro ao solicitar revisão",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const handleRequestRevision = () => {
    if (!project?.id || revisionMessage.trim().length < 10) {
      toast({
        title: "Mensagem obrigatória",
        description: "A mensagem deve ter pelo menos 10 caracteres.",
        variant: "destructive",
      })
      return
    }
    requestRevision.mutate({ id: project.id, mensagem: revisionMessage })
  }

  // Build MonitoriaFormData from project
  const pdfData: MonitoriaFormData | null = useMemo(() => {
    if (!fullProject) return null

    return {
      projetoId: fullProject.id,
      titulo: fullProject.titulo,
      descricao: fullProject.descricao,
      departamento: fullProject.departamento
        ? {
            id: fullProject.departamento.id,
            nome: fullProject.departamento.nome,
          }
        : undefined,
      ano: fullProject.ano,
      semestre: fullProject.semestre,
      numeroEdital: fullProject.editalNumero ?? undefined,
      tipoProposicao: fullProject.tipoProposicao,
      professoresParticipantes: fullProject.professoresParticipantes ?? undefined,
      bolsasSolicitadas: fullProject.bolsasSolicitadas,
      voluntariosSolicitados: fullProject.voluntariosSolicitados,
      cargaHorariaSemana: fullProject.cargaHorariaSemana,
      numeroSemanas: fullProject.numeroSemanas,
      publicoAlvo: fullProject.publicoAlvo,
      estimativaPessoasBenificiadas: fullProject.estimativaPessoasBenificiadas ?? undefined,
      disciplinas: fullProject.disciplinas?.map((d) => ({
        id: d.id,
        codigo: d.codigo,
        nome: d.nome,
      })) ?? [],
      atividades: fullProject.atividades?.map((a) => a.descricao) ?? [],
      professorResponsavel: fullProject.professorResponsavel
        ? {
            id: fullProject.professorResponsavel.id,
            nomeCompleto: fullProject.professorResponsavel.nomeCompleto,
            nomeSocial: fullProject.professorResponsavel.nomeSocial,
            genero: fullProject.professorResponsavel.genero,
            cpf: fullProject.professorResponsavel.cpf,
            matriculaSiape: fullProject.professorResponsavel.matriculaSiape,
            regime: fullProject.professorResponsavel.regime,
            telefone: fullProject.professorResponsavel.telefone,
            telefoneInstitucional: fullProject.professorResponsavel.telefoneInstitucional,
            emailInstitucional: fullProject.professorResponsavel.emailInstitucional,
          }
        : undefined,
      assinaturaProfessor: fullProject.assinaturaProfessor ?? undefined,
    }
  }, [fullProject])

  if (!project) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Análise do Projeto</DialogTitle>
          <DialogDescription>
            Projeto: {project.titulo} - {project.professorResponsavelNome}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Inline PDF Viewer */}
          {isLoadingProject ? (
            <div className="flex items-center justify-center h-[600px] bg-gray-50 rounded-lg border">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              <span className="ml-2 text-gray-600">Carregando documento...</span>
            </div>
          ) : pdfData ? (
            <div className="border rounded-lg bg-white">
              <ClientOnlyPDFViewer width="100%" height="600px" showToolbar>
                <MonitoriaFormTemplate data={pdfData} />
              </ClientOnlyPDFViewer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg border">
              <span className="text-gray-600">Erro ao carregar documento</span>
            </div>
          )}

          {/* Revision Request Form */}
          {showRevisionForm && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
              <h4 className="font-semibold text-amber-800 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Solicitar Revisão ao Professor
              </h4>
              <p className="text-sm text-amber-700">
                Descreva as correções necessárias. O professor será notificado por email e poderá
                editar o projeto. A assinatura atual será removida.
              </p>
              <Textarea
                placeholder="Descreva as correções necessárias (mínimo 10 caracteres)..."
                value={revisionMessage}
                onChange={(e) => setRevisionMessage(e.target.value)}
                rows={4}
                className="bg-white"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowRevisionForm(false)
                    setRevisionMessage("")
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleRequestRevision}
                  disabled={requestRevision.isPending || revisionMessage.trim().length < 10}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {requestRevision.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar para Revisão"
                  )}
                </Button>
              </div>
            </div>
          )}

          {!showRevisionForm && (
            <div className="text-sm text-muted-foreground">
              <p>
                <strong>Etapas do processo:</strong>
              </p>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Analise o documento acima e verifique a assinatura do professor</li>
                <li>Aprove, rejeite, ou solicite revisão usando os botões abaixo</li>
                <li>Se aprovado, o projeto ficará disponível para assinatura administrativa</li>
              </ol>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          {!showRevisionForm && (
            <Button
              variant="outline"
              onClick={() => setShowRevisionForm(true)}
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Notificar Professor
            </Button>
          )}
          <Button variant="destructive" onClick={onReject} disabled={showRevisionForm}>
            <X className="h-4 w-4 mr-2" />
            Rejeitar
          </Button>
          <Button
            variant="default"
            onClick={onApprove}
            disabled={isApproving || showRevisionForm}
            className="bg-green-600 hover:bg-green-700"
          >
            <Check className="h-4 w-4 mr-2" />
            {isApproving ? "Aprovando..." : "Aprovar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
