import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { SlotDataHorario } from "@/types/selecao-inputs"
import { Plus, Trash2 } from "lucide-react"

export interface SlotDateTimePickerProps {
  value: SlotDataHorario[]
  onChange: (slots: SlotDataHorario[]) => void
  minSlots?: number
  maxSlots?: number
  disabled?: boolean
}

const DEFAULT_MIN_SLOTS = 2
const DEFAULT_MAX_SLOTS = 3

export function SlotDateTimePicker({
  value,
  onChange,
  minSlots = DEFAULT_MIN_SLOTS,
  maxSlots = DEFAULT_MAX_SLOTS,
  disabled = false,
}: SlotDateTimePickerProps) {
  const canAdd = value.length < maxSlots
  const canRemove = value.length > minSlots

  function handleAddSlot() {
    if (!canAdd) return
    onChange([...value, { data: "", horario: "" }])
  }

  function handleRemoveSlot(index: number) {
    if (!canRemove) return
    const updated = value.filter((_, i) => i !== index)
    onChange(updated)
  }

  function handleSlotChange(index: number, field: keyof SlotDataHorario, fieldValue: string) {
    const updated = value.map((slot, i) =>
      i === index ? { ...slot, [field]: fieldValue } : slot
    )
    onChange(updated)
  }

  return (
    <div className="space-y-3">
      {value.map((slot, index) => (
        <div key={index} className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Data
            </label>
            <input
              type="date"
              className="block w-full rounded-md px-3 py-2.5 text-sm transition-colors outline-none border bg-white h-[40px] border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600"
              value={slot.data}
              onChange={(e) => handleSlotChange(index, "data", e.target.value)}
              disabled={disabled}
              aria-label={`Data do slot ${index + 1}`}
            />
          </div>

          <div className="flex-1">
            <Input
              label="Horário"
              placeholder="Ex: 14:00-16:00"
              value={slot.horario}
              onChange={(e) => handleSlotChange(index, "horario", e.target.value)}
              disabled={disabled}
              aria-label={`Horário do slot ${index + 1}`}
            />
          </div>

          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={() => handleRemoveSlot(index)}
            disabled={disabled || !canRemove}
            aria-label={`Remover slot ${index + 1}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddSlot}
        disabled={disabled || !canAdd}
      >
        <Plus className="h-4 w-4" />
        Adicionar
      </Button>
    </div>
  )
}
