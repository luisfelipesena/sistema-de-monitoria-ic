import type { ColumnFiltersState } from '@tanstack/react-table'
import { useUrlFilters, type UseUrlFiltersOptions } from './useUrlFilters'

// Re-export types for backwards compatibility
export type { UseUrlFiltersOptions as UseUrlColumnFiltersOptions }

export interface UseUrlColumnFiltersReturn {
  /** Current column filters state */
  columnFilters: ColumnFiltersState
  /** Setter for column filters - for TanStack Table compatibility */
  setColumnFilters: React.Dispatch<React.SetStateAction<ColumnFiltersState>>
  /** Clear all filters */
  clearAllFilters: () => void
  /** Clear a specific filter by column ID */
  clearFilter: (columnId: string) => void
  /** Set a specific filter value */
  setFilter: (columnId: string, value: unknown) => void
  /** Get current filter value for a column */
  getFilterValue: (columnId: string) => unknown
  /** Number of active filters */
  activeFilterCount: number
  /** Check if a column has an active filter */
  hasFilter: (columnId: string) => boolean
}

/**
 * Hook for managing column filters with URL state persistence via nuqs.
 * Supports all common filter types used across admin/professor pages.
 *
 * This is a thin wrapper around useUrlFilters for client-side filtering.
 * For server-side pagination + filtering, use useServerPagination instead.
 */
export function useUrlColumnFilters(options?: UseUrlFiltersOptions): UseUrlColumnFiltersReturn {
  const {
    columnFilters,
    setColumnFilters,
    clearAllFilters,
    clearFilter,
    setFilter,
    getFilterValue,
    activeFilterCount,
    hasFilter,
  } = useUrlFilters(options)

  return {
    columnFilters,
    setColumnFilters,
    clearAllFilters,
    clearFilter,
    setFilter,
    getFilterValue,
    activeFilterCount,
    hasFilter,
  }
}
