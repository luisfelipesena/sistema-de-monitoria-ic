"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SEMESTRE_1 } from "@/types"
import { getStatusBadge } from "./ImportHistoryTableColumns"

interface ImportDetails {
  nomeArquivo: string
  ano: number
  semestre: string
  status: string
  totalProjetos: number
  projetosCriados: number
  projetosComErro: number
  erros?: {
    erros?: string[]
    warnings?: string[]
  }
}

interface ImportDetailsDialogProps {
  details: ImportDetails | null | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImportDetailsDialog({ details, open, onOpenChange }: ImportDetailsDialogProps) {
  if (!details) return null

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
