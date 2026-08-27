import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { getSemestreNumero, type Semestre } from "@/types"
import { AlertTriangle, Mail } from "lucide-react"

interface EmailDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  emailsDepartamento: string[]
  selectedYear: number
  selectedSemester: Semestre
  modalidade?: "bolsistas" | "voluntarios" | "geral"
  incluirBolsistas: boolean
  incluirVoluntarios: boolean
  totalMonitores: number
  isDisabled: boolean
  isPending: boolean
  onSendEmail: () => void
  buttonText?: string
  buttonClassName?: string
}

export function EmailDialog({
  isOpen,
  onOpenChange,
  emailsDepartamento,
  selectedYear,
  selectedSemester,
  modalidade = "geral",
  incluirBolsistas,
  incluirVoluntarios,
  totalMonitores,
  isDisabled,
  isPending,
  onSendEmail,
  buttonText,
  buttonClassName,
}: EmailDialogProps) {
  const defaultButtonText =
    modalidade === "bolsistas"
      ? "Enviar Documentos dos Bolsistas (E-mail)"
      : modalidade === "voluntarios"
        ? "Enviar Documentos dos Voluntários (E-mail)"
        : "Enviar ao Departamento"

  const titleText =
    modalidade === "bolsistas"
      ? "Enviar Documentos dos Bolsistas ao Departamento"
      : modalidade === "voluntarios"
        ? "Enviar Documentos dos Voluntários ao Departamento"
        : "Enviar documentos consolidados"

  const arquivosInfo =
    modalidade === "bolsistas"
      ? "PDF Consolidado de Resultados com Bolsistas, Planilha Excel de Bolsistas (.xlsx) e Termos de Compromisso (PDF) dos Bolsistas"
      : modalidade === "voluntarios"
        ? "Planilha Excel de Voluntários (.xlsx) e Termos de Compromisso (PDF) dos Voluntários"
        : "PDF Consolidado de Resultados, Planilhas Excel (.xlsx) e Termos de Compromisso (PDF)"

  const btnClass =
    buttonClassName ||
    (modalidade === "bolsistas"
      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
      : modalidade === "voluntarios"
        ? "bg-blue-600 hover:bg-blue-700 text-white"
        : "bg-green-600 hover:bg-green-700 text-white")

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button disabled={isDisabled} className={btnClass}>
          <Mail className="h-4 w-4 mr-2" />
          {buttonText || defaultButtonText}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titleText}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Alert variant={emailsDepartamento.length ? "default" : "destructive"}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {emailsDepartamento.length
                ? `Destinatários: ${emailsDepartamento.join(", ")}`
                : "Nenhum email de chefe de departamento cadastrado nas configurações."}
            </AlertDescription>
          </Alert>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h5 className="font-medium mb-2">Informações que serão enviadas:</h5>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>
                • Período: {selectedYear}.{getSemestreNumero(selectedSemester)}
              </li>
              <li>• Total de monitores: {totalMonitores}</li>
              {modalidade === "geral" && (
                <>
                  <li>• Incluir bolsistas: {incluirBolsistas ? "Sim" : "Não"}</li>
                  <li>• Incluir voluntários: {incluirVoluntarios ? "Sim" : "Não"}</li>
                </>
              )}
              <li>• Arquivos: {arquivosInfo}</li>
            </ul>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              disabled={isPending || !emailsDepartamento.length}
              onClick={onSendEmail}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isPending ? "Enviando..." : "Confirmar Envio"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
