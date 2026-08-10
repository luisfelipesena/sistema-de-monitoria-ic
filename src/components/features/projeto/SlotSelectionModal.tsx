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
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { SlotDataHorario } from "@/types/selecao-inputs"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

interface SlotSelectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  slots: SlotDataHorario[]
  currentSelection?: SlotDataHorario
  onConfirm: (slot: SlotDataHorario) => void
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

export function SlotSelectionModal({
  open,
  onOpenChange,
  slots,
  currentSelection,
  onConfirm,
  isLoading = false,
}: SlotSelectionModalProps) {
  const [selectedValue, setSelectedValue] = useState<string>("")

  useEffect(() => {
    if (open && currentSelection) {
      setSelectedValue(slotToValue(currentSelection))
    } else if (open) {
      setSelectedValue("")
    }
  }, [open, currentSelection])

  const handleConfirm = () => {
    const slot = valueToSlot(selectedValue, slots)
    if (slot) {
      onConfirm(slot)
    }
  }

  const handleClose = (nextOpen: boolean) => {
    if (!isLoading) {
      onOpenChange(nextOpen)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Escolher Data da Seleção</DialogTitle>
          <DialogDescription>
            Selecione uma das opções de data e horário disponíveis para a prova de seleção.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <RadioGroup
            value={selectedValue}
            onValueChange={setSelectedValue}
            disabled={isLoading}
            className="space-y-3"
          >
            {slots.map((slot) => {
              const value = slotToValue(slot)
              return (
                <div key={value} className="flex items-center space-x-3">
                  <RadioGroupItem value={value} id={value} />
                  <Label
                    htmlFor={value}
                    className="cursor-pointer text-sm font-normal leading-relaxed"
                  >
                    {formatSlotLabel(slot)}
                  </Label>
                </div>
              )
            })}
          </RadioGroup>
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
            disabled={isLoading || !selectedValue}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Confirmando...
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
