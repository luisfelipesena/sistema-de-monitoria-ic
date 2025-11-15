import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { getSemestreNumero, type Semestre } from "@/types"
import { useState } from "react"

interface ProgradDialogProps {
  isOpen: boolean
  onClose: () => void
  filters: {
    ano: number
    semestre: Semestre
  }
  onSave: (data: { ano: number; semestre: Semestre; totalBolsas: number }) => void
  isSaving: boolean
}

export function ProgradDialog({ isOpen, onClose, filters, onSave, isSaving }: ProgradDialogProps) {
  const { toast } = useToast()
  const [totalProgradInput, setTotalProgradInput] = useState<string>("")

  const handleSave = () => {
    const total = parseInt(totalProgradInput)
    if (isNaN(total) || total < 0) {
      toast({
        title: "Valor Inválido",
        description: "Digite um número válido de bolsas.",
        variant: "destructive",
      })
      return
    }
    onSave({
      ano: filters.ano,
      semestre: filters.semestre,
      totalBolsas: total,
    })
    setTotalProgradInput("")
  }

  const handleClose = () => {
    setTotalProgradInput("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Definir Total de Bolsas PROGRAD</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Total de bolsas disponibilizadas pela PROGRAD</label>
            <Input
              type="number"
              min="0"
              placeholder="Digite o número de bolsas"
              value={totalProgradInput}
              onChange={(e) => setTotalProgradInput(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Este é o número total de bolsas que a PROGRAD disponibilizou para o período {filters.ano}.
              {getSemestreNumero(filters.semestre)}
            </p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>Importante:</strong> Este valor define o limite máximo de bolsas que podem ser alocadas aos
              projetos.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
