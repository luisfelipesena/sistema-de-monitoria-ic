import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { FilterOption } from '@/types/table'
import type { Column } from '@tanstack/react-table'
import { Check, Filter, X } from 'lucide-react'

interface DataTableColumnFilterProps<TData, TValue> {
  column: Column<TData, TValue>
  title: string
  type: 'text' | 'select' | 'multiselect'
  options?: FilterOption[]
  placeholder?: string
}

export function DataTableColumnFilter<TData, TValue>({
  column,
  title,
  type,
  options = [],
  placeholder,
}: DataTableColumnFilterProps<TData, TValue>) {
  const filterValue = column.getFilterValue()
  const isFiltered = filterValue !== undefined && filterValue !== null && filterValue !== ''

  // For multiselect, check if array has items
  const hasActiveFilter = type === 'multiselect' ? Array.isArray(filterValue) && filterValue.length > 0 : isFiltered

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn('h-8 w-8 p-0', hasActiveFilter && 'text-primary')}
          title={`Filtrar ${title}`}
        >
          <Filter className="h-4 w-4" />
          {hasActiveFilter && (
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <div className="p-2">
          <p className="text-sm font-medium mb-2">Filtrar {title}</p>
        </div>
        <Separator />
        {type === 'text' && (
          <TextFilter
            value={(filterValue as string) ?? ''}
            onChange={(value) => column.setFilterValue(value || undefined)}
            placeholder={placeholder ?? `Buscar ${title.toLowerCase()}...`}
          />
        )}
        {type === 'select' && (
          <SelectFilter
            value={(filterValue as string) ?? ''}
            onChange={(value) => column.setFilterValue(value || undefined)}
            options={options}
            placeholder={placeholder ?? `Selecionar ${title.toLowerCase()}...`}
          />
        )}
        {type === 'multiselect' && (
          <MultiselectFilter
            value={(filterValue as string[]) ?? []}
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
                onClick={() => column.setFilterValue(undefined)}
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

// Text filter component
function TextFilter({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <div className="p-2">
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8"
      />
    </div>
  )
}

// Single select filter component
function SelectFilter({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  options: FilterOption[]
  placeholder: string
}) {
  return (
    <Command>
      <CommandInput placeholder={placeholder} className="h-9" />
      <CommandList>
        <CommandEmpty>Nenhum resultado</CommandEmpty>
        <CommandGroup>
          {options.map((option) => {
            const isSelected = value === option.value
            return (
              <CommandItem
                key={option.value}
                value={option.value}
                onSelect={() => onChange(isSelected ? '' : option.value)}
              >
                <div
                  className={cn(
                    'mr-2 flex h-4 w-4 items-center justify-center rounded-full border border-primary',
                    isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible'
                  )}
                >
                  <Check className="h-3 w-3" />
                </div>
                <span>{option.label}</span>
              </CommandItem>
            )
          })}
        </CommandGroup>
      </CommandList>
    </Command>
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
