import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertTriangle, Mail } from "lucide-react"

interface EmailDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  emailsDepartamento: string[]
  selectedYear: number
  selectedSemester: string
  incluirBolsistas: boolean
  incluirVoluntarios: boolean
  totalMonitores: number
  isDisabled: boolean
  isPending: boolean
  onSendEmail: () => void
}

export function EmailDialog({
  isOpen,
  onOpenChange,
  emailsDepartamento,
  selectedYear,
  selectedSemester,
  incluirBolsistas,
  incluirVoluntarios,
  totalMonitores,
  isDisabled,
  isPending,
  onSendEmail,
}: EmailDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button disabled={isDisabled} className="bg-green-600 hover:bg-green-700">
          <Mail className="h-4 w-4 mr-2" />
          Enviar ao Departamento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar planilhas consolidadas</DialogTitle>
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
                • Período: {selectedYear}.{selectedSemester === "SEMESTRE_1" ? "1" : "2"}
              </li>
              <li>• Total de monitores: {totalMonitores}</li>
              <li>• Incluir bolsistas: {incluirBolsistas ? "Sim" : "Não"}</li>
              <li>• Incluir voluntários: {incluirVoluntarios ? "Sim" : "Não"}</li>
              <li>• Arquivos: consolidação de bolsistas e consolidação de voluntários (.xlsx)</li>
            </ul>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={onSendEmail}
              disabled={isPending || emailsDepartamento.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {isPending ? "Enviando..." : "Enviar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
