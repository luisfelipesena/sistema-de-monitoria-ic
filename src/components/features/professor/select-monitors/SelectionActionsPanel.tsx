import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { TIPO_VAGA_BOLSISTA, TIPO_VAGA_VOLUNTARIO } from "@/types"
import type { MonitorCandidate, MonitorProject, SelectionState } from "@/types/monitor-selection"
import { Award, Check, Users } from "lucide-react"

interface SelectionActionsPanelProps {
  project: MonitorProject
  selectedCandidates: SelectionState
  feedback: string
  onFeedbackChange: (value: string) => void
  onSelectCandidate: (inscricaoId: number, tipo: "bolsista" | "voluntario") => void
}

export function SelectionActionsPanel({
  project,
  selectedCandidates,
  feedback,
  onFeedbackChange,
  onSelectCandidate,
}: SelectionActionsPanelProps) {
  const bolsistaCandidates = project.inscricoes
    .filter((c) => (c.tipoVagaPretendida || "") === TIPO_VAGA_BOLSISTA)
    .sort((a, b) => (Number(b.notaFinal) || 0) - (Number(a.notaFinal) || 0))

  const voluntarioCandidates = project.inscricoes
    .filter((c) => (c.tipoVagaPretendida || "") === TIPO_VAGA_VOLUNTARIO)
    .sort((a, b) => (Number(b.notaFinal) || 0) - (Number(a.notaFinal) || 0))

  return (
    <div className="space-y-6">
      {/* Selection Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                <span className="font-medium">Bolsistas</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {selectedCandidates.bolsistas.length} / {project.bolsasDisponibilizadas || 0}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <span className="font-medium">Voluntários</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {selectedCandidates.voluntarios.length} / {project.voluntariosSolicitados || 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Candidates Selection */}
      <div className="space-y-4">
        {/* Bolsistas Section */}
        {(project.bolsasDisponibilizadas || 0) > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3 flex flex-wrap items-center gap-2">
              <Award className="h-4 w-4 text-yellow-500" />
              Candidatos a Bolsista
            </h4>
            <div className="space-y-2">
              {bolsistaCandidates.map((inscricao, index) => (
                <CandidateSelectionCard
                  key={inscricao.id}
                  candidate={inscricao}
                  index={index}
                  isSelected={selectedCandidates.bolsistas.includes(inscricao.id)}
                  onClick={() => onSelectCandidate(inscricao.id, "bolsista")}
                  type="bolsista"
                />
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Voluntários Section */}
        {(project.voluntariosSolicitados || 0) > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3 flex flex-wrap items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              Candidatos a Voluntário
            </h4>
            <div className="space-y-2">
              {voluntarioCandidates.map((inscricao, index) => (
                <CandidateSelectionCard
                  key={inscricao.id}
                  candidate={inscricao}
                  index={index}
                  isSelected={selectedCandidates.voluntarios.includes(inscricao.id)}
                  onClick={() => onSelectCandidate(inscricao.id, "voluntario")}
                  type="voluntario"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Feedback */}
      <div>
        <Label htmlFor="feedback">Observações (Opcional)</Label>
        <Textarea
          id="feedback"
          placeholder="Comentários sobre a seleção..."
          value={feedback}
          onChange={(e) => onFeedbackChange(e.target.value)}
          className="mt-1"
        />
      </div>
    </div>
  )
}

interface CandidateSelectionCardProps {
  candidate: MonitorCandidate
  index: number
  isSelected: boolean
  onClick: () => void
  type: "bolsista" | "voluntario"
}

function CandidateSelectionCard({ candidate, index, isSelected, onClick, type }: CandidateSelectionCardProps) {
  const bgColor = type === "bolsista" ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"
  const wasRejectedByStudent = candidate.status === "REJECTED_BY_STUDENT"
  const wasRemovedByProfessor = candidate.status === "WAITING_LIST"
  const isCurrentlySelectedForBolsa = candidate.status === "SELECTED_BOLSISTA"
  const isCurrentlySelectedForVoluntario = candidate.status === "SELECTED_VOLUNTARIO"
  const isCurrentlySelected = isCurrentlySelectedForBolsa || isCurrentlySelectedForVoluntario

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 ${
        isSelected ? "border-primary bg-primary/5" : ""
      } ${wasRejectedByStudent ? "border-red-300 bg-red-50" : ""} ${wasRemovedByProfessor ? "border-orange-200 bg-orange-50/50" : ""} ${isCurrentlySelected && !isSelected ? "border-green-300 bg-green-50" : ""}`}
      onClick={onClick}
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${bgColor} text-sm font-medium`}>
          {index + 1}
        </div>
        <div>
          <div className="font-medium">{candidate.aluno.nomeCompleto}</div>
          <div className="text-sm text-muted-foreground">
            {candidate.aluno.matricula} • CR: {candidate.aluno.cr !== null && candidate.aluno.cr !== undefined ? Number(candidate.aluno.cr).toFixed(2) : "N/A"} • Final:{" "}
            {candidate.notaFinal !== null && candidate.notaFinal !== undefined ? Number(candidate.notaFinal).toFixed(1) : "Pendente"}
          </div>
          {isCurrentlySelected && (
            <div className="text-xs text-green-700 font-medium mt-1">
              ✅ Atualmente selecionado para {isCurrentlySelectedForBolsa ? "bolsa" : "voluntário"}
            </div>
          )}
          {wasRejectedByStudent && (
            <div className="text-xs text-red-700 font-semibold mt-1">
              ❌ Recusou bolsa anteriormente
            </div>
          )}
          {wasRemovedByProfessor && (
            <div className="text-xs text-orange-600 font-medium mt-1">
              ⚠️ Selecionado para bolsa anteriormente pelo professor
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {isSelected ? (
          <Check className="h-5 w-5 text-primary" />
        ) : (
          <div className="h-5 w-5 border border-muted-foreground/30 rounded" />
        )}
      </div>
    </div>
  )
}
