import { getCurrentSemester } from '@/utils/utils'
import { useMemo } from 'react'

export interface CurrentSemesterDefaults {
  year: number
  semester: string
  yearString: string
  /** For filter arrays (multiselect) */
  yearArray: string[]
  semesterArray: string[]
}

/**
 * Hook that provides current semester defaults for filters
 * Computes once and memoizes the values
 */
export function useCurrentSemesterDefaults(): CurrentSemesterDefaults {
  return useMemo(() => {
    const { year, semester } = getCurrentSemester()
    return {
      year,
      semester,
      yearString: String(year),
      yearArray: [String(year)],
      semesterArray: [semester],
    }
  }, [])
}
