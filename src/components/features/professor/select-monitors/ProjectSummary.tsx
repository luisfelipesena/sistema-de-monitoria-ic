import { Card, CardContent } from "@/components/ui/card"
import { Award, GraduationCap, Users } from "lucide-react"
import type { MonitorProject } from "@/types/monitor-selection"

interface ProjectSummaryProps {
  projects: MonitorProject[]
}

export function ProjectSummary({ projects }: ProjectSummaryProps) {
  const totalBolsas = projects.reduce((sum, p) => sum + (p.bolsasDisponibilizadas || 0), 0)
  const totalCandidatos = projects.reduce((sum, p) => sum + p.inscricoes.length, 0)

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-blue-500" />
            <div>
              <div className="text-2xl font-bold">{projects.length}</div>
              <p className="text-sm text-muted-foreground">Projetos</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Award className="h-8 w-8 text-yellow-500" />
            <div>
              <div className="text-2xl font-bold">{totalBolsas}</div>
              <p className="text-sm text-muted-foreground">Bolsas Disponíveis</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Users className="h-8 w-8 text-green-500" />
            <div>
              <div className="text-2xl font-bold">{totalCandidatos}</div>
              <p className="text-sm text-muted-foreground">Candidatos Total</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
