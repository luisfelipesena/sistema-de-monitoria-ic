import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Award, Users } from "lucide-react"

interface ProgradManagementCardProps {
  totalPrograd: number
  totalAlocadas: number
  bolsasRestantes: number
  excedeuLimite: boolean
  limiteConfigurado: boolean
  onOpenProgradDialog: () => void
  onNotifyProfessors: () => void
  isNotifying: boolean
}

export function ProgradManagementCard({
  totalPrograd,
  totalAlocadas,
  bolsasRestantes,
  excedeuLimite,
  limiteConfigurado,
  onOpenProgradDialog,
  onNotifyProfessors,
  isNotifying,
}: ProgradManagementCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestão de Bolsas PROGRAD</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Total PROGRAD</p>
              <p className="text-3xl font-bold text-blue-600">{totalPrograd}</p>
              <p className="text-xs text-muted-foreground mt-1">bolsas disponibilizadas</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Alocadas</p>
              <p className="text-3xl font-bold text-purple-600">{totalAlocadas}</p>
              <p className="text-xs text-muted-foreground mt-1">nos projetos</p>
            </div>
            <div className={`p-4 rounded-lg ${excedeuLimite ? "bg-red-50 border border-red-200" : "bg-green-50"}`}>
              <p className="text-sm text-muted-foreground mb-1">Restantes</p>
              <p className={`text-3xl font-bold ${excedeuLimite ? "text-red-600" : "text-green-600"}`}>
                {bolsasRestantes}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{excedeuLimite ? "limite excedido" : "disponíveis"}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={onOpenProgradDialog} variant="outline">
              <Award className="h-4 w-4 mr-2" />
              Definir Total PROGRAD
            </Button>
            <Button onClick={onNotifyProfessors} disabled={isNotifying} className="bg-green-600 hover:bg-green-700">
              <Users className="h-4 w-4 mr-2" />
              Notificar Professores
            </Button>
          </div>
        </div>
        {!limiteConfigurado && (
          <p className="text-xs text-red-600 mt-3">
            Defina o total de bolsas informado pela PROGRAD antes de iniciar a distribuição.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
