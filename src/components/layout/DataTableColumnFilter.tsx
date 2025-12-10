import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { FilterOption } from '@/types/table'
import type { Column } from '@tanstack/react-table'
import { Filter, X } from 'lucide-react'
import { useState, useEffect, type KeyboardEvent, useMemo } from 'react'

interface DataTableColumnFilterProps<TData, TValue> {
  column: Column<TData, TValue>
  title: string
  type: 'text' | 'select' | 'multiselect' | 'number'
  options?: FilterOption[]
  placeholder?: string
  /** When true, uses a wider dropdown (good for disciplina filters) */
  wide?: boolean
  /** Autocomplete options for text filter (shows suggestions) */
  autocompleteOptions?: FilterOption[]
}

// Helper to check if filter has active value
function checkHasActiveFilter(filterValue: unknown, type: string): boolean {
  if (filterValue === undefined || filterValue === null) return false
  if ((type === 'text' || type === 'number') && filterValue === '') return false
  if (Array.isArray(filterValue)) return filterValue.length > 0
  return true
}

export function DataTableColumnFilter<TData, TValue>({
  column,
  title,
  type,
  options = [],
  placeholder,
  wide = false,
  autocompleteOptions,
}: DataTableColumnFilterProps<TData, TValue>) {
  const filterValue = column.getFilterValue()
  const hasActiveFilter = checkHasActiveFilter(filterValue, type)

  // Determine if we use multiselect (select type is now multiselect too)
  const useMultiselect = type === 'select' || type === 'multiselect'

  // Handle clear filter
  const handleClearFilter = () => {
    column.setFilterValue(undefined)
  }

  const popoverWidth = wide ? 'w-[320px]' : 'w-[200px]'

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn('h-8 w-8 p-0 relative', hasActiveFilter && 'text-primary')}
          title={`Filtrar ${title}`}
        >
          <Filter className="h-4 w-4" />
          {hasActiveFilter && (
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-destructive border-2 border-background" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn(popoverWidth, 'p-0')} align="start">
        <div className="p-2">
          <p className="text-sm font-medium mb-2">Filtrar {title}</p>
        </div>
        <Separator />
        {type === 'text' && autocompleteOptions && autocompleteOptions.length > 0 ? (
          <TextFilterWithAutocomplete
            value={(filterValue as string) ?? ''}
            onChange={(value) => column.setFilterValue(value || undefined)}
            placeholder={placeholder ?? `Buscar ${title.toLowerCase()}...`}
            options={autocompleteOptions}
          />
        ) : type === 'text' ? (
          <TextFilter
            value={(filterValue as string) ?? ''}
            onChange={(value) => column.setFilterValue(value || undefined)}
            placeholder={placeholder ?? `Buscar ${title.toLowerCase()}...`}
          />
        ) : null}
        {type === 'number' && (
          <NumberFilterWithSuggestions
            value={Array.isArray(filterValue) ? filterValue : filterValue ? [String(filterValue)] : []}
            onChange={(value) => column.setFilterValue(value.length > 0 ? value : undefined)}
            placeholder={placeholder ?? `Digite ou selecione...`}
            options={options}
          />
        )}
        {useMultiselect && (
          <MultiselectFilter
            value={Array.isArray(filterValue) ? filterValue : filterValue ? [String(filterValue)] : []}
            onChange={(value) => column.setFilterValue(value.length > 0 ? value : undefined)}
            options={options}
            placeholder={placeholder ?? `Buscar ${title.toLowerCase()}...`}
          />
        )}
        {hasActiveFilter && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground"
                onClick={handleClearFilter}
              >
                <X className="mr-2 h-4 w-4" />
                Limpar filtro
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}

// Text filter component - only commits on blur or Enter key
function TextFilter({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  const [localValue, setLocalValue] = useState(value)

  // Sync local value when external value changes (e.g., when filter is cleared)
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleCommit = () => {
    onChange(localValue)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommit()
    }
  }

  return (
    <div className="p-2">
      <Input
        placeholder={placeholder}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleCommit}
        onKeyDown={handleKeyDown}
        className="h-8"
      />
    </div>
  )
}

// Text filter with autocomplete suggestions
function TextFilterWithAutocomplete({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  options: FilterOption[]
}) {
  const [localValue, setLocalValue] = useState(value)
  const [isOpen, setIsOpen] = useState(false)

  // Sync local value when external value changes
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  // Filter options based on input
  const filteredOptions = useMemo(() => {
    if (!localValue) return options.slice(0, 10) // Show first 10 when empty
    const searchLower = localValue.toLowerCase()
    return options.filter(
      (opt) =>
        opt.value.toLowerCase().includes(searchLower) || opt.label.toLowerCase().includes(searchLower)
    ).slice(0, 10)
  }, [localValue, options])

  const handleCommit = () => {
    onChange(localValue)
    setIsOpen(false)
  }

  const handleSelect = (optionValue: string) => {
    setLocalValue(optionValue)
    onChange(optionValue)
    setIsOpen(false)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommit()
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div className="p-2 relative">
      <Input
        placeholder={placeholder}
        value={localValue}
        onChange={(e) => {
          setLocalValue(e.target.value)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          // Delay to allow click on option
          setTimeout(() => {
            handleCommit()
            setIsOpen(false)
          }, 150)
        }}
        onKeyDown={handleKeyDown}
        className="h-8"
      />
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute left-2 right-2 top-full mt-1 z-50 bg-popover border rounded-md shadow-md max-h-[200px] overflow-y-auto">
          {filteredOptions.map((option, index) => (
            <button
              key={`${option.value}-${index}`}
              type="button"
              className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
              onMouseDown={(e) => {
                e.preventDefault()
                handleSelect(option.value)
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Number filter with input + suggestions (multiselect)
function NumberFilterWithSuggestions({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string[]
  onChange: (value: string[]) => void
  placeholder: string
  options: FilterOption[]
}) {
  const [inputValue, setInputValue] = useState('')

  const handleAddNumber = () => {
    const trimmed = inputValue.trim()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
      setInputValue('')
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddNumber()
    }
  }

  const toggleOption = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue]
    onChange(newValue)
  }

  const removeValue = (val: string) => {
    onChange(value.filter((v) => v !== val))
  }

  return (
    <div className="p-2 space-y-2">
      <div className="flex gap-1">
        <Input
          type="number"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-8 flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddNumber}
          disabled={!inputValue.trim()}
          className="h-8 px-2"
        >
          +
        </Button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full"
            >
              {v}
              <button
                type="button"
                onClick={() => removeValue(v)}
                className="hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      {options.length > 0 && (
        <>
          <Separator />
          <p className="text-xs text-muted-foreground">Sugestões:</p>
          <div className="flex flex-wrap gap-1 max-h-[120px] overflow-y-auto">
            {options.map((option) => {
              const isSelected = value.includes(option.value)
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleOption(option.value)}
                  className={cn(
                    'px-2 py-1 text-xs rounded border transition-colors',
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-accent border-input'
                  )}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// Multiselect filter component
function MultiselectFilter({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string[]
  onChange: (value: string[]) => void
  options: FilterOption[]
  placeholder: string
}) {
  const toggleOption = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue]
    onChange(newValue)
  }

  return (
    <Command>
      <CommandInput placeholder={placeholder} className="h-9" />
      <CommandList>
        <CommandEmpty>Nenhum resultado</CommandEmpty>
        <CommandGroup>
          {options.map((option) => {
            const isSelected = value.includes(option.value)
            return (
              <CommandItem key={option.value} value={option.value} onSelect={() => toggleOption(option.value)}>
                <Checkbox checked={isSelected} className="mr-2" />
                <span>{option.label}</span>
              </CommandItem>
            )
          })}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}
