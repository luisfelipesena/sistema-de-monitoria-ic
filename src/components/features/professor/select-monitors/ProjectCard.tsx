import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Award, Users, User } from "lucide-react"
import type { MonitorProject } from "@/types/monitor-selection"
import { CandidateRow } from "./CandidateColumns"

interface ProjectCardProps {
  project: MonitorProject
  onOpenSelection: (project: MonitorProject) => void
  isPublishing: boolean
}

export function ProjectCard({ project, onOpenSelection, isPublishing }: ProjectCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">{project.titulo}</CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Award className="h-4 w-4 text-yellow-600" />
                {project.bolsasDisponibilizadas || 0} bolsas
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-blue-600" />
                {project.voluntariosSolicitados || 0} voluntários
              </div>
              <div className="flex items-center gap-1">
                <User className="h-4 w-4 text-muted-foreground" />
                {project.inscricoes.length} inscricaos
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {project.inscricoes.length > 0 ? (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidato</TableHead>
                    <TableHead className="w-24">CR</TableHead>
                    <TableHead className="w-20">Disc.</TableHead>
                    <TableHead className="w-20">Seleção</TableHead>
                    <TableHead className="w-20">Final</TableHead>
                    <TableHead className="w-32">Tipo Vaga</TableHead>
                    <TableHead className="w-32">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {project.inscricoes
                    .sort((a, b) => (Number(b.notaFinal) || 0) - (Number(a.notaFinal) || 0))
                    .map((inscricao) => (
                      <CandidateRow key={inscricao.id} candidate={inscricao} />
                    ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={() => onOpenSelection(project)} disabled={isPublishing} className="flex-1">
                <Users className="h-4 w-4 mr-2" />
                Selecionar Monitores
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum inscricao inscrito neste projeto</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
