import { getCurrentSemester } from '@/utils/utils'
import type { ColumnFiltersState } from '@tanstack/react-table'
import { parseAsArrayOf, parseAsString, useQueryStates } from 'nuqs'
import { useCallback, useEffect, useMemo, useRef } from 'react'

export interface UseUrlColumnFiltersOptions {
  /** Whether to initialize with current semester filters (ano + semestre) on first visit */
  useCurrentSemester?: boolean
}

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
 * Hook for managing column filters with URL state persistence via nuqs
 * Supports: ano, semestre, status, disciplina, role, username
 *
 * Uses a 'cleared' URL param to track if user explicitly cleared filters,
 * preventing defaults from being re-applied.
 */
export function useUrlColumnFilters(options?: UseUrlColumnFiltersOptions): UseUrlColumnFiltersReturn {
  const hasAppliedDefaults = useRef(false)

  // Get current semester defaults
  const { year: currentYear, semester: currentSemester } = getCurrentSemester()

  const [urlState, setUrlState] = useQueryStates({
    ano: parseAsArrayOf(parseAsString).withDefault([]),
    semestre: parseAsArrayOf(parseAsString).withDefault([]),
    status: parseAsArrayOf(parseAsString).withDefault([]),
    disciplina: parseAsString.withDefault(''),
    role: parseAsArrayOf(parseAsString).withDefault([]),
    username: parseAsString.withDefault(''),
    cleared: parseAsString.withDefault(''), // Marker to track if user explicitly cleared
  })

  // Check if URL already has any filter params (excluding cleared marker)
  const hasExistingFilters = useMemo(() => {
    return (
      urlState.ano.length > 0 ||
      urlState.semestre.length > 0 ||
      urlState.status.length > 0 ||
      urlState.disciplina !== '' ||
      urlState.role.length > 0 ||
      urlState.username !== ''
    )
  }, [urlState.ano, urlState.semestre, urlState.status, urlState.disciplina, urlState.role, urlState.username])

  // Apply defaults on mount if no existing filters and not cleared
  useEffect(() => {
    if (hasAppliedDefaults.current) return
    if (!options?.useCurrentSemester) return
    if (urlState.cleared === '1') return
    if (hasExistingFilters) return

    hasAppliedDefaults.current = true
    setUrlState({
      ano: [String(currentYear)],
      semestre: [currentSemester],
    })
  }, [options?.useCurrentSemester, currentYear, currentSemester, urlState.cleared, hasExistingFilters, setUrlState])

  // Determine if we should show defaults (before URL is updated)
  const shouldShowDefaults = useMemo(() => {
    return options?.useCurrentSemester && !hasExistingFilters && urlState.cleared !== '1'
  }, [options?.useCurrentSemester, hasExistingFilters, urlState.cleared])

  // Convert URL state to TanStack Table column filters format
  // If no filters exist and defaults should be applied, return defaults immediately
  const columnFilters = useMemo((): ColumnFiltersState => {
    const filters: ColumnFiltersState = []

    // Use URL values if they exist, otherwise use defaults if applicable
    const anoValue = urlState.ano.length > 0 ? urlState.ano : shouldShowDefaults ? [String(currentYear)] : []
    const semestreValue =
      urlState.semestre.length > 0 ? urlState.semestre : shouldShowDefaults ? [currentSemester] : []

    if (anoValue.length > 0) {
      filters.push({ id: 'ano', value: anoValue })
    }
    if (semestreValue.length > 0) {
      filters.push({ id: 'semestre', value: semestreValue })
    }
    if (urlState.status && urlState.status.length > 0) {
      filters.push({ id: 'status', value: urlState.status })
    }
    if (urlState.disciplina) {
      filters.push({ id: 'disciplina', value: urlState.disciplina })
    }
    if (urlState.role && urlState.role.length > 0) {
      filters.push({ id: 'role', value: urlState.role })
    }
    if (urlState.username) {
      filters.push({ id: 'username', value: urlState.username })
    }

    return filters
  }, [urlState, shouldShowDefaults, currentYear, currentSemester])

  // Setter compatible with TanStack Table's onColumnFiltersChange
  const setColumnFilters = useCallback(
    (updaterOrValue: ColumnFiltersState | ((prev: ColumnFiltersState) => ColumnFiltersState)) => {
      const newFilters = typeof updaterOrValue === 'function' ? updaterOrValue(columnFilters) : updaterOrValue

      // Convert filters array back to URL state
      const newUrlState: Record<string, string | string[] | null> = {
        ano: null,
        semestre: null,
        status: null,
        disciplina: null,
        role: null,
        username: null,
        cleared: null, // Clear the marker when filters change
      }

      for (const filter of newFilters) {
        if (filter.id === 'ano') {
          newUrlState.ano = Array.isArray(filter.value) && filter.value.length > 0 ? filter.value : null
        } else if (filter.id === 'semestre') {
          newUrlState.semestre = Array.isArray(filter.value) && filter.value.length > 0 ? filter.value : null
        } else if (filter.id === 'status') {
          newUrlState.status = Array.isArray(filter.value) && filter.value.length > 0 ? filter.value : null
        } else if (filter.id === 'disciplina' && filter.value) {
          newUrlState.disciplina = String(filter.value)
        } else if (filter.id === 'role') {
          newUrlState.role = Array.isArray(filter.value) && filter.value.length > 0 ? filter.value : null
        } else if (filter.id === 'username' && filter.value) {
          newUrlState.username = String(filter.value)
        }
      }

      setUrlState(newUrlState)
    },
    [columnFilters, setUrlState]
  )

  const clearAllFilters = useCallback(() => {
    setUrlState({
      ano: null,
      semestre: null,
      status: null,
      disciplina: null,
      role: null,
      username: null,
      cleared: '1', // Mark as explicitly cleared to prevent defaults from re-applying
    })
  }, [setUrlState])

  const clearFilter = useCallback(
    (columnId: string) => {
      if (columnId === 'ano') setUrlState({ ano: null })
      else if (columnId === 'semestre') setUrlState({ semestre: null })
      else if (columnId === 'status') setUrlState({ status: null })
      else if (columnId === 'disciplina') setUrlState({ disciplina: null })
      else if (columnId === 'role') setUrlState({ role: null })
      else if (columnId === 'username') setUrlState({ username: null })
    },
    [setUrlState]
  )

  const setFilter = useCallback(
    (columnId: string, value: unknown) => {
      if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
        clearFilter(columnId)
        return
      }

      // Clear the 'cleared' marker when user sets a filter
      if (columnId === 'ano' && Array.isArray(value)) setUrlState({ ano: value, cleared: null })
      else if (columnId === 'semestre' && Array.isArray(value)) setUrlState({ semestre: value, cleared: null })
      else if (columnId === 'status' && Array.isArray(value)) setUrlState({ status: value, cleared: null })
      else if (columnId === 'disciplina') setUrlState({ disciplina: String(value), cleared: null })
      else if (columnId === 'role' && Array.isArray(value)) setUrlState({ role: value, cleared: null })
      else if (columnId === 'username') setUrlState({ username: String(value), cleared: null })
    },
    [setUrlState, clearFilter]
  )

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
