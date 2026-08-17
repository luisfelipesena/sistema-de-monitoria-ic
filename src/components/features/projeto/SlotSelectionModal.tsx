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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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

/**
 * Gera todas as datas (dia a dia) entre dataInicio e dataFim (inclusive).
 */
function generateDateOptions(dataInicio: string, dataFim: string): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = []
  const start = new Date(`${dataInicio}T00:00:00`)
  const end = new Date(`${dataFim}T00:00:00`)

  const current = new Date(start)
  while (current <= end) {
    const isoDate = current.toISOString().split("T")[0]
    const label = new Intl.DateTimeFormat("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(current)
    options.push({ value: isoDate, label })
    current.setDate(current.getDate() + 1)
  }

  return options
}

/**
 * Gera os horários em intervalos de 30 minutos entre horarioInicio e horarioFim.
 */
function generateTimeOptions(horarioInicio: string, horarioFim: string): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = []

  const [startH, startM] = horarioInicio.split(":").map(Number)
  const [endH, endM] = horarioFim.split(":").map(Number)

  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM

  for (let mins = startMinutes; mins <= endMinutes; mins += 30) {
    const h = Math.floor(mins / 60).toString().padStart(2, "0")
    const m = (mins % 60).toString().padStart(2, "0")
    const time = `${h}:${m}`
    options.push({ value: time, label: time })
  }

  return options
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
    { data: "", horario: "" },
  ])

  useEffect(() => {
    if (open && currentSelections && currentSelections.length > 0) {
      setSelections([...currentSelections])
    } else if (open) {
      setSelections([{ data: "", horario: "" }, { data: "", horario: "" }])
    }
  }, [open, currentSelections])

  // Gerar opções de data e horário baseadas no range do admin
  const dateOptions = useMemo(() => {
    if (!rangeSelecao) return []
    return generateDateOptions(rangeSelecao.dataInicio, rangeSelecao.dataFim)
  }, [rangeSelecao])

  const timeOptions = useMemo(() => {
    if (!rangeSelecao?.horarioInicio || !rangeSelecao?.horarioFim) return []
    return generateTimeOptions(rangeSelecao.horarioInicio, rangeSelecao.horarioFim)
  }, [rangeSelecao])

  const hasRange = !!rangeSelecao && dateOptions.length > 0
  const canAdd = selections.length < 3
  const canRemove = selections.length > 2

  const allFilled = selections.every((s) => s.data && s.horario)
  const canSubmit = allFilled && selections.length >= 2

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
    if (validSlots.length > 0) {
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
            Selecione entre 2 e 3 datas e horários de início para a prova de seleção.
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
                  {hasRange ? (
                    <Select
                      value={slot.data}
                      onValueChange={(val) => handleSlotChange(index, "data", val)}
                      disabled={isLoading}
                    >
                      <SelectTrigger aria-label={`Data do slot ${index + 1}`}>
                        <SelectValue placeholder="Selecione a data" />
                      </SelectTrigger>
                      <SelectContent>
                        {dateOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <input
                      type="date"
                      className="block w-full rounded-md px-3 py-2.5 text-sm transition-colors outline-none border bg-white h-[40px] border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                      value={slot.data}
                      onChange={(e) => handleSlotChange(index, "data", e.target.value)}
                      disabled={isLoading}
                      aria-label={`Data do slot ${index + 1}`}
                    />
                  )}
                </div>

                <div className="flex-1">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Horário {index + 1}
                  </label>
                  {hasRange && timeOptions.length > 0 ? (
                    <Select
                      value={slot.horario}
                      onValueChange={(val) => handleSlotChange(index, "horario", val)}
                      disabled={isLoading}
                    >
                      <SelectTrigger aria-label={`Horário do slot ${index + 1}`}>
                        <SelectValue placeholder="Selecione o horário" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <input
                      type="time"
                      className="block w-full rounded-md px-3 py-2.5 text-sm transition-colors outline-none border bg-white h-[40px] border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                      value={slot.horario}
                      onChange={(e) => handleSlotChange(index, "horario", e.target.value)}
                      disabled={isLoading}
                      aria-label={`Horário do slot ${index + 1}`}
                    />
                  )}
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
