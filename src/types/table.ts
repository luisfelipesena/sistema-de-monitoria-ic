import type { ColumnDef, ColumnFiltersState } from '@tanstack/react-table'

/**
 * Strictly typed column definition
 */
export type StrictColumnDef<TData> = ColumnDef<TData, unknown>

// ========================================
// COLUMN FILTER TYPES
// ========================================

/**
 * Filter option for select/multiselect filters
 */
export interface FilterOption {
  value: string
  label: string
}

/**
 * Configuration for a filterable column
 */
export interface FilterableColumnConfig {
  /** Column ID (accessorKey) */
  columnId: string
  /** Type of filter control */
  type: 'text' | 'select' | 'multiselect'
  /** Options for select/multiselect filters */
  options?: FilterOption[]
  /** Placeholder text for the filter input */
  placeholder?: string
}

/**
 * Props for the column filter component
 */
export interface ColumnFilterProps {
  /** Current filter value */
  value: unknown
  /** Callback to update filter value */
  onChange: (value: unknown) => void
  /** Filter configuration */
  config: FilterableColumnConfig
}

/**
 * Props for the filter header component
 */
export interface DataTableFilterHeaderProps {
  /** Column title to display */
  title: string
  /** Whether the column is sortable */
  sortable?: boolean
  /** Filter configuration (if filterable) */
  filterConfig?: Omit<FilterableColumnConfig, 'columnId'>
}

/**
 * Column filters state helper type
 */
export type { ColumnFiltersState }

/**
 * Initial column filter value
 */
export interface InitialColumnFilter {
  id: string
  value: unknown
}

/**
 * Helper to create type-safe column definitions
 */
export function createColumns<TData>(columns: StrictColumnDef<TData>[]): StrictColumnDef<TData>[] {
  return columns
}

/**
 * Type-safe accessor key builder
 * Simplified to avoid excessive type instantiation depth
 */
export type AccessorKey<T> = keyof T | string

/**
 * Create column with strict accessor typing
 */
export function createAccessorColumn<TData, TKey extends AccessorKey<TData>>(
  key: TKey,
  config: Omit<StrictColumnDef<TData>, 'accessorKey'> & { accessorKey?: never }
): StrictColumnDef<TData> {
  return {
    ...config,
    accessorKey: key,
  } as StrictColumnDef<TData>
}
