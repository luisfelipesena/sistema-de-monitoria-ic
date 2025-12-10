import { useState } from 'react'
import type { Semestre } from '@/types'
import { SEMESTRE_1, SEMESTRE_2 } from '@/types'

interface TableFiltersConfig {
  defaultYear?: number
  defaultSemester?: Semestre
  defaultStatus?: string
}

interface TableFilters {
  year: number
  semester: Semestre
  status: string
  search: string
}

export function useTableFilters(config: TableFiltersConfig = {}) {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()
  const currentSemester = currentMonth < 6 ? SEMESTRE_1 : SEMESTRE_2

  const [filters, setFilters] = useState<TableFilters>({
    year: config.defaultYear ?? currentYear,
    semester: config.defaultSemester ?? currentSemester,
    status: config.defaultStatus ?? 'all',
    search: '',
  })

  const updateFilter = <K extends keyof TableFilters>(key: K, value: TableFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const resetFilters = () => {
    setFilters({
      year: currentYear,
      semester: currentSemester,
      status: 'all',
      search: '',
    })
  }

  // Clear all filters (no defaults - show all data)
  const clearFilters = () => {
    setFilters({
      year: 0, // 0 means "all years"
      semester: '' as Semestre, // empty means "all semesters"
      status: 'all',
      search: '',
    })
  }

  return { filters, updateFilter, resetFilters, clearFilters }
}
