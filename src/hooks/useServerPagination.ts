import { getCurrentSemester } from '@/utils/utils'
import type { ColumnFiltersState } from '@tanstack/react-table'
import { parseAsInteger, useQueryStates } from 'nuqs'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useUrlFilters, type UseUrlFiltersOptions } from './useUrlFilters'

// ============================================================================
// Types
// ============================================================================

export interface UseServerPaginationOptions extends UseUrlFiltersOptions {
  /** Default page size (default: 20) */
  defaultPageSize?: number
}

export interface ApiFilters {
  ano?: number[]
  semestre?: string[]
  status?: string[]
  disciplina?: string
  role?: string[]
  username?: string
  email?: string
  departamentoId?: number[]
  cursoNome?: string
  professorNome?: string
  nomeCompleto?: string
  emailInstitucional?: string
  regime?: string[]
  tipoProfessor?: string[]
  limit: number
  offset: number
}

export interface UseServerPaginationReturn {
  // Pagination state
  page: number
  pageSize: number
  offset: number

  // Pagination setters
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  goToNextPage: () => void
  goToPreviousPage: () => void
  resetPagination: () => void

  // Filter state (TanStack Table compatible)
  columnFilters: ColumnFiltersState
  setColumnFilters: React.Dispatch<React.SetStateAction<ColumnFiltersState>>

  // Filter helpers
  clearAllFilters: () => void
  clearFilter: (columnId: string) => void
  setFilter: (columnId: string, value: unknown) => void
  getFilterValue: (columnId: string) => unknown
  hasFilter: (columnId: string) => boolean
  activeFilterCount: number

  // Combined filters for API calls
  apiFilters: ApiFilters
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for managing server-side pagination with URL-synced filters via nuqs.
 * Extends useUrlFilters with pagination state and API filter building.
 * Automatically resets page to 0 when filters change.
 */
export function useServerPagination(options?: UseServerPaginationOptions): UseServerPaginationReturn {
  const defaultPageSize = options?.defaultPageSize ?? 20
  const previousFiltersRef = useRef<string>('')

  // Use base filter hook
  const {
    columnFilters,
    setColumnFilters: baseSetColumnFilters,
    clearAllFilters: baseClearAllFilters,
    clearFilter,
    setFilter,
    getFilterValue,
    hasFilter,
    activeFilterCount,
    urlState,
  } = useUrlFilters(options)

  // Pagination-specific URL state
  const [paginationState, setPaginationState] = useQueryStates({
    page: parseAsInteger.withDefault(0),
    pageSize: parseAsInteger.withDefault(defaultPageSize),
  })

  const { year: currentYear, semester: currentSemester } = getCurrentSemester()

  // Determine if should show defaults
  const shouldShowDefaults = useMemo(() => {
    const hasExistingFilters =
      urlState.ano.length > 0 ||
      urlState.semestre.length > 0 ||
      urlState.status.length > 0 ||
      urlState.role.length > 0 ||
      urlState.departamentoId.length > 0

    return options?.useCurrentSemester && !hasExistingFilters && urlState.cleared !== '1'
  }, [options?.useCurrentSemester, urlState])

  // Build API filters object
  const apiFilters = useMemo((): ApiFilters => {
    const anoValue = urlState.ano.length > 0 ? urlState.ano : shouldShowDefaults ? [String(currentYear)] : []
    const semestreValue = urlState.semestre.length > 0 ? urlState.semestre : shouldShowDefaults ? [currentSemester] : []

    return {
      ano: anoValue.length > 0 ? anoValue.map(Number) : undefined,
      semestre: semestreValue.length > 0 ? semestreValue : undefined,
      status: urlState.status.length > 0 ? urlState.status : undefined,
      disciplina: urlState.disciplina || undefined,
      role: urlState.role.length > 0 ? urlState.role : undefined,
      username: urlState.username || undefined,
      email: urlState.email || undefined,
      departamentoId: urlState.departamentoId.length > 0 ? urlState.departamentoId.map(Number) : undefined,
      cursoNome: urlState.cursoNome || undefined,
      professorNome: urlState.professorNome || undefined,
      nomeCompleto: urlState.nomeCompleto || undefined,
      emailInstitucional: urlState.emailInstitucional || undefined,
      regime: urlState.regime.length > 0 ? urlState.regime : undefined,
      tipoProfessor: urlState.tipoProfessor.length > 0 ? urlState.tipoProfessor : undefined,
      limit: paginationState.pageSize,
      offset: paginationState.page * paginationState.pageSize,
    }
  }, [urlState, shouldShowDefaults, currentYear, currentSemester, paginationState])

  // Reset page when filters change
  useEffect(() => {
    const currentFiltersKey = JSON.stringify({
      ano: urlState.ano,
      semestre: urlState.semestre,
      status: urlState.status,
      disciplina: urlState.disciplina,
      role: urlState.role,
      username: urlState.username,
      email: urlState.email,
      departamentoId: urlState.departamentoId,
      cursoNome: urlState.cursoNome,
      professorNome: urlState.professorNome,
      nomeCompleto: urlState.nomeCompleto,
      emailInstitucional: urlState.emailInstitucional,
      regime: urlState.regime,
      tipoProfessor: urlState.tipoProfessor,
      codigo: urlState.codigo,
      nome: urlState.nome,
      titulo: urlState.titulo,
    })

    if (previousFiltersRef.current && previousFiltersRef.current !== currentFiltersKey && paginationState.page !== 0) {
      setPaginationState({ page: 0 })
    }

    previousFiltersRef.current = currentFiltersKey
  }, [urlState, paginationState.page, setPaginationState])

  // Pagination setters
  const setPage = useCallback(
    (page: number) => {
      setPaginationState({ page })
    },
    [setPaginationState]
  )

  const setPageSize = useCallback(
    (pageSize: number) => {
      setPaginationState({ pageSize, page: 0 })
    },
    [setPaginationState]
  )

  const goToNextPage = useCallback(() => {
    setPaginationState({ page: paginationState.page + 1 })
  }, [paginationState.page, setPaginationState])

  const goToPreviousPage = useCallback(() => {
    setPaginationState({ page: Math.max(0, paginationState.page - 1) })
  }, [paginationState.page, setPaginationState])

  const resetPagination = useCallback(() => {
    setPaginationState({ page: 0 })
  }, [setPaginationState])

  // Wrap setColumnFilters to reset page
  const setColumnFilters = useCallback(
    (updaterOrValue: ColumnFiltersState | ((prev: ColumnFiltersState) => ColumnFiltersState)) => {
      baseSetColumnFilters(updaterOrValue)
      // Page reset is handled by the useEffect above
    },
    [baseSetColumnFilters]
  )

  // Wrap clearAllFilters to reset page
  const clearAllFilters = useCallback(() => {
    baseClearAllFilters()
    setPaginationState({ page: 0 })
  }, [baseClearAllFilters, setPaginationState])

  return {
    // Pagination
    page: paginationState.page,
    pageSize: paginationState.pageSize,
    offset: paginationState.page * paginationState.pageSize,
    setPage,
    setPageSize,
    goToNextPage,
    goToPreviousPage,
    resetPagination,
    // Filters
    columnFilters,
    setColumnFilters,
    clearAllFilters,
    clearFilter,
    setFilter,
    getFilterValue,
    hasFilter,
    activeFilterCount,
    // API
    apiFilters,
  }
}
