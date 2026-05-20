import { Card, CardContent } from "@/components/ui/card"
import { FileText, Award, Users, TrendingUp } from "lucide-react"

interface RelatorioGeral {
  projetos: {
    total: number
    aprovados: number
    totalBolsasDisponibilizadas: number
    totalBolsasSolicitadas: number
  }
  inscricoes: {
    total: number
  }
  vagas: {
    total: number
  }
}

interface SummaryCardsProps {
  data: RelatorioGeral | undefined
}

export function SummaryCards({ data }: SummaryCardsProps) {
  if (!data) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Projetos</p>
              <p className="text-2xl font-semibold">
                {data.projetos.aprovados}/{data.projetos.total}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Bolsas</p>
              <p className="text-2xl font-semibold">
                {data.projetos.totalBolsasDisponibilizadas}/{data.projetos.totalBolsasSolicitadas}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-sm text-muted-foreground">Inscrições</p>
              <p className="text-2xl font-semibold">{data.inscricoes.total}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-600" />
            <div>
              <p className="text-sm text-muted-foreground">Vagas Preenchidas</p>
              <p className="text-2xl font-semibold">{data.vagas.total}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
