import { getCurrentSemester } from '@/utils/utils'
import type { ColumnFiltersState } from '@tanstack/react-table'
import { useCallback, useMemo, useState } from 'react'

export interface UseColumnFiltersOptions {
  /** Default filters to initialize with */
  defaultFilters?: ColumnFiltersState
  /** Whether to initialize with current semester filters (ano + semestre) */
  useCurrentSemester?: boolean
}

export interface UseColumnFiltersReturn {
  /** Current column filters state */
  columnFilters: ColumnFiltersState
  /** Setter for column filters */
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
 * Hook for managing column filters with optional current semester initialization
 */
export function useColumnFilters(options?: UseColumnFiltersOptions): UseColumnFiltersReturn {
  const defaultValue = useMemo(() => {
    if (options?.defaultFilters && options.defaultFilters.length > 0) {
      return options.defaultFilters
    }
    if (options?.useCurrentSemester) {
      const { year, semester } = getCurrentSemester()
      return [
        { id: 'ano', value: String(year) },
        { id: 'semestre', value: semester },
      ]
    }
    return []
  }, [options?.defaultFilters, options?.useCurrentSemester])

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(defaultValue)

  const clearAllFilters = useCallback(() => {
    setColumnFilters([])
  }, [])

  const clearFilter = useCallback((columnId: string) => {
    setColumnFilters((prev) => prev.filter((f) => f.id !== columnId))
  }, [])

  const setFilter = useCallback((columnId: string, value: unknown) => {
    setColumnFilters((prev) => {
      const existing = prev.findIndex((f) => f.id === columnId)
      if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
        // Remove filter if value is empty
        return prev.filter((f) => f.id !== columnId)
      }
      if (existing >= 0) {
        // Update existing filter
        const updated = [...prev]
        updated[existing] = { id: columnId, value }
        return updated
      }
      // Add new filter
      return [...prev, { id: columnId, value }]
    })
  }, [])

  const getFilterValue = useCallback(
    (columnId: string): unknown => {
      const filter = columnFilters.find((f) => f.id === columnId)
      return filter?.value
    },
    [columnFilters]
  )

  const hasFilter = useCallback(
    (columnId: string): boolean => {
      return columnFilters.some((f) => f.id === columnId)
    },
    [columnFilters]
  )

  const activeFilterCount = columnFilters.length

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

/**
 * Helper to create semester filter options
 */
export function createSemesterFilterOptions() {
  return [
    { value: 'SEMESTRE_1', label: '1º Semestre' },
    { value: 'SEMESTRE_2', label: '2º Semestre' },
  ]
}

/**
 * Helper to create year filter options
 */
export function createYearFilterOptions(startYear = 2024, endYear?: number) {
  const currentYear = new Date().getFullYear()
  const end = endYear ?? currentYear + 1
  const options = []
  for (let year = startYear; year <= end; year++) {
    options.push({ value: year.toString(), label: year.toString() })
  }
  return options
}
