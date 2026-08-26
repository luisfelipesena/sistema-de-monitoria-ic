"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { MonitorProject, SelectionState } from "@/types/monitor-selection"
import { AlertTriangle, Mail } from "lucide-react"
import { useEffect, useState } from "react"
import { SelectionActionsPanel } from "./SelectionActionsPanel"

interface SelectionDialogProps {
  isOpen: boolean
  onClose: () => void
  project: MonitorProject | null
  selectedCandidates: SelectionState
  feedback: string
  onFeedbackChange: (value: string) => void
  onSelectCandidate: (inscricaoId: number, tipo: "bolsista" | "voluntario") => void
  onSubmit: (motivoTroca?: string) => void
  isSubmitting: boolean
}

export function SelectionDialog({
  isOpen,
  onClose,
  project,
  selectedCandidates,
  feedback,
  onFeedbackChange,
  onSelectCandidate,
  onSubmit,
  isSubmitting,
}: SelectionDialogProps) {
  // Track motivos for each deselected candidate
  const [motivosPorCandidato, setMotivosPorCandidato] = useState<Record<number, string>>({})
  // Track which candidates are pending deselection (waiting for motivo)
  const [pendingDeselection, setPendingDeselection] = useState<number | null>(null)
  const [motivoInput, setMotivoInput] = useState("")

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setMotivosPorCandidato({})
      setPendingDeselection(null)
      setMotivoInput("")
    }
  }, [isOpen])

  if (!project) return null

  const hasSelection = selectedCandidates.bolsistas.length > 0 || selectedCandidates.voluntarios.length > 0

  // Candidates that were previously selected (before dialog opened)
  const previouslySelectedBolsistas = project.inscricoes
    .filter((i) => i.status === "SELECTED_BOLSISTA")
    .map((i) => i.id)
  const previouslySelectedVoluntarios = project.inscricoes
    .filter((i) => i.status === "SELECTED_VOLUNTARIO")
    .map((i) => i.id)

  // Check which previously selected candidates are being removed
  const removedCandidateIds = [
    ...previouslySelectedBolsistas.filter((id) => !selectedCandidates.bolsistas.includes(id)),
    ...previouslySelectedVoluntarios.filter((id) => !selectedCandidates.voluntarios.includes(id)),
  ]

  // All removed candidates must have a motivo
  const allMotivosProvided = removedCandidateIds.every((id) => motivosPorCandidato[id]?.trim())
  const isReplacingCandidate = removedCandidateIds.length > 0
  const canSubmit = hasSelection && (!isReplacingCandidate || allMotivosProvided) && pendingDeselection === null

  // Combine all motivos into one string for the backend
  const getCombinedMotivo = () => {
    if (!isReplacingCandidate) return undefined
    const motivos = removedCandidateIds
      .map((id) => {
        const candidate = project.inscricoes.find((i) => i.id === id)
        const nome = candidate?.aluno.nomeCompleto || `ID ${id}`
        return `${nome}: ${motivosPorCandidato[id]}`
      })
      .join('; ')
    return motivos
  }

  const handleCandidateClick = (inscricaoId: number, tipo: "bolsista" | "voluntario") => {
    const isCurrentlySelected =
      tipo === "bolsista"
        ? selectedCandidates.bolsistas.includes(inscricaoId)
        : selectedCandidates.voluntarios.includes(inscricaoId)

    const wasPreviouslySelected =
      tipo === "bolsista"
        ? previouslySelectedBolsistas.includes(inscricaoId)
        : previouslySelectedVoluntarios.includes(inscricaoId)

    // If deselecting a previously selected candidate, require motivo
    if (isCurrentlySelected && wasPreviouslySelected) {
      setPendingDeselection(inscricaoId)
      setMotivoInput("")
      return
    }

    // Normal selection/deselection
    onSelectCandidate(inscricaoId, tipo)
  }

  const handleConfirmDeselection = () => {
    if (!pendingDeselection || !motivoInput.trim()) return

    setMotivosPorCandidato((prev) => ({
      ...prev,
      [pendingDeselection]: motivoInput.trim(),
    }))

    // Now actually deselect
    const candidate = project.inscricoes.find((i) => i.id === pendingDeselection)
    const tipo = previouslySelectedBolsistas.includes(pendingDeselection) ? "bolsista" : "voluntario"
    onSelectCandidate(pendingDeselection, tipo as "bolsista" | "voluntario")

    setPendingDeselection(null)
    setMotivoInput("")
  }

  const handleCancelDeselection = () => {
    setPendingDeselection(null)
    setMotivoInput("")
  }

  const handleSubmit = () => {
    onSubmit(getCombinedMotivo())
  }

  const pendingCandidateName = pendingDeselection
    ? project.inscricoes.find((i) => i.id === pendingDeselection)?.aluno.nomeCompleto
    : null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Selecionar Monitores</DialogTitle>
          <DialogDescription>{project.titulo}</DialogDescription>
        </DialogHeader>

        {/* Motivo de remoção inline */}
        {pendingDeselection && (
          <div className="border-2 border-red-300 bg-red-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <p className="text-sm font-semibold text-red-800">
                Motivo para remover <strong>{pendingCandidateName}</strong> da bolsa:
              </p>
            </div>
            <Input
              placeholder="Ex: Sem retorno do aluno, preferência por outro candidato..."
              value={motivoInput}
              onChange={(e) => setMotivoInput(e.target.value)}
              className="border-red-200"
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={handleConfirmDeselection}
                disabled={!motivoInput.trim()}
              >
                Confirmar Remoção
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelDeselection}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        <SelectionActionsPanel
          project={project}
          selectedCandidates={selectedCandidates}
          feedback={feedback}
          onFeedbackChange={onFeedbackChange}
          onSelectCandidate={(id, tipo) => handleCandidateClick(id, tipo)}
        />

        {/* Show motivos already provided */}
        {removedCandidateIds.length > 0 && Object.keys(motivosPorCandidato).length > 0 && (
          <div className="border border-orange-200 bg-orange-50 rounded-lg p-3 space-y-1">
            <p className="text-xs font-semibold text-orange-700">Candidatos removidos:</p>
            {removedCandidateIds.map((id) => {
              const candidate = project.inscricoes.find((i) => i.id === id)
              const motivo = motivosPorCandidato[id]
              if (!motivo) return null
              return (
                <p key={id} className="text-xs text-orange-600">
                  • <strong>{candidate?.aluno.nomeCompleto}</strong>: {motivo}
                </p>
              )
            })}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting || !canSubmit}>
            <Mail className="h-4 w-4 mr-2" />
            {isSubmitting ? "Selecionando..." : "Confirmar Seleção"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
