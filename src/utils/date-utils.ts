/**
 * Utility functions for formatting date-only columns from PostgreSQL.
 *
 * PostgreSQL `date` columns (without timezone) are read by Drizzle as
 * `Date` objects set to midnight UTC (e.g., "2026-08-25" → 2026-08-25T00:00:00.000Z).
 *
 * Using local getters (getDate, getMonth, getFullYear) on these Date objects
 * causes a -1 day shift in any negative-offset timezone (e.g., UTC-3 Brazil).
 *
 * These helpers use UTC getters to extract the correct day/month/year.
 */

/**
 * Formats a date-only Date (midnight UTC) as DD/MM/YYYY using UTC getters.
 */
export function formatDateUTC(date: Date | string | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''
  const day = String(d.getUTCDate()).padStart(2, '0')
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const year = d.getUTCFullYear()
  return `${day}/${month}/${year}`
}

/**
 * Formats a date-only Date (midnight UTC) as DD/MM/YY using UTC getters.
 */
export function formatDateShortUTC(date: Date | string | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''
  const day = String(d.getUTCDate()).padStart(2, '0')
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const year = String(d.getUTCFullYear()).slice(-2)
  return `${day}/${month}/${year}`
}

/**
 * Formats a date-only Date (midnight UTC) in extended Brazilian format:
 * "25 de agosto de 2026"
 */
export function formatDateExtendedUTC(date: Date | string | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''
  const months = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
  ]
  return `${d.getUTCDate()} de ${months[d.getUTCMonth()]} de ${d.getUTCFullYear()}`
}

/**
 * Formats a date-only Date (midnight UTC) in long Brazilian format:
 * "25 de agosto de 2026" (DD de MMMM de YYYY)
 * Uses Intl with timeZone UTC to avoid day shift.
 */
export function formatDateLongUTC(date: Date | string | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d)
}

/**
 * Formats a date-only Date (midnight UTC) as DD/MM/YYYY using Intl with timeZone UTC.
 */
export function formatDateFullUTC(date: Date | string | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d)
}

/**
 * Formats a date-only Date (midnight UTC) as DD/MM/YY using Intl with timeZone UTC.
 */
export function formatDateBRShortUTC(date: Date | string | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    timeZone: 'UTC',
  }).format(d)
}

/**
 * Converts a date-only Date from midnight UTC to a local Date at noon,
 * preserving the correct day. Use this when you need a Date object (not a string)
 * for form fields or datepickers.
 */
export function utcDateToLocal(d: Date | string | null | undefined): Date | undefined {
  if (!d) return undefined
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return undefined
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12, 0, 0)
}
