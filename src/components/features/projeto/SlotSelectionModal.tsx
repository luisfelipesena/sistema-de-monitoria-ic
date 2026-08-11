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
import type { SlotDataHorario } from "@/types/selecao-inputs"
import { AlertCircle, Loader2, Plus, Trash2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

interface RangeSelecao {
  dataInicio: string
  dataFim: string
  horarioInicio: string | null
  horarioFim: string | null
}

interface SlotSelectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  slots?: SlotDataHorario[]
  rangeSelecao?: RangeSelecao | null
  currentSelections?: SlotDataHorario[]
  currentSelection?: SlotDataHorario
  onConfirm: (slots: SlotDataHorario[]) => void
  onConfirmSingle?: (slot: SlotDataHorario) => void
  isLoading?: boolean
}

export function formatSlotLabel(slot: SlotDataHorario): string {
  const [year, month, day] = slot.data.split("-")
  const date = new Date(Number(year), Number(month) - 1, Number(day))
  const formattedDate = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date)

  return `${formattedDate} — ${slot.horario}`
}

export function slotToValue(slot: SlotDataHorario): string {
  return `${slot.data}|${slot.horario}`
}

export function valueToSlot(value: string, slots: SlotDataHorario[]): SlotDataHorario | undefined {
  return slots.find((s) => slotToValue(s) === value)
}

function validateSlot(slot: SlotDataHorario, range: RangeSelecao | null | undefined): string | null {
  if (!slot.data && !slot.horario) return null
  if (!slot.data) return "Informe a data"
  if (!slot.horario) return "Informe o horário"

  if (range) {
    if (slot.data < range.dataInicio || slot.data > range.dataFim) {
      return `Data fora do período permitido (${formatDateBR(range.dataInicio)} a ${formatDateBR(range.dataFim)})`
    }
    if (range.horarioInicio && slot.horario < range.horarioInicio) {
      return `Horário anterior ao permitido (a partir das ${range.horarioInicio})`
    }
    if (range.horarioFim && slot.horario > range.horarioFim) {
      return `Horário posterior ao permitido (até as ${range.horarioFim})`
    }
  }

  return null
}

function formatDateBR(iso: string): string {
  const [year, month, day] = iso.split("-")
  return `${day}/${month}/${year}`
}

export function SlotSelectionModal({
  open,
  onOpenChange,
  rangeSelecao,
  currentSelections,
  onConfirm,
  isLoading = false,
}: SlotSelectionModalProps) {
  const [selections, setSelections] = useState<SlotDataHorario[]>([
    { data: "", horario: "" },
  ])

  useEffect(() => {
    if (open && currentSelections && currentSelections.length > 0) {
      setSelections([...currentSelections])
    } else if (open) {
      setSelections([{ data: "", horario: "" }])
    }
  }, [open, currentSelections])

  const canAdd = selections.length < 3
  const canRemove = selections.length > 1

  // Validate all slots
  const errors = useMemo(() => {
    return selections.map((slot) => validateSlot(slot, rangeSelecao))
  }, [selections, rangeSelecao])

  const hasErrors = errors.some((e) => e !== null)
  const allFilled = selections.every((s) => s.data && s.horario)
  const canSubmit = allFilled && !hasErrors && selections.length >= 1

  function handleAddSlot() {
    if (!canAdd) return
    setSelections([...selections, { data: "", horario: "" }])
  }

  function handleRemoveSlot(index: number) {
    if (!canRemove) return
    setSelections(selections.filter((_, i) => i !== index))
  }

  function handleSlotChange(index: number, field: keyof SlotDataHorario, value: string) {
    const updated = selections.map((slot, i) =>
      i === index ? { ...slot, [field]: value } : slot
    )
    setSelections(updated)
  }

  const handleConfirm = () => {
    const validSlots = selections.filter((s) => s.data && s.horario)
    if (validSlots.length > 0 && !hasErrors) {
      onConfirm(validSlots)
    }
  }

  const handleClose = (nextOpen: boolean) => {
    if (!isLoading) {
      onOpenChange(nextOpen)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Escolher Datas da Seleção</DialogTitle>
          <DialogDescription>
            Selecione até 3 datas e horários de início para a prova de seleção.
          </DialogDescription>
        </DialogHeader>

        {rangeSelecao && (
          <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50/60 px-3 py-2.5">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-800">
              <span className="font-medium">Período permitido:</span>{" "}
              {formatDateBR(rangeSelecao.dataInicio)} a {formatDateBR(rangeSelecao.dataFim)}
              {rangeSelecao.horarioInicio && rangeSelecao.horarioFim && (
                <span>, das {rangeSelecao.horarioInicio} às {rangeSelecao.horarioFim}</span>
              )}
            </p>
          </div>
        )}

        <div className="space-y-4 py-2">
          {selections.map((slot, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Data {index + 1}
                  </label>
                  <input
                    type="date"
                    className={`block w-full rounded-md px-3 py-2.5 text-sm transition-colors outline-none border bg-white h-[40px] focus:ring-2 ${
                      errors[index] && slot.data
                        ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:border-blue-600 focus:ring-blue-200"
                    }`}
                    value={slot.data}
                    onChange={(e) => handleSlotChange(index, "data", e.target.value)}
                    disabled={isLoading}
                    aria-label={`Data do slot ${index + 1}`}
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Horário {index + 1}
                  </label>
                  <input
                    type="time"
                    className={`block w-full rounded-md px-3 py-2.5 text-sm transition-colors outline-none border bg-white h-[40px] focus:ring-2 ${
                      errors[index] && slot.horario
                        ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:border-blue-600 focus:ring-blue-200"
                    }`}
                    value={slot.horario}
                    onChange={(e) => handleSlotChange(index, "horario", e.target.value)}
                    disabled={isLoading}
                    aria-label={`Horário do slot ${index + 1}`}
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveSlot(index)}
                  disabled={isLoading || !canRemove}
                  aria-label={`Remover slot ${index + 1}`}
                  className="h-[40px] w-[40px] shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Error message */}
              {errors[index] && (
                <p className="text-xs text-red-600 flex items-center gap-1 pl-1">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {errors[index]}
                </p>
              )}
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddSlot}
            disabled={isLoading || !canAdd}
            className="w-full border-dashed"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Adicionar mais uma data
          </Button>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || !canSubmit}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Salvando...
              </>
            ) : (
              "Confirmar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
