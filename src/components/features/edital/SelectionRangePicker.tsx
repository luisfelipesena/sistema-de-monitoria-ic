
export interface SelectionRangeValue {
  dataInicioSelecao: string // ISO date
  dataFimSelecao: string // ISO date
  horarioInicioSelecao: string // "08:00"
  horarioFimSelecao: string // "18:00"
}

export interface SelectionRangePickerProps {
  value: SelectionRangeValue
  onChange: (value: SelectionRangeValue) => void
  disabled?: boolean
}

export function SelectionRangePicker({
  value,
  onChange,
  disabled = false,
}: SelectionRangePickerProps) {
  function handleChange(field: keyof SelectionRangeValue, fieldValue: string) {
    onChange({ ...value, [field]: fieldValue })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Data Início
          </label>
          <input
            type="date"
            className="block w-full rounded-md px-3 py-2.5 text-sm transition-colors outline-none border bg-white h-[40px] border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600"
            value={value.dataInicioSelecao}
            onChange={(e) => handleChange("dataInicioSelecao", e.target.value)}
            disabled={disabled}
            aria-label="Data início da seleção"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Data Fim
          </label>
          <input
            type="date"
            className="block w-full rounded-md px-3 py-2.5 text-sm transition-colors outline-none border bg-white h-[40px] border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600"
            value={value.dataFimSelecao}
            onChange={(e) => handleChange("dataFimSelecao", e.target.value)}
            disabled={disabled}
            aria-label="Data fim da seleção"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Horário Início
          </label>
          <input
            type="time"
            className="block w-full rounded-md px-3 py-2.5 text-sm transition-colors outline-none border bg-white h-[40px] border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600"
            value={value.horarioInicioSelecao}
            onChange={(e) => handleChange("horarioInicioSelecao", e.target.value)}
            disabled={disabled}
            aria-label="Horário início da seleção"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Horário Fim
          </label>
          <input
            type="time"
            className="block w-full rounded-md px-3 py-2.5 text-sm transition-colors outline-none border bg-white h-[40px] border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600"
            value={value.horarioFimSelecao}
            onChange={(e) => handleChange("horarioFimSelecao", e.target.value)}
            disabled={disabled}
            aria-label="Horário fim da seleção"
          />
        </div>
      </div>
    </div>
  )
}
