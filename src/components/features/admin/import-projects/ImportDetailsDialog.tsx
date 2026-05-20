"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { SEMESTRE_1 } from "@/types"
import { api } from "@/utils/api"
import { CheckCircle, Mail, Send } from "lucide-react"
import { getStatusBadge } from "./ImportHistoryTableColumns"

interface ImportDetails {
  id: number
  nomeArquivo: string
  ano: number
  semestre: string
  status: string
  totalProjetos: number
  projetosCriados: number
  projetosComErro: number
  professoresNotificadosEm?: Date | string | null
  erros?: {
    erros?: string[]
    warnings?: string[]
  }
}

interface ImportDetailsDialogProps {
  details: ImportDetails | null | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
  onNotified?: () => void
}

export function ImportDetailsDialog({ details, open, onOpenChange, onNotified }: ImportDetailsDialogProps) {
  const { toast } = useToast()

  const notifyMutation = api.importProjects.notifyProfessors.useMutation({
    onSuccess: (result) => {
      toast({
        title: "Professores notificados!",
        description: `${result.emailsEnviados} de ${result.totalProfessores} professores notificados com sucesso.`,
      })
      onNotified?.()
    },
    onError: (error) => {
      toast({
        title: "Erro ao notificar",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  if (!details) return null

  const jaNotificado = !!details.professoresNotificadosEm
  const importConcluida = details.status === "CONCLUIDO" || details.status === "CONCLUIDO_COM_ERROS"
  const temProjetosCriados = details.projetosCriados > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes da Importação</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Arquivo</p>
              <p className="text-sm text-muted-foreground">{details.nomeArquivo}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Período</p>
              <p className="text-sm text-muted-foreground">
                {details.ano}/{details.semestre === SEMESTRE_1 ? "1" : "2"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Total de Projetos</p>
              <p className="text-sm text-muted-foreground">{details.totalProjetos}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Status</p>
              {getStatusBadge(details.status)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-green-600">Projetos Criados</p>
              <p className="text-lg font-semibold text-green-600">{details.projetosCriados}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-red-600">Projetos com Erro</p>
              <p className="text-lg font-semibold text-red-600">{details.projetosComErro}</p>
            </div>
          </div>

          {importConcluida && temProjetosCriados && (
            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Notificação aos Professores</p>
                </div>
                {jaNotificado ? (
                  <div className="flex items-center gap-1.5 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">
                      Notificados em{" "}
                      {new Date(details.professoresNotificadosEm!).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => notifyMutation.mutate({ id: details.id })}
                    disabled={notifyMutation.isPending}
                  >
                    <Send className="h-4 w-4 mr-1.5" />
                    {notifyMutation.isPending ? "Enviando..." : "Notificar Professores"}
                  </Button>
                )}
              </div>
              {!jaNotificado && (
                <p className="text-xs text-muted-foreground">
                  Envie um email aos professores informando que os projetos foram criados e que eles podem revisar e
                  assinar.
                </p>
              )}
            </div>
          )}

          {details.erros?.erros && details.erros.erros.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Erros Encontrados</p>
              <div className="max-h-40 overflow-y-auto bg-red-50 border border-red-200 rounded p-3">
                {details.erros.erros.map((erro: string, index: number) => (
                  <p key={index} className="text-sm text-red-700 mb-1">
                    • {erro}
                  </p>
                ))}
              </div>
            </div>
          )}

          {details.erros?.warnings && details.erros.warnings.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Avisos</p>
              <div className="max-h-40 overflow-y-auto bg-yellow-50 border border-yellow-200 rounded p-3">
                {details.erros.warnings.map((warning: string, index: number) => (
                  <p key={index} className="text-sm text-yellow-700 mb-1">
                    • {warning}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
