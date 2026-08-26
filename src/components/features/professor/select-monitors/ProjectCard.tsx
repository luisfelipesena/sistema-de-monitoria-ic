"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { MonitorProject } from "@/types/monitor-selection"
import { Award, ChevronDown, ChevronUp, User, Users } from "lucide-react"
import { useState } from "react"
import { CandidateRow } from "./CandidateColumns"

interface ProjectCardProps {
  project: MonitorProject
  onOpenSelection: (project: MonitorProject) => void
  isPublishing: boolean
}

function hasPendingSelection(project: MonitorProject): boolean {
  // Project has pending selection if there are candidates with CONFIRMED_INTEREST
  // who haven't been selected as bolsista/voluntario yet
  const confirmedInterest = project.inscricoes.filter((i) => i.status === "CONFIRMED_INTEREST")
  const alreadySelected = project.inscricoes.filter(
    (i) => i.status === "SELECTED_BOLSISTA" || i.status === "SELECTED_VOLUNTARIO" ||
           i.status === "ACCEPTED_BOLSISTA" || i.status === "ACCEPTED_VOLUNTARIO"
  )
  const maxBolsistas = project.bolsasDisponibilizadas || 0
  const maxVoluntarios = project.voluntariosSolicitados || 0
  const totalVagas = maxBolsistas + maxVoluntarios

  return confirmedInterest.length > 0 && alreadySelected.length < totalVagas
}

export function ProjectCard({ project, onOpenSelection, isPublishing }: ProjectCardProps) {
  const [isExpanded, setIsExpanded] = useState(hasPendingSelection(project))
  const pending = hasPendingSelection(project)

  return (
    <Card className={`transition-shadow ${pending ? 'border-amber-400 bg-amber-50/30 shadow-md' : 'hover:shadow-md'}`}>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl">{project.titulo}</CardTitle>
              {pending && (
                <Badge variant="warning" className="text-xs">
                  Seleção Pendente
                </Badge>
              )}
            </div>
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
                {project.inscricoes.length} candidatos
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="shrink-0">
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
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
                      <TableHead className="w-36">Status</TableHead>
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

              {(() => {
                const bolsasDisponibilizadas = project.bolsasDisponibilizadas || 0
                const bolsistasAceitos = project.inscricoes.filter((i) => i.status === "ACCEPTED_BOLSISTA")
                const allBolsasFilled = bolsistasAceitos.length >= bolsasDisponibilizadas && bolsasDisponibilizadas > 0

                if (allBolsasFilled) {
                  return (
                    <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-green-800">
                          Todas as vagas de bolsa foram preenchidas ({bolsistasAceitos.length}/{bolsasDisponibilizadas})
                        </span>
                      </div>
                      <div className="space-y-1 ml-7">
                        {bolsistasAceitos.map((inscricao) => (
                          <p key={inscricao.id} className="text-sm text-green-700">
                            • <strong>{inscricao.aluno.nomeCompleto}</strong> — Matrícula: {inscricao.aluno.matricula || "N/A"}
                          </p>
                        ))}
                      </div>
                    </div>
                  )
                }

                return (
                  <div className="flex gap-2 pt-2">
                    <Button onClick={() => onOpenSelection(project)} disabled={isPublishing} className="flex-1">
                      <Users className="h-4 w-4 mr-2" />
                      Selecionar Monitores
                    </Button>
                  </div>
                )
              })()}
            </>
          ) : (
            <div className="text-center py-8">
              <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum candidato inscrito neste projeto</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
