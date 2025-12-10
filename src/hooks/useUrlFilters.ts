import { getCurrentSemester } from '@/utils/utils'
import type { ColumnFiltersState } from '@tanstack/react-table'
import { parseAsArrayOf, parseAsString, useQueryStates } from 'nuqs'
import { useCallback, useEffect, useMemo, useRef } from 'react'

// ============================================================================
// Constants - Single source of truth for filter keys
// ============================================================================

/** Array filters (multiselect) */
export const ARRAY_FILTER_KEYS = [
  'ano',
  'semestre',
  'status',
  'role',
  'departamentoId',
  'regime',
  'tipoProfessor',
] as const

/** String filters (text/autocomplete) */
export const STRING_FILTER_KEYS = [
  'disciplina',
  'username',
  'email',
  'cursoNome',
  'professorNome',
  'nomeCompleto',
  'emailInstitucional',
  'codigo',
  'nome',
  'titulo',
] as const

/** All supported filter keys */
export const ALL_FILTER_KEYS = [...ARRAY_FILTER_KEYS, ...STRING_FILTER_KEYS] as const

export type ArrayFilterKey = (typeof ARRAY_FILTER_KEYS)[number]
export type StringFilterKey = (typeof STRING_FILTER_KEYS)[number]
export type FilterKey = (typeof ALL_FILTER_KEYS)[number]

// ============================================================================
// Options & Return Types
// ============================================================================

export interface UseUrlFiltersOptions {
  /** Whether to initialize with current semester filters (ano + semestre) on first visit */
  useCurrentSemester?: boolean
}

export interface UseUrlFiltersReturn {
  /** Current column filters state (TanStack Table compatible) */
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
  /** Raw URL state (for building API filters) */
  urlState: UrlFilterState
  /** Update URL state directly */
  setUrlState: (update: Partial<Record<string, string | string[] | null>>) => void
}

// ============================================================================
// URL State Type
// ============================================================================

interface UrlFilterState {
  // Array filters
  ano: string[]
  semestre: string[]
  status: string[]
  role: string[]
  departamentoId: string[]
  regime: string[]
  tipoProfessor: string[]
  // String filters
  disciplina: string
  username: string
  email: string
  cursoNome: string
  professorNome: string
  nomeCompleto: string
  emailInstitucional: string
  codigo: string
  nome: string
  titulo: string
  // Internal marker
  cleared: string
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Base hook for managing column filters with URL state persistence via nuqs.
 * Supports all common filter types used across admin/professor pages.
 *
 * Uses a 'cleared' URL param to track if user explicitly cleared filters,
 * preventing defaults from being re-applied.
 */
export function useUrlFilters(options?: UseUrlFiltersOptions): UseUrlFiltersReturn {
  const hasAppliedDefaults = useRef(false)
  const { year: currentYear, semester: currentSemester } = getCurrentSemester()

  const [urlState, setUrlStateRaw] = useQueryStates({
    // Array filters
    ano: parseAsArrayOf(parseAsString).withDefault([]),
    semestre: parseAsArrayOf(parseAsString).withDefault([]),
    status: parseAsArrayOf(parseAsString).withDefault([]),
    role: parseAsArrayOf(parseAsString).withDefault([]),
    departamentoId: parseAsArrayOf(parseAsString).withDefault([]),
    regime: parseAsArrayOf(parseAsString).withDefault([]),
    tipoProfessor: parseAsArrayOf(parseAsString).withDefault([]),
    // String filters
    disciplina: parseAsString.withDefault(''),
    username: parseAsString.withDefault(''),
    email: parseAsString.withDefault(''),
    cursoNome: parseAsString.withDefault(''),
    professorNome: parseAsString.withDefault(''),
    nomeCompleto: parseAsString.withDefault(''),
    emailInstitucional: parseAsString.withDefault(''),
    codigo: parseAsString.withDefault(''),
    nome: parseAsString.withDefault(''),
    titulo: parseAsString.withDefault(''),
    // Internal marker
    cleared: parseAsString.withDefault(''),
  })

  // Wrapper for setUrlState to handle type conversion
  const setUrlState = useCallback(
    (update: Partial<Record<string, string | string[] | number | null>>) => {
      setUrlStateRaw(update)
    },
    [setUrlStateRaw]
  )

  // Check if URL already has any filter params (excluding cleared marker)
  const hasExistingFilters = useMemo(() => {
    return (
      urlState.ano.length > 0 ||
      urlState.semestre.length > 0 ||
      urlState.status.length > 0 ||
      urlState.role.length > 0 ||
      urlState.departamentoId.length > 0 ||
      urlState.regime.length > 0 ||
      urlState.tipoProfessor.length > 0 ||
      urlState.disciplina !== '' ||
      urlState.username !== '' ||
      urlState.email !== '' ||
      urlState.cursoNome !== '' ||
      urlState.professorNome !== '' ||
      urlState.nomeCompleto !== '' ||
      urlState.emailInstitucional !== '' ||
      urlState.codigo !== '' ||
      urlState.nome !== '' ||
      urlState.titulo !== ''
    )
  }, [urlState])

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
  const columnFilters = useMemo((): ColumnFiltersState => {
    const filters: ColumnFiltersState = []

    // Use URL values if they exist, otherwise use defaults if applicable
    const anoValue = urlState.ano.length > 0 ? urlState.ano : shouldShowDefaults ? [String(currentYear)] : []
    const semestreValue = urlState.semestre.length > 0 ? urlState.semestre : shouldShowDefaults ? [currentSemester] : []

    // Array filters
    if (anoValue.length > 0) filters.push({ id: 'ano', value: anoValue })
    if (semestreValue.length > 0) filters.push({ id: 'semestre', value: semestreValue })
    if (urlState.status.length > 0) filters.push({ id: 'status', value: urlState.status })
    if (urlState.role.length > 0) filters.push({ id: 'role', value: urlState.role })
    if (urlState.departamentoId.length > 0) filters.push({ id: 'departamentoId', value: urlState.departamentoId })
    if (urlState.regime.length > 0) filters.push({ id: 'regime', value: urlState.regime })
    if (urlState.tipoProfessor.length > 0) filters.push({ id: 'tipoProfessor', value: urlState.tipoProfessor })

    // String filters
    if (urlState.disciplina) filters.push({ id: 'disciplina', value: urlState.disciplina })
    if (urlState.username) filters.push({ id: 'username', value: urlState.username })
    if (urlState.email) filters.push({ id: 'email', value: urlState.email })
    if (urlState.cursoNome) filters.push({ id: 'cursoNome', value: urlState.cursoNome })
    if (urlState.professorNome) filters.push({ id: 'professorNome', value: urlState.professorNome })
    if (urlState.nomeCompleto) filters.push({ id: 'nomeCompleto', value: urlState.nomeCompleto })
    if (urlState.emailInstitucional) filters.push({ id: 'emailInstitucional', value: urlState.emailInstitucional })
    if (urlState.codigo) filters.push({ id: 'codigo', value: urlState.codigo })
    if (urlState.nome) filters.push({ id: 'nome', value: urlState.nome })
    if (urlState.titulo) filters.push({ id: 'titulo', value: urlState.titulo })

    return filters
  }, [urlState, shouldShowDefaults, currentYear, currentSemester])

  // Setter compatible with TanStack Table's onColumnFiltersChange
  const setColumnFilters = useCallback(
    (updaterOrValue: ColumnFiltersState | ((prev: ColumnFiltersState) => ColumnFiltersState)) => {
      const newFilters = typeof updaterOrValue === 'function' ? updaterOrValue(columnFilters) : updaterOrValue

      // Build update object with all filters set to null initially
      const newUrlState: Record<string, string | string[] | null> = {}
      for (const key of ALL_FILTER_KEYS) {
        newUrlState[key] = null
      }
      newUrlState.cleared = null

      // Apply new filter values
      for (const filter of newFilters) {
        const { id, value } = filter
        if (ARRAY_FILTER_KEYS.includes(id as ArrayFilterKey) && Array.isArray(value) && value.length > 0) {
          newUrlState[id] = value.map(String)
        } else if (STRING_FILTER_KEYS.includes(id as StringFilterKey) && value) {
          newUrlState[id] = String(value)
        }
      }

      setUrlState(newUrlState)
    },
    [columnFilters, setUrlState]
  )

  const clearAllFilters = useCallback(() => {
    const update: Record<string, string | null> = { cleared: '1' }
    for (const key of ALL_FILTER_KEYS) {
      update[key] = null
    }
    setUrlState(update)
  }, [setUrlState])

  const clearFilter = useCallback(
    (columnId: string) => {
      if (ALL_FILTER_KEYS.includes(columnId as FilterKey)) {
        setUrlState({ [columnId]: null })
      }
    },
    [setUrlState]
  )

  const setFilter = useCallback(
    (columnId: string, value: unknown) => {
      if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
        clearFilter(columnId)
        return
      }

      const update: Record<string, string | string[] | null> = { cleared: null }

      if (ARRAY_FILTER_KEYS.includes(columnId as ArrayFilterKey) && Array.isArray(value)) {
        update[columnId] = value.map(String)
      } else if (STRING_FILTER_KEYS.includes(columnId as StringFilterKey)) {
        update[columnId] = String(value)
      }

      setUrlState(update)
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
    urlState,
    setUrlState,
  }
}
