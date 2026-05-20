import { StatusBadge } from "@/components/atoms/StatusBadge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SEMESTRE_1, TIPO_VAGA_BOLSISTA, type MonitorConsolidado, type TipoVaga, getTipoVagaLabel } from "@/types"
import { Award, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ConsolidacaoTableProps {
  data: MonitorConsolidado[] | undefined
  selectedYear: number
  selectedSemester: string
  isLoading: boolean
}

function getTipoIcon(tipo: TipoVaga) {
  return tipo === TIPO_VAGA_BOLSISTA ? (
    <Award className="h-4 w-4 text-yellow-600" />
  ) : (
    <Users className="h-4 w-4 text-blue-600" />
  )
}

export function ConsolidacaoTable({ data, selectedYear, selectedSemester, isLoading }: ConsolidacaoTableProps) {
  if (!data || data.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Monitores do Período {selectedYear}.{selectedSemester === SEMESTRE_1 ? "1" : "2"}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{data.length} monitor(es) encontrado(s)</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Carregando dados...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((item) => (
              <div key={item.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getTipoIcon(item.monitoria.tipo as TipoVaga)}
                      <h3 className="font-semibold text-lg">{item.monitor.nome}</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground mb-3">
                      <p>Matrícula: {item.monitor.matricula || "N/A"}</p>
                      <p>CR: {item.monitor.cr?.toFixed(2) || "N/A"}</p>
                      <p>E-mail: {item.monitor.email}</p>
                      <p>Professor: {item.professor.nome}</p>
                      <p>Projeto: {item.projeto.titulo}</p>
                      <p>Disciplinas: {item.projeto.disciplinas}</p>
                      <p>Carga Horária: {item.projeto.cargaHorariaSemana}h/semana</p>
                      {item.monitoria.valorBolsa && <p>Valor Bolsa: R$ {item.monitoria.valorBolsa.toFixed(2)}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={item.monitoria.tipo === TIPO_VAGA_BOLSISTA ? "bg-yellow-500" : "bg-blue-500"}>
                        {getTipoVagaLabel(item.monitoria.tipo as TipoVaga)}
                      </Badge>
                      <StatusBadge status={item.monitoria.status} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
