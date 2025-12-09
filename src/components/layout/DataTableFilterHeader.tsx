import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { FilterOption } from '@/types/table'
import type { Column, Header } from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { DataTableColumnFilter } from './DataTableColumnFilter'

interface DataTableFilterHeaderProps<TData, TValue> {
  column: Column<TData, TValue>
  title: string
  sortable?: boolean
  filterType?: 'text' | 'select' | 'multiselect'
  filterOptions?: FilterOption[]
  filterPlaceholder?: string
}

export function DataTableFilterHeader<TData, TValue>({
  column,
  title,
  sortable = false,
  filterType,
  filterOptions,
  filterPlaceholder,
}: DataTableFilterHeaderProps<TData, TValue>) {
  const isSorted = column.getIsSorted()

  return (
    <div className="flex items-center gap-1">
      {sortable ? (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 data-[state=open]:bg-accent"
          onClick={() => column.toggleSorting(isSorted === 'asc')}
        >
          <span>{title}</span>
          {isSorted === 'asc' ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : isSorted === 'desc' ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ) : (
        <span>{title}</span>
      )}
      {filterType && (
        <DataTableColumnFilter
          column={column}
          title={title}
          type={filterType}
          options={filterOptions}
          placeholder={filterPlaceholder}
        />
      )}
    </div>
  )
}

/**
 * Helper to create header with filter for column definitions
 */
export function createFilterableHeader<TData>(config: {
  title: string
  sortable?: boolean
  filterType?: 'text' | 'select' | 'multiselect'
  filterOptions?: FilterOption[]
  filterPlaceholder?: string
}) {
  return ({ column }: { column: Column<TData, unknown> }) => (
    <DataTableFilterHeader
      column={column}
      title={config.title}
      sortable={config.sortable}
      filterType={config.filterType}
      filterOptions={config.filterOptions}
      filterPlaceholder={config.filterPlaceholder}
    />
  )
}
